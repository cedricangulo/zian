import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { writeAuditLog } from "./helpers/audit";
import { requireCurrentContext, requireOwnerContext } from "./helpers/context";
import { resolveBatchCode, resolveSku } from "./helpers/identifiers";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const EXPIRING_SOON_DAYS = 7;

const inventoryStatus = v.union(
	v.literal("good"),
	v.literal("low_stock"),
	v.literal("out_of_stock"),
	v.literal("expiring"),
	v.literal("expired"),
);

const productTypeValidator = v.union(
	v.literal("raw_material"),
	v.literal("packaging"),
	v.literal("sellable"),
	v.literal("composite"),
);

function getBatchStatus(
	expiryDate: number | undefined,
	remainingQty: number,
	now: number,
	expiringSoonCutoff: number,
): "good" | "expiring" | "expired" | "depleted" {
	if (remainingQty <= 0) {
		return "depleted";
	}

	if (expiryDate === undefined) {
		return "good";
	}

	if (expiryDate < now) {
		return "expired";
	}

	if (expiryDate <= expiringSoonCutoff) {
		return "expiring";
	}

	return "good";
}

function getProductStatus(input: {
	currentStockQty: number;
	minStockLevel: number;
	hasExpiredBatch: boolean;
	hasExpiringBatch: boolean;
}): "good" | "low_stock" | "out_of_stock" | "expiring" | "expired" {
	if (input.currentStockQty <= 0) {
		return "out_of_stock";
	}

	if (input.hasExpiredBatch) {
		return "expired";
	}

	if (input.hasExpiringBatch) {
		return "expiring";
	}

	if (input.minStockLevel > 0 && input.currentStockQty < input.minStockLevel) {
		return "low_stock";
	}

	return "good";
}

function ensurePositive(value: number, fieldLabel: string) {
	if (!Number.isFinite(value) || value <= 0) {
		throw new Error(`${fieldLabel} must be greater than zero`);
	}
}

export const createInboundReceipt = mutation({
	args: {
		product_id: v.id("products"),
		supplier_id: v.optional(v.id("suppliers")),
		batch_code: v.optional(v.string()),
		cost_price: v.number(),
		quantity: v.number(),
		expiry_date: v.optional(v.number()),
		received_at: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { organization, user } = await requireCurrentContext(ctx);

		ensurePositive(args.cost_price, "Cost price");
		ensurePositive(args.quantity, "Quantity");

		if (args.received_at !== undefined && !Number.isFinite(args.received_at)) {
			throw new Error("Received date is invalid");
		}

		if (args.expiry_date !== undefined && !Number.isFinite(args.expiry_date)) {
			throw new Error("Expiry date is invalid");
		}

		const product = await ctx.db.get(args.product_id);
		if (!product || product.org_id !== organization._id) {
			throw new Error("Product not found in your organization");
		}

		if (product.track_expiry && args.expiry_date === undefined) {
			throw new Error("Expiry date required for this product");
		}

		if (args.supplier_id) {
			const supplier = await ctx.db.get(args.supplier_id);
			if (!supplier || supplier.org_id !== organization._id) {
				throw new Error("Supplier not found in your organization");
			}
		}

		const batchCode = await resolveBatchCode(
			ctx,
			organization._id,
			args.batch_code,
		);

		const eventTime = Date.now();
		const receivedAt = args.received_at ?? eventTime;

		const batchId = await ctx.db.insert("batches", {
			org_id: organization._id,
			product_id: args.product_id,
			supplier_id: args.supplier_id,
			batch_code: batchCode,
			cost_price: args.cost_price,
			initial_qty: args.quantity,
			remaining_qty: args.quantity,
			expiry_date: args.expiry_date,
			received_at: receivedAt,
		});

		const transactionId = await ctx.db.insert("transactions", {
			org_id: organization._id,
			user_id: user._id,
			movement_type: "inbound",
			event_reason: "purchase",
			created_at: eventTime,
		});

		await ctx.db.insert("transaction_items", {
			org_id: organization._id,
			transaction_id: transactionId,
			product_id: args.product_id,
			batch_id: batchId,
			product_name_snapshot: product.name,
			base_unit_snapshot: product.base_unit,
			quantity: args.quantity,
			cost_at_event: args.cost_price,
			created_at: eventTime,
		});

		await writeAuditLog(ctx, {
			orgId: organization._id,
			userId: user._id,
			actionType: "create",
			entityAffected: "batches",
			recordId: batchId,
			changeLog: {
				next: {
					batch_code: batchCode,
					product_name: product.name,
					quantity: args.quantity,
					cost_price: args.cost_price,
				},
			},
		});

		return {
			transaction_id: transactionId,
			batch_id: batchId,
			batch_code: batchCode,
			received_at: receivedAt,
			total_asset_value: args.quantity * args.cost_price,
		};
	},
});

