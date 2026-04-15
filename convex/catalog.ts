import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireCurrentContext, requireOwnerContext } from "./helpers/context";

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

export const createProduct = mutation({
	args: {
		category_id: v.optional(v.id("categories")),
		sku: v.string(),
		name: v.string(),
		base_unit: v.string(),
		product_type: v.union(
			v.literal("raw_material"),
			v.literal("packaging"),
			v.literal("sellable"),
			v.literal("composite"),
		),
		sellable: v.boolean(),
		stock_tracked: v.boolean(),
		track_expiry: v.boolean(),
		is_bom: v.boolean(),
		min_stock_level: v.number(),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireOwnerContext(ctx);
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
