import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { createTestBackend, seedMembership } from "./test-utils.test";

describe("master data auth and tenancy", () => {
	it("rejects unauthenticated supplier listing", async () => {
		const t = createTestBackend();

		await expect(t.query(api.suppliers.listSuppliers, {})).rejects.toThrow(
			"Not authenticated",
		);
	});

	it("rejects supplier creation by staff without owner/admin claims", async () => {
		const t = createTestBackend();
		const { actor: staffActor } = await seedMembership(t, {
			clerkOrgId: "org_staff",
			tokenIdentifier: "tid_staff",
			appRole: "staff",
			orgRole: "member",
		});

		await expect(
			staffActor.mutation(api.suppliers.createSupplier, {
				name: "Unauthorized Supplier",
			}),
		).rejects.toThrow("Unauthorized");
	});

	it("prevents cross-tenant supplier access", async () => {
		const t = createTestBackend();
		const { actor: ownerA } = await seedMembership(t, {
			clerkOrgId: "org_a",
			tokenIdentifier: "tid_owner_a",
		});
		const { actor: ownerB } = await seedMembership(t, {
			clerkOrgId: "org_b",
			tokenIdentifier: "tid_owner_b",
		});

		const supplierBId = await ownerB.mutation(api.suppliers.createSupplier, {
			name: "Supplier B",
		});

		await expect(
			ownerA.query(api.suppliers.getSupplierById, { supplier_id: supplierBId }),
		).rejects.toThrow("Supplier not found in your organization");
	});
});

describe("supplier CRUD", () => {
	it("creates, updates, lists, and deletes supplier records", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_supplier_crud",
			tokenIdentifier: "tid_supplier_owner",
		});

		const supplierId = await owner.mutation(api.suppliers.createSupplier, {
			name: "Acme Supply",
			contact_first_name: "Lina",
			contact_last_name: "Park",
			phone_number: "555-0100",
		});

		const createdSupplier = await owner.query(api.suppliers.getSupplierById, {
			supplier_id: supplierId,
		});
		expect(createdSupplier.name).toBe("Acme Supply");

		await owner.mutation(api.suppliers.updateSupplier, {
			supplier_id: supplierId,
			name: "Acme Global Supply",
			contact_first_name: "Lina",
			contact_last_name: "Park",
			phone_number: "555-0101",
		});

		const updatedSupplier = await owner.query(api.suppliers.getSupplierById, {
			supplier_id: supplierId,
		});
		expect(updatedSupplier.name).toBe("Acme Global Supply");

		const suppliers = await owner.query(api.suppliers.listSuppliers, {});
		expect(suppliers).toHaveLength(1);
		expect(suppliers[0]?.phone_number).toBe("555-0101");

		await owner.mutation(api.suppliers.deleteSupplier, { supplier_id: supplierId });

		const afterDelete = await owner.query(api.suppliers.listSuppliers, {});
		expect(afterDelete).toHaveLength(0);
	});

	it("blocks supplier deletion when supplier is referenced by a batch", async () => {
		const t = createTestBackend();
		const { actor: owner, orgId } = await seedMembership(t, {
			clerkOrgId: "org_supplier_guard",
			tokenIdentifier: "tid_supplier_guard",
		});

		const supplierId = await owner.mutation(api.suppliers.createSupplier, {
			name: "Referenced Supplier",
		});
		const productId = await owner.mutation(api.catalog.createProduct, {
			sku: "RM-001",
			name: "Raw Ingredient",
			base_unit: "kg",
			product_type: "raw_material",
			sellable: false,
			stock_tracked: true,
			track_expiry: true,
			is_bom: false,
			min_stock_level: 1,
		});

		await t.run(async (ctx) => {
			await ctx.db.insert("batches", {
				org_id: orgId,
				product_id: productId,
				supplier_id: supplierId,
				batch_code: "BATCH-001",
				cost_price: 25,
				initial_qty: 5,
				remaining_qty: 5,
				expiry_date: Date.now() + 86_400_000,
				received_at: Date.now(),
			});
		});

		await expect(
			owner.mutation(api.suppliers.deleteSupplier, { supplier_id: supplierId }),
		).rejects.toThrow(
			"Cannot archive supplier because it is referenced by existing batches",
		);
	});
});