export const createProductWithInitialBatch = mutation({
	args: {
		category_id: v.optional(v.id("categories")),
		name: v.string(),
		image_url: v.optional(v.string()),
		product_type: productTypeValidator,
		base_unit: v.string(),
		sellable: v.boolean(),
		stock_tracked: v.optional(v.boolean()),
		track_expiry: v.boolean(),
		is_bom: v.boolean(),
		min_stock_level: v.optional(v.number()),
		sku: v.optional(v.string()),
		supplier_id: v.optional(v.id("suppliers")),
		batch_code: v.optional(v.string()),
		cost_price: v.number(),
		quantity: v.number(),
		expiry_date: v.optional(v.number()),
		received_at: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { organization, user } = await requireOwnerContext(ctx);

		ensurePositive(args.cost_price, "Cost price");
		ensurePositive(args.quantity, "Quantity");

		if (args.received_at !== undefined && !Number.isFinite(args.received_at)) {
			throw new Error("Received date is invalid");
		}

		if (args.expiry_date !== undefined && !Number.isFinite(args.expiry_date)) {
			throw new Error("Expiry date is invalid");
		}

		if (args.track_expiry && args.expiry_date === undefined) {
			throw new Error("Expiry date required for this product");
		}

		if (args.category_id) {
			const category = await ctx.db.get(args.category_id);
			if (!category || category.org_id !== organization._id) {
				throw new Error("Category not found in your organization");
			}
		}

		if (args.supplier_id) {
			const supplier = await ctx.db.get(args.supplier_id);
			if (!supplier || supplier.org_id !== organization._id) {
				throw new Error("Supplier not found in your organization");
			}
		}

		const sku = await resolveSku(
			ctx,
			organization._id,
			args.product_type,
			args.sku,
		);

		const eventTime = Date.now();
		const receivedAt = args.received_at ?? eventTime;

		const productId = await ctx.db.insert("products", {
			org_id: organization._id,
			category_id: args.category_id,
			sku,
			name: args.name,
			image_url: args.image_url,
			base_unit: args.base_unit,
			product_type: args.product_type,
			sellable: args.sellable,
			stock_tracked: args.stock_tracked ?? true,
			track_expiry: args.track_expiry,
			is_bom: args.is_bom,
			min_stock_level: args.min_stock_level ?? 0,
			archived_at: undefined,
		});

		const batchCode = await resolveBatchCode(
			ctx,
			organization._id,
			args.batch_code,
		);

		const batchId = await ctx.db.insert("batches", {
			org_id: organization._id,
			product_id: productId,
			supplier_id: args.supplier_id,
			batch_code: batchCode,
			cost_price: args.cost_price,
			initial_qty: args.quantity,
			remaining_qty: args.quantity,
			expiry_date: args.expiry_date,
			received_at: receivedAt,
		});

		const transactionId = await ctx.db.insert("transactions", {
			org_id: organization._id,
			user_id: user._id,
			movement_type: "inbound",
			event_reason: "purchase",
			created_at: eventTime,
		});

		await ctx.db.insert("transaction_items", {
			org_id: organization._id,
			transaction_id: transactionId,
			product_id: productId,
			batch_id: batchId,
			product_name_snapshot: args.name,
			base_unit_snapshot: args.base_unit,
			quantity: args.quantity,
			cost_at_event: args.cost_price,
			created_at: eventTime,
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

		await writeAuditLog(ctx, {
			orgId: organization._id,
			userId: user._id,
			actionType: "create",
			entityAffected: "batches",
			recordId: batchId,
			changeLog: {
				next: {
					batch_code: batchCode,
					product_name: args.name,
					quantity: args.quantity,
					cost_price: args.cost_price,
				},
			},
		});

		return {
			product_id: productId,
			sku,
			transaction_id: transactionId,
			batch_id: batchId,
			batch_code: batchCode,
			received_at: receivedAt,
			total_asset_value: args.quantity * args.cost_price,
		};
	},
});

export const listInventoryProducts = query({
	args: {
		limit: v.optional(v.number()),
		status: v.optional(inventoryStatus),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireOwnerContext(ctx);

		const maxRows = Math.min(args.limit ?? 200, 500);
		const now = Date.now();
		const expiringSoonCutoff = now + EXPIRING_SOON_DAYS * MS_PER_DAY;

		const [products, categories, batches] = await Promise.all([
			ctx.db
				.query("products")
				.withIndex("by_org_id", (q) => q.eq("org_id", organization._id))
				.take(2000),
			ctx.db
				.query("categories")
				.withIndex("by_org_id", (q) => q.eq("org_id", organization._id))
				.take(1000),
			ctx.db
				.query("batches")
				.withIndex("by_org_id", (q) => q.eq("org_id", organization._id))
				.take(5000),
		]);

		const inventoryProducts = products.filter(
			(product) => !product.archived_at && product.stock_tracked,
		);

		const categoryNameById = new Map(categories.map((category) => [category._id, category.name]));

		const activeBatchesByProduct = new Map<Id<"products">, typeof batches>();
		for (const batch of batches) {
			if (batch.remaining_qty <= 0) {
				continue;
			}

			const existing = activeBatchesByProduct.get(batch.product_id) ?? [];
			existing.push(batch);
			activeBatchesByProduct.set(batch.product_id, existing);
		}

		const items = inventoryProducts
			.map((product) => {
				const productBatches = activeBatchesByProduct.get(product._id) ?? [];
				const currentStockQty = productBatches.reduce(
					(sum, batch) => sum + batch.remaining_qty,
					0,
				);
				const assetValue = productBatches.reduce(
					(sum, batch) => sum + batch.remaining_qty * batch.cost_price,
					0,
				);

				const hasExpiredBatch = productBatches.some(
					(batch) => batch.expiry_date !== undefined && batch.expiry_date < now,
				);
				const hasExpiringBatch = productBatches.some(
					(batch) =>
						batch.expiry_date !== undefined &&
						batch.expiry_date >= now &&
						batch.expiry_date <= expiringSoonCutoff,
				);

				const status = getProductStatus({
					currentStockQty,
					minStockLevel: product.min_stock_level,
					hasExpiredBatch,
					hasExpiringBatch,
				});

				return {
					product_id: product._id,
					product_name: product.name,
					sku: product.sku,
					category:
						(product.category_id
							? categoryNameById.get(product.category_id)
							: undefined) ?? product.product_type,
					product_type: product.product_type,
					base_unit: product.base_unit,
					current_stock_qty: currentStockQty,
					asset_value: assetValue,
					status,
					batch_count: productBatches.length,
					min_stock_level: product.min_stock_level,
				};
			})
			.filter((item) => (args.status ? item.status === args.status : true))
			.sort((left, right) => left.product_name.localeCompare(right.product_name));

		const dispatchTransactions = await ctx.db
			.query("transactions")
			.withIndex("by_org_id_and_movement_type", (q) =>
				q.eq("org_id", organization._id).eq("movement_type", "dispatch"),
			)
			.take(2000);

		const dispatchItemsByTransaction = await Promise.all(
			dispatchTransactions.map((transaction) =>
				ctx.db
					.query("transaction_items")
					.withIndex("by_org_id_and_transaction_id", (q) =>
						q
							.eq("org_id", organization._id)
							.eq("transaction_id", transaction._id),
					)
					.take(500),
			),
		);

		let totalDispatchValue = 0;
		for (const transactionItems of dispatchItemsByTransaction) {
			for (const item of transactionItems) {
				totalDispatchValue += item.quantity * item.cost_at_event;
			}
		}

		const totalAssetValue = items.reduce(
			(sum, item) => sum + item.asset_value,
			0,
		);

		return {
			totals: {
				total_asset_value: totalAssetValue,
				total_skus: items.length,
				total_dispatch_value: totalDispatchValue,
			},
			items: items.slice(0, maxRows),
		};
	},
});

export const getProductBatches = query({
	args: {
		product_id: v.id("products"),
		limit: v.optional(v.number()),
		include_depleted: v.optional(v.boolean()),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireOwnerContext(ctx);

		const product = await ctx.db.get(args.product_id);
		if (!product || product.org_id !== organization._id) {
			throw new Error("Product not found in your organization");
		}

		const now = Date.now();
		const expiringSoonCutoff = now + EXPIRING_SOON_DAYS * MS_PER_DAY;
		const maxRows = Math.min(args.limit ?? 100, 500);

		const category = product.category_id
			? await ctx.db.get(product.category_id)
			: null;

		const batches = await ctx.db
			.query("batches")
			.withIndex("by_org_id_and_product_id_and_expiry_date", (q) =>
				q.eq("org_id", organization._id).eq("product_id", args.product_id),
			)
			.take(1000);

		const includeDepleted = args.include_depleted ?? false;

		const mappedBatches = batches
			.filter((batch) => includeDepleted || batch.remaining_qty > 0)
			.map((batch) => {
				const status = getBatchStatus(
					batch.expiry_date,
					batch.remaining_qty,
					now,
					expiringSoonCutoff,
				);

				return {
					batch_id: batch._id,
					batch_code: batch.batch_code,
					quantity: batch.remaining_qty,
					base_unit: product.base_unit,
					batch_value: batch.remaining_qty * batch.cost_price,
					status,
					expiry_date: batch.expiry_date,
					received_at: batch.received_at,
					cost_price: batch.cost_price,
				};
			});

		const totalBatchValue = mappedBatches.reduce(
			(sum, batch) => sum + batch.batch_value,
			0,
		);

		return {
			product: {
				product_id: product._id,
				product_name: product.name,
				sku: product.sku,
				category: category?.name ?? product.product_type,
				product_type: product.product_type,
				base_unit: product.base_unit,
				min_stock_level: product.min_stock_level,
			},
			batches: mappedBatches.slice(0, maxRows),
			total_batches: mappedBatches.length,
			total_batch_value: totalBatchValue,
		};
	},
});

export const getLowStockItems = query({
	args: {
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireOwnerContext(ctx);

		const maxRows = Math.min(args.limit ?? 50, 200);

		const products = await ctx.db
			.query("products")
			.withIndex("by_org_id", (q) => q.eq("org_id", organization._id))
			.take(1000);

		const trackedProducts = products.filter(
			(product) =>
				!product.archived_at && product.stock_tracked && product.min_stock_level > 0,
		);

		if (trackedProducts.length === 0) {
			return {
				low_stock_items: [],
				total_items: 0,
			};
		}

		const batches = await ctx.db
			.query("batches")
			.withIndex("by_org_id", (q) => q.eq("org_id", organization._id))
			.take(3000);

		const stockByProduct = new Map<Id<"products">, number>();
		for (const batch of batches) {
			if (batch.remaining_qty <= 0) {
				continue;
			}

			const existingQty = stockByProduct.get(batch.product_id) ?? 0;
			stockByProduct.set(batch.product_id, existingQty + batch.remaining_qty);
		}

		const lowStockItems = trackedProducts
			.map((product) => {
				const currentStockQty = stockByProduct.get(product._id) ?? 0;
				const stockDeficit = Math.max(product.min_stock_level - currentStockQty, 0);

				return {
					product_id: product._id,
					product_name: product.name,
					sku: product.sku,
					base_unit: product.base_unit,
					current_stock_qty: currentStockQty,
					min_stock_level: product.min_stock_level,
					stock_deficit: stockDeficit,
				};
			})
			.filter((item) => item.current_stock_qty < item.min_stock_level)
			.sort(
				(a, b) =>
					b.stock_deficit - a.stock_deficit ||
					a.product_name.localeCompare(b.product_name),
			);

		return {
			low_stock_items: lowStockItems.slice(0, maxRows),
			total_items: lowStockItems.length,
		};
	},
});
