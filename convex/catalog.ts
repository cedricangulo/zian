import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { computeDelta, writeAuditLog } from "./helpers/audit";
import { requireCurrentContext, requireOwnerContext } from "./helpers/context";
import { ensureUniqueSku, resolveSku } from "./helpers/identifiers";

const productTypeValidator = v.union(
	v.literal("raw_material"),
	v.literal("packaging"),
	v.literal("sellable"),
	v.literal("composite"),
);

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
		sku: v.optional(v.string()),
		name: v.string(),
		image_url: v.optional(v.string()),
		base_unit: v.string(),
		product_type: productTypeValidator,
		sellable: v.boolean(),
		stock_tracked: v.boolean(),
		track_expiry: v.boolean(),
		is_bom: v.boolean(),
		min_stock_level: v.number(),
	},
	handler: async (ctx, args) => {
		const { organization, user } = await requireOwnerContext(ctx);

		if (args.category_id) {
			const category = await ctx.db.get(args.category_id);
			if (!category || category.org_id !== organization._id) {
				throw new Error("Category not found in your organization");
			}
		}


			const sku = await resolveSku(
				ctx,
				organization._id,
				args.product_type,
				args.sku,
			);

		const productId = await ctx.db.insert("products", {
			org_id: organization._id,
			category_id: args.category_id,
				sku,
			name: args.name,
				image_url: args.image_url,
			base_unit: args.base_unit,
			product_type: args.product_type,
			sellable: args.sellable,
			stock_tracked: args.stock_tracked,
			track_expiry: args.track_expiry,
			is_bom: args.is_bom,
			min_stock_level: args.min_stock_level,
			archived_at: undefined,
		});

		await writeAuditLog(ctx, {
			orgId: organization._id,
			userId: user._id,
			actionType: "create",
			entityAffected: "products",
			recordId: productId,
			changeLog: {
				next: {
						sku,
					name: args.name,
					product_type: args.product_type,
						image_url: args.image_url,
				},
			},
		});

		return productId;
	},
});

export const updateProduct = mutation({
	args: {
		product_id: v.id("products"),
		category_id: v.union(v.id("categories"), v.null()),
		sku: v.string(),
		name: v.string(),
		image_url: v.optional(v.union(v.string(), v.null())),
		base_unit: v.string(),
		product_type: productTypeValidator,
		sellable: v.boolean(),
		stock_tracked: v.boolean(),
		track_expiry: v.boolean(),
		is_bom: v.boolean(),
		min_stock_level: v.number(),
	},
	handler: async (ctx, args) => {
		const { organization, user } = await requireOwnerContext(ctx);

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

			const patchData: Record<string, unknown> = {
			category_id: args.category_id === null ? undefined : args.category_id,
			sku: args.sku,
			name: args.name,
			base_unit: args.base_unit,
			product_type: args.product_type,
			sellable: args.sellable,
			stock_tracked: args.stock_tracked,
			track_expiry: args.track_expiry,
			is_bom: args.is_bom,
			min_stock_level: args.min_stock_level,
		};

			if (args.image_url !== undefined) {
				patchData.image_url = args.image_url === null ? undefined : args.image_url;
			}

		const delta = computeDelta(product as Record<string, unknown>, patchData);

		await ctx.db.patch(args.product_id, patchData);

		if (delta) {
			await writeAuditLog(ctx, {
				orgId: organization._id,
				userId: user._id,
				actionType: "update",
				entityAffected: "products",
				recordId: args.product_id,
				changeLog: delta,
			});
		}

		return args.product_id;
	},
});

export const archiveProduct = mutation({
	args: {
		product_id: v.id("products"),
	},
	handler: async (ctx, args) => {
		const { organization, user } = await requireOwnerContext(ctx);

		const product = await ctx.db.get(args.product_id);
		if (!product || product.org_id !== organization._id) {
			throw new Error("Product not found in your organization");
		}

		const archivedAt = Date.now();
		await ctx.db.patch(args.product_id, {
			archived_at: archivedAt,
		});

		await writeAuditLog(ctx, {
			orgId: organization._id,
			userId: user._id,
			actionType: "archive",
			entityAffected: "products",
			recordId: args.product_id,
			changeLog: {
				previous: { archived_at: undefined },
				next: { archived_at: archivedAt },
			},
		});

		return args.product_id;
	},
});
