import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { requireCurrentContext, requireOwnerContext } from "./helpers/context";

async function ensureNoParentCategoryCycle(
	ctx: MutationCtx,
	orgId: Id<"organizations">,
	categoryId: Id<"categories">,
	parentCategoryId: Id<"categories">,
) {
	const visitedCategoryIds = new Set<Id<"categories">>();
	let currentCategoryId: Id<"categories"> | undefined = parentCategoryId;

	while (currentCategoryId) {
		if (currentCategoryId === categoryId) {
			throw new Error("Category hierarchy cannot contain cycles");
		}

		if (visitedCategoryIds.has(currentCategoryId)) {
			throw new Error("Category hierarchy contains an invalid cycle");
		}

		visitedCategoryIds.add(currentCategoryId);

		const currentCategory = await ctx.db.get(currentCategoryId);
		if (!currentCategory || currentCategory.org_id !== orgId) {
			throw new Error("Parent category not found in your organization");
		}

		currentCategoryId = currentCategory.parent_category_id;
	}
}

async function deleteCategoryRecord(
	ctx: MutationCtx,
	orgId: Id<"organizations">,
	categoryId: Id<"categories">,
) {
	const category = await ctx.db.get(categoryId);
	if (!category || category.org_id !== orgId) {
		throw new Error("Category not found in your organization");
	}

	const referencingProduct = await ctx.db
		.query("products")
		.withIndex("by_org_id_and_category_id", (q) =>
			q.eq("org_id", orgId).eq("category_id", categoryId),
		)
		.take(1);

	if (referencingProduct.length > 0) {
		throw new Error(
			"Cannot archive category because it is referenced by existing products",
		);
	}

	const childCategory = await ctx.db
		.query("categories")
		.withIndex("by_org_id_and_parent_category_id", (q) =>
			q.eq("org_id", orgId).eq("parent_category_id", categoryId),
		)
		.take(1);

	if (childCategory.length > 0) {
		throw new Error(
			"Cannot archive category because it is referenced by child categories",
		);
	}

	await ctx.db.delete(categoryId);
	return categoryId;
}

export const listCategories = query({
	args: {},
	handler: async (ctx) => {
		const { organization } = await requireCurrentContext(ctx);
		return await ctx.db
			.query("categories")
			.withIndex("by_org_id", (q) => q.eq("org_id", organization._id))
			.take(100);
	},
});

export const getCategoryById = query({
	args: {
		category_id: v.id("categories"),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireCurrentContext(ctx);
		const category = await ctx.db.get(args.category_id);
		if (!category || category.org_id !== organization._id) {
			throw new Error("Category not found in your organization");
		}

		return category;
	},
});

export const createCategory = mutation({
	args: {
		name: v.string(),
		parent_category_id: v.optional(v.id("categories")),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireOwnerContext(ctx);

		if (args.parent_category_id) {
			const parentCategory = await ctx.db.get(args.parent_category_id);
			if (!parentCategory || parentCategory.org_id !== organization._id) {
				throw new Error("Parent category not found in your organization");
			}
		}

		return await ctx.db.insert("categories", {
			org_id: organization._id,
			name: args.name,
			parent_category_id: args.parent_category_id,
		});
	},
});

export const updateCategory = mutation({
	args: {
		category_id: v.id("categories"),
		name: v.string(),
		parent_category_id: v.union(v.id("categories"), v.null()),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireOwnerContext(ctx);

		const category = await ctx.db.get(args.category_id);
		if (!category || category.org_id !== organization._id) {
			throw new Error("Category not found in your organization");
		}

		if (args.parent_category_id === args.category_id) {
			throw new Error("Category cannot be its own parent");
		}

		if (args.parent_category_id) {
			await ensureNoParentCategoryCycle(
				ctx,
				organization._id,
				args.category_id,
				args.parent_category_id,
			);
		}

		await ctx.db.patch(args.category_id, {
			name: args.name,
			parent_category_id:
				args.parent_category_id === null ? undefined : args.parent_category_id,
		});

		return args.category_id;
	},
});

export const archiveCategory = mutation({
	args: {
		category_id: v.id("categories"),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireOwnerContext(ctx);
		return await deleteCategoryRecord(ctx, organization._id, args.category_id);
	},
});

export const deleteCategory = mutation({
	args: {
		category_id: v.id("categories"),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireOwnerContext(ctx);
		return await deleteCategoryRecord(ctx, organization._id, args.category_id);
	},
});