describe("categories and products", () => {
	it("prevents category hierarchy cycles", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_category_cycle",
			tokenIdentifier: "tid_category_cycle",
		});

		const rootId = await owner.mutation(api.categories.createCategory, {
			name: "Root",
		});
		const childId = await owner.mutation(api.categories.createCategory, {
			name: "Child",
			parent_category_id: rootId,
		});

		await expect(
			owner.mutation(api.categories.updateCategory, {
				category_id: rootId,
				name: "Root",
				parent_category_id: childId,
			}),
		).rejects.toThrow("Category hierarchy cannot contain cycles");
	});

	it("blocks deleting categories that still have child categories", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_category_guard",
			tokenIdentifier: "tid_category_guard",
		});

		const rootId = await owner.mutation(api.categories.createCategory, {
			name: "Root",
		});
		await owner.mutation(api.categories.createCategory, {
			name: "Child",
			parent_category_id: rootId,
		});

		await expect(
			owner.mutation(api.categories.deleteCategory, { category_id: rootId }),
		).rejects.toThrow(
			"Cannot archive category because it is referenced by child categories",
		);
	});

	it("enforces SKU uniqueness per tenant while allowing same SKU in different tenants", async () => {
		const t = createTestBackend();
		const { actor: ownerA } = await seedMembership(t, {
			clerkOrgId: "org_sku_a",
			tokenIdentifier: "tid_sku_a",
		});
		const { actor: ownerB } = await seedMembership(t, {
			clerkOrgId: "org_sku_b",
			tokenIdentifier: "tid_sku_b",
		});

		await ownerA.mutation(api.catalog.createProduct, {
			sku: "SKU-001",
			name: "Tenant A Product",
			base_unit: "pcs",
			product_type: "sellable",
			sellable: true,
			stock_tracked: true,
			track_expiry: false,
			is_bom: false,
			min_stock_level: 0,
		});

		await expect(
			ownerA.mutation(api.catalog.createProduct, {
				sku: "SKU-001",
				name: "Tenant A Duplicate",
				base_unit: "pcs",
				product_type: "sellable",
				sellable: true,
				stock_tracked: true,
				track_expiry: false,
				is_bom: false,
				min_stock_level: 0,
			}),
		).rejects.toThrow("SKU already exists in your organization");

		const tenantBProductId = await ownerB.mutation(api.catalog.createProduct, {
			sku: "SKU-001",
			name: "Tenant B Product",
			base_unit: "pcs",
			product_type: "sellable",
			sellable: true,
			stock_tracked: true,
			track_expiry: false,
			is_bom: false,
			min_stock_level: 0,
		});

		expect(tenantBProductId).toBeTruthy();
	});

	it("rejects product updates that reference another tenant's category", async () => {
		const t = createTestBackend();
		const { actor: ownerA } = await seedMembership(t, {
			clerkOrgId: "org_product_a",
			tokenIdentifier: "tid_product_a",
		});
		const { actor: ownerB } = await seedMembership(t, {
			clerkOrgId: "org_product_b",
			tokenIdentifier: "tid_product_b",
		});

		const categoryAId = await ownerA.mutation(api.categories.createCategory, {
			name: "Category A",
		});
		const categoryBId = await ownerB.mutation(api.categories.createCategory, {
			name: "Category B",
		});

		const productId = await ownerA.mutation(api.catalog.createProduct, {
			category_id: categoryAId,
			sku: "A-001",
			name: "Product A",
			base_unit: "kg",
			product_type: "raw_material",
			sellable: false,
			stock_tracked: true,
			track_expiry: true,
			is_bom: false,
			min_stock_level: 1,
		});

		await expect(
			ownerA.mutation(api.catalog.updateProduct, {
				product_id: productId,
				category_id: categoryBId,
				sku: "A-001",
				name: "Product A",
				base_unit: "kg",
				product_type: "raw_material",
				sellable: false,
				stock_tracked: true,
				track_expiry: true,
				is_bom: false,
				min_stock_level: 1,
			}),
		).rejects.toThrow("Category not found in your organization");
	});

	it("archives products by setting archived_at", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_product_archive",
			tokenIdentifier: "tid_product_archive",
		});

		const productId = await owner.mutation(api.catalog.createProduct, {
			sku: "ARCH-001",
			name: "Archive Me",
			base_unit: "pcs",
			product_type: "sellable",
			sellable: true,
			stock_tracked: true,
			track_expiry: false,
			is_bom: false,
			min_stock_level: 0,
		});

		await owner.mutation(api.catalog.archiveProduct, { product_id: productId });

		const archived = await owner.query(api.catalog.getProductById, {
			product_id: productId,
		});
		expect(typeof archived.archived_at).toBe("number");
	});
});