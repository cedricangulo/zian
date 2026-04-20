import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { type MutationCtx, mutation, query } from "./_generated/server";
import { writeAuditLog } from "./helpers/audit";
import { requireCurrentContext, requireOwnerContext } from "./helpers/context";

const MAX_RECIPE_LINES = 200;

function ensurePositiveQuantity(quantityRequired: number) {
	if (quantityRequired <= 0) {
		throw new Error("Quantity required must be greater than zero");
	}
}

function ensureCompositeCapableParent(product: {
	is_bom: boolean;
	product_type: "raw_material" | "packaging" | "sellable" | "composite";
}) {
	if (!product.is_bom && product.product_type !== "composite") {
		throw new Error("Parent product is not recipe-capable");
	}
}

async function listIngredientProductIds(
	ctx: MutationCtx,
	orgId: Id<"organizations">,
	parentProductId: Id<"products">,
	ingredientGraphCache: Map<Id<"products">, Id<"products">[]>,
) {
	const cachedIngredientIds = ingredientGraphCache.get(parentProductId);
	if (cachedIngredientIds) {
		return cachedIngredientIds;
	}

	const ingredientLines = await ctx.db
		.query("recipes")
		.withIndex("by_org_id_and_parent_product_id", (q) =>
			q.eq("org_id", orgId).eq("parent_product_id", parentProductId),
		)
		.take(MAX_RECIPE_LINES);

	const ingredientProductIds = ingredientLines.map(
		(line) => line.ingredient_product_id,
	);
	ingredientGraphCache.set(parentProductId, ingredientProductIds);
	return ingredientProductIds;
}

async function hasPathToProduct(
	ctx: MutationCtx,
	orgId: Id<"organizations">,
	startProductId: Id<"products">,
	targetProductId: Id<"products">,
	ingredientGraphCache: Map<Id<"products">, Id<"products">[]>,
) {
	const productsToVisit: Id<"products">[] = [startProductId];
	const visitedProductIds = new Set<Id<"products">>();

	while (productsToVisit.length > 0) {
		const currentProductId = productsToVisit.pop();
		if (!currentProductId) {
			continue;
		}

		if (currentProductId === targetProductId) {
			return true;
		}

		if (visitedProductIds.has(currentProductId)) {
			continue;
		}
		visitedProductIds.add(currentProductId);

		const ingredientProductIds = await listIngredientProductIds(
			ctx,
			orgId,
			currentProductId,
			ingredientGraphCache,
		);
		for (const ingredientProductId of ingredientProductIds) {
			if (!visitedProductIds.has(ingredientProductId)) {
				productsToVisit.push(ingredientProductId);
			}
		}
	}

	return false;
}

async function ensureNoBomCycle(
	ctx: MutationCtx,
	orgId: Id<"organizations">,
	parentProductId: Id<"products">,
	ingredientProductId: Id<"products">,
	ingredientGraphCache: Map<Id<"products">, Id<"products">[]>,
) {
	const createsCycle = await hasPathToProduct(
		ctx,
		orgId,
		ingredientProductId,
		parentProductId,
		ingredientGraphCache,
	);

	if (createsCycle) {
		throw new Error("Recipe cannot create BOM cycles");
	}
}

export const listRecipeLines = query({
	args: {
		parent_product_id: v.id("products"),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireCurrentContext(ctx);

		const parentProduct = await ctx.db.get(args.parent_product_id);
		if (!parentProduct || parentProduct.org_id !== organization._id) {
			throw new Error("Parent product not found in your organization");
		}

		return await ctx.db
			.query("recipes")
			.withIndex("by_org_id_and_parent_product_id", (q) =>
				q
					.eq("org_id", organization._id)
					.eq("parent_product_id", args.parent_product_id),
			)
			.take(MAX_RECIPE_LINES);
	},
});

export const addRecipeLine = mutation({
	args: {
		parent_product_id: v.id("products"),
		ingredient_product_id: v.id("products"),
		quantity_required: v.number(),
	},
	handler: async (ctx, args) => {
		const { organization, user } = await requireOwnerContext(ctx);

		if (args.parent_product_id === args.ingredient_product_id) {
			throw new Error(
				"Parent product cannot reference itself as an ingredient",
			);
		}

		ensurePositiveQuantity(args.quantity_required);

		const parentProduct = await ctx.db.get(args.parent_product_id);
		if (!parentProduct || parentProduct.org_id !== organization._id) {
			throw new Error("Parent product not found in your organization");
		}

		ensureCompositeCapableParent(parentProduct);

		const ingredientProduct = await ctx.db.get(args.ingredient_product_id);
		if (!ingredientProduct || ingredientProduct.org_id !== organization._id) {
			throw new Error("Ingredient product not found in your organization");
		}

		const existingLine = await ctx.db
			.query("recipes")
			.withIndex(
				"by_org_id_and_parent_product_id_and_ingredient_product_id",
				(q) =>
					q
						.eq("org_id", organization._id)
						.eq("parent_product_id", args.parent_product_id)
						.eq("ingredient_product_id", args.ingredient_product_id),
			)
			.take(1);

		if (existingLine.length > 0) {
			throw new Error("Ingredient already exists in this recipe");
		}

		await ensureNoBomCycle(
			ctx,
			organization._id,
			args.parent_product_id,
			args.ingredient_product_id,
			new Map<Id<"products">, Id<"products">[]>(),
		);

		const recipeId = await ctx.db.insert("recipes", {
			org_id: organization._id,
			parent_product_id: args.parent_product_id,
			ingredient_product_id: args.ingredient_product_id,
			quantity_required: args.quantity_required,
		});

		await writeAuditLog(ctx, {
			orgId: organization._id,
			userId: user._id,
			actionType: "create",
			entityAffected: "recipes",
			recordId: recipeId,
			changeLog: {
				next: {
					parent_product_id: args.parent_product_id,
					ingredient_product_id: args.ingredient_product_id,
					quantity_required: args.quantity_required,
				},
			},
		});

		return recipeId;
	},
});

