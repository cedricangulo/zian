import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { seedMembership, createTestBackend } from "./test-utils";

describe("recipes and BOM rules", () => {
	it("adds and lists recipe lines for a composite product", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_recipe_basic",
			tokenIdentifier: "tid_recipe_basic",
		});

		const parentId = await owner.mutation(api.catalog.createProduct, {
			sku: "COMP-001",
			name: "Combo Meal",
			base_unit: "set",
			product_type: "composite",
			sellable: true,
			stock_tracked: false,
			track_expiry: false,
			is_bom: true,
			min_stock_level: 0,
		});

		const ingredientId = await owner.mutation(api.catalog.createProduct, {
			sku: "ING-001",
			name: "Bread",
			base_unit: "pcs",
			product_type: "raw_material",
			sellable: false,
			stock_tracked: true,
			track_expiry: true,
			is_bom: false,
			min_stock_level: 5,
		});

		const recipeId = await owner.mutation(api.recipes.addRecipeLine, {
			parent_product_id: parentId,
			ingredient_product_id: ingredientId,
			quantity_required: 2,
		});

		const recipeLines = await owner.query(api.recipes.listRecipeLines, {
			parent_product_id: parentId,
		});
		expect(recipeLines).toHaveLength(1);
		expect(recipeLines[0]?._id).toBe(recipeId);
		expect(recipeLines[0]?.quantity_required).toBe(2);
	});

	it("rejects recipe lines when parent product is not recipe-capable", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_recipe_capability",
			tokenIdentifier: "tid_recipe_capability",
		});

		const parentId = await owner.mutation(api.catalog.createProduct, {
			sku: "RM-100",
			name: "Single Raw Product",
			base_unit: "kg",
			product_type: "raw_material",
			sellable: false,
			stock_tracked: true,
			track_expiry: true,
			is_bom: false,
			min_stock_level: 1,
		});

		const ingredientId = await owner.mutation(api.catalog.createProduct, {
			sku: "PK-100",
			name: "Packaging",
			base_unit: "pcs",
			product_type: "packaging",
			sellable: false,
			stock_tracked: true,
			track_expiry: false,
			is_bom: false,
			min_stock_level: 0,
		});

		await expect(
			owner.mutation(api.recipes.addRecipeLine, {
				parent_product_id: parentId,
				ingredient_product_id: ingredientId,
				quantity_required: 1,
			}),
		).rejects.toThrow("Parent product is not recipe-capable");
	});

	it("rejects duplicate ingredients in the same recipe", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_recipe_duplicate",
			tokenIdentifier: "tid_recipe_duplicate",
		});

		const parentId = await owner.mutation(api.catalog.createProduct, {
			sku: "COMP-010",
			name: "Composite",
			base_unit: "set",
			product_type: "composite",
			sellable: true,
			stock_tracked: false,
			track_expiry: false,
			is_bom: true,
			min_stock_level: 0,
		});
		const ingredientId = await owner.mutation(api.catalog.createProduct, {
			sku: "ING-010",
			name: "Ingredient",
			base_unit: "pcs",
			product_type: "raw_material",
			sellable: false,
			stock_tracked: true,
			track_expiry: true,
			is_bom: false,
			min_stock_level: 1,
		});

		await owner.mutation(api.recipes.addRecipeLine, {
			parent_product_id: parentId,
			ingredient_product_id: ingredientId,
			quantity_required: 1,
		});

		await expect(
			owner.mutation(api.recipes.addRecipeLine, {
				parent_product_id: parentId,
				ingredient_product_id: ingredientId,
				quantity_required: 1,
			}),
		).rejects.toThrow("Ingredient already exists in this recipe");
	});

	it("rejects self-referencing recipe lines", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_recipe_self_ref",
			tokenIdentifier: "tid_recipe_self_ref",
		});

		const parentId = await owner.mutation(api.catalog.createProduct, {
			sku: "COMP-SELF",
			name: "Self Ref Composite",
			base_unit: "set",
			product_type: "composite",
			sellable: true,
			stock_tracked: false,
			track_expiry: false,
			is_bom: true,
			min_stock_level: 0,
		});

		await expect(
			owner.mutation(api.recipes.addRecipeLine, {
				parent_product_id: parentId,
				ingredient_product_id: parentId,
				quantity_required: 1,
			}),
		).rejects.toThrow(
			"Parent product cannot reference itself as an ingredient",
		);
	});

	it("rejects BOM cycles across composite products", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_recipe_cycle",
			tokenIdentifier: "tid_recipe_cycle",
		});

		const productAId = await owner.mutation(api.catalog.createProduct, {
			sku: "COMP-A",
			name: "Composite A",
			base_unit: "set",
			product_type: "composite",
			sellable: true,
			stock_tracked: false,
			track_expiry: false,
			is_bom: true,
			min_stock_level: 0,
		});
		const productBId = await owner.mutation(api.catalog.createProduct, {
			sku: "COMP-B",
			name: "Composite B",
			base_unit: "set",
			product_type: "composite",
			sellable: true,
			stock_tracked: false,
			track_expiry: false,
			is_bom: true,
			min_stock_level: 0,
		});

		await owner.mutation(api.recipes.addRecipeLine, {
			parent_product_id: productAId,
			ingredient_product_id: productBId,
			quantity_required: 1,
		});

		await expect(
			owner.mutation(api.recipes.addRecipeLine, {
				parent_product_id: productBId,
				ingredient_product_id: productAId,
				quantity_required: 1,
			}),
		).rejects.toThrow("Recipe cannot create BOM cycles");
	});

	it("enforces tenant boundaries for recipe ingredients", async () => {
		const t = createTestBackend();
		const { actor: ownerA } = await seedMembership(t, {
			clerkOrgId: "org_recipe_tenant_a",
			tokenIdentifier: "tid_recipe_tenant_a",
		});
		const { actor: ownerB } = await seedMembership(t, {
			clerkOrgId: "org_recipe_tenant_b",
			tokenIdentifier: "tid_recipe_tenant_b",
		});

		const parentId = await ownerA.mutation(api.catalog.createProduct, {
			sku: "TENANT-A-COMP",
			name: "Tenant A Composite",
			base_unit: "set",
			product_type: "composite",
			sellable: true,
			stock_tracked: false,
			track_expiry: false,
			is_bom: true,
			min_stock_level: 0,
		});

		const foreignIngredientId = await ownerB.mutation(api.catalog.createProduct, {
			sku: "TENANT-B-ING",
			name: "Tenant B Ingredient",
			base_unit: "pcs",
			product_type: "raw_material",
			sellable: false,
			stock_tracked: true,
			track_expiry: true,
			is_bom: false,
			min_stock_level: 1,
		});

		await expect(
			ownerA.mutation(api.recipes.addRecipeLine, {
				parent_product_id: parentId,
				ingredient_product_id: foreignIngredientId,
				quantity_required: 1,
			}),
		).rejects.toThrow("Ingredient product not found in your organization");
	});
});