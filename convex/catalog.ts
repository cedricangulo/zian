import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCurrentContext, requireOwnerContext } from "./helpers/context";

const productTypeValidator = v.union(
	v.literal("raw_material"),
	v.literal("packaging"),
	v.literal("sellable"),
	v.literal("composite"),
);

async function ensureUniqueSku(
	ctx: Parameters<typeof mutation>[0]["handler"] extends (
		ctx: infer C,
		args: any,
	) => any
		? C
		: never,
	orgId: string,
	sku: string,
	excludingId?: string,
) {
	const collisions = await ctx.db
		.query("products")
		.withIndex("by_org_id_and_sku", (q) => q.eq("org_id", orgId).eq("sku", sku))
		.take(2);

	if (excludingId) {
		if (collisions.some((product) => product._id !== excludingId)) {
			throw new Error("SKU already exists in your organization");
		}
		return;
	}

	if (collisions.length > 0) {
		throw new Error("SKU already exists in your organization");
	}
}

export const listProducts = query({
	args: {},
	handler: async (ctx) => {
		const { organization } = await requireCurrentContext(ctx);
		return await ctx.db
			.query("products")
			.withIndex("by_org_id", (q) => q.eq("org_id", organization._id))
			.take(100);
	},
});

export const getProductById = query({
	args: {
		product_id: v.id("products"),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireCurrentContext(ctx);
		const product = await ctx.db.get(args.product_id);
		if (!product || product.org_id !== organization._id) {
			throw new Error("Product not found in your organization");
		}

		return product;
	},
});

export const createProduct = mutation({
	args: {
		category_id: v.optional(v.id("categories")),
		sku: v.string(),
		name: v.string(),
		base_unit: v.string(),
		product_type: productTypeValidator,
		sellable: v.boolean(),
		stock_tracked: v.boolean(),
		track_expiry: v.boolean(),
		is_bom: v.boolean(),
		min_stock_level: v.number(),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireOwnerContext(ctx);

		if (args.category_id) {
			const category = await ctx.db.get(args.category_id);
			if (!category || category.org_id !== organization._id) {
				throw new Error("Category not found in your organization");
			}
		}

		await ensureUniqueSku(ctx, organization._id, args.sku);

		return await ctx.db.insert("products", {
			org_id: organization._id,
			category_id: args.category_id,
			sku: args.sku,
			name: args.name,
			base_unit: args.base_unit,
			product_type: args.product_type,
			sellable: args.sellable,
			stock_tracked: args.stock_tracked,
			track_expiry: args.track_expiry,
			is_bom: args.is_bom,
			min_stock_level: args.min_stock_level,
			archived_at: undefined,
		});
	},
});

export const updateProduct = mutation({
	args: {
		product_id: v.id("products"),
		category_id: v.union(v.id("categories"), v.null()),
		sku: v.string(),
		name: v.string(),
		base_unit: v.string(),
		product_type: productTypeValidator,
		sellable: v.boolean(),
		stock_tracked: v.boolean(),
		track_expiry: v.boolean(),
		is_bom: v.boolean(),
		min_stock_level: v.number(),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireOwnerContext(ctx);

		const product = await ctx.db.get(args.product_id);
		if (!product || product.org_id !== organization._id) {
			throw new Error("Product not found in your organization");
		}

		if (args.category_id) {
			const category = await ctx.db.get(args.category_id);
			if (!category || category.org_id !== organization._id) {
				throw new Error("Category not found in your organization");
			}
		}

		await ensureUniqueSku(ctx, organization._id, args.sku, args.product_id);

		await ctx.db.patch(args.product_id, {
			category_id: args.category_id,
			sku: args.sku,
			name: args.name,
			base_unit: args.base_unit,
			product_type: args.product_type,
			sellable: args.sellable,
			stock_tracked: args.stock_tracked,
			track_expiry: args.track_expiry,
			is_bom: args.is_bom,
			min_stock_level: args.min_stock_level,
		});

		return args.product_id;
	},
});

export const archiveProduct = mutation({
	args: {
		product_id: v.id("products"),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireOwnerContext(ctx);

		const product = await ctx.db.get(args.product_id);
		if (!product || product.org_id !== organization._id) {
			throw new Error("Product not found in your organization");
		}

		await ctx.db.patch(args.product_id, {
			archived_at: Date.now(),
		});

		return args.product_id;
	},
});