export const updateRecipeLine = mutation({
	args: {
		recipe_id: v.id("recipes"),
		quantity_required: v.number(),
	},
	handler: async (ctx, args) => {
		const { organization, user } = await requireOwnerContext(ctx);

		ensurePositiveQuantity(args.quantity_required);

		const recipe = await ctx.db.get(args.recipe_id);
		if (!recipe || recipe.org_id !== organization._id) {
			throw new Error("Recipe line not found in your organization");
		}

		await ctx.db.patch(args.recipe_id, {
			quantity_required: args.quantity_required,
		});

		await writeAuditLog(ctx, {
			orgId: organization._id,
			userId: user._id,
			actionType: "update",
			entityAffected: "recipes",
			recordId: args.recipe_id,
			changeLog: {
				previous: { quantity_required: recipe.quantity_required },
				next: { quantity_required: args.quantity_required },
			},
		});

		return args.recipe_id;
	},
});

export const removeRecipeLine = mutation({
	args: {
		recipe_id: v.id("recipes"),
	},
	handler: async (ctx, args) => {
		const { organization, user } = await requireOwnerContext(ctx);

		const recipe = await ctx.db.get(args.recipe_id);
		if (!recipe || recipe.org_id !== organization._id) {
			throw new Error("Recipe line not found in your organization");
		}

		await ctx.db.delete(args.recipe_id);

		await writeAuditLog(ctx, {
			orgId: organization._id,
			userId: user._id,
			actionType: "delete",
			entityAffected: "recipes",
			recordId: args.recipe_id,
			changeLog: {
				previous: {
					parent_product_id: recipe.parent_product_id,
					ingredient_product_id: recipe.ingredient_product_id,
					quantity_required: recipe.quantity_required,
				},
			},
		});

		return args.recipe_id;
	},
});

export const replaceRecipeLines = mutation({
	args: {
		parent_product_id: v.id("products"),
		lines: v.array(
			v.object({
				ingredient_product_id: v.id("products"),
				quantity_required: v.number(),
			}),
		),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireOwnerContext(ctx);

		if (args.lines.length > MAX_RECIPE_LINES) {
			throw new Error("Too many recipe lines");
		}

		const parentProduct = await ctx.db.get(args.parent_product_id);
		if (!parentProduct || parentProduct.org_id !== organization._id) {
			throw new Error("Parent product not found in your organization");
		}

		ensureCompositeCapableParent(parentProduct);

		const seenIngredientIds = new Set<string>();
		const ingredientGraphCache = new Map<Id<"products">, Id<"products">[]>();
		for (const line of args.lines) {
			if (line.ingredient_product_id === args.parent_product_id) {
				throw new Error(
					"Parent product cannot reference itself as an ingredient",
				);
			}

			ensurePositiveQuantity(line.quantity_required);

			if (seenIngredientIds.has(line.ingredient_product_id)) {
				throw new Error("Duplicate ingredient found in recipe lines");
			}
			seenIngredientIds.add(line.ingredient_product_id);

			const ingredientProduct = await ctx.db.get(line.ingredient_product_id);
			if (!ingredientProduct || ingredientProduct.org_id !== organization._id) {
				throw new Error("Ingredient product not found in your organization");
			}

			await ensureNoBomCycle(
				ctx,
				organization._id,
				args.parent_product_id,
				line.ingredient_product_id,
				ingredientGraphCache,
			);
		}

		while (true) {
			const existingLines = await ctx.db
				.query("recipes")
				.withIndex("by_org_id_and_parent_product_id", (q) =>
					q
						.eq("org_id", organization._id)
						.eq("parent_product_id", args.parent_product_id),
				)
				.take(MAX_RECIPE_LINES);

			if (existingLines.length === 0) {
				break;
			}

			for (const line of existingLines) {
				await ctx.db.delete(line._id);
			}
		}

		for (const line of args.lines) {
			await ctx.db.insert("recipes", {
				org_id: organization._id,
				parent_product_id: args.parent_product_id,
				ingredient_product_id: line.ingredient_product_id,
				quantity_required: line.quantity_required,
			});
		}

		return {
			parent_product_id: args.parent_product_id,
			replaced_count: args.lines.length,
		};
	},
});
