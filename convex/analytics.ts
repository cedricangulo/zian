import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { requireOwnerContext } from "./helpers/context";

// ---------------------------------------------------------------------------
// Asset Valuation
// Calculates total inventory value at cost and breaks it down per product.
// ---------------------------------------------------------------------------

export const getAssetValuation = query({
	args: {
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireOwnerContext(ctx);

		// Guidelines: use .take(), never .collect()
		const batchLimit = Math.min(args.limit ?? 1000, 1000);

		const batches = await ctx.db
			.query("batches")
			.withIndex("by_org_id", (q) => q.eq("org_id", organization._id))
			.take(batchLimit);

		// Only count batches that still have stock
		const activeBatches = batches.filter((b) => b.remaining_qty > 0);

		// Aggregate per product
		const productTotals = new Map<
			Id<"products">,
			{ remaining_qty: number; total_value: number }
		>();

		let grandTotal = 0;

		for (const batch of activeBatches) {
			const batchValue = batch.remaining_qty * batch.cost_price;
			grandTotal += batchValue;

			const existing = productTotals.get(batch.product_id);
			if (existing) {
				existing.remaining_qty += batch.remaining_qty;
				existing.total_value += batchValue;
			} else {
				productTotals.set(batch.product_id, {
					remaining_qty: batch.remaining_qty,
					total_value: batchValue,
				});
			}
		}

		// Enrich with product names — fetch in parallel
		const productIds = Array.from(productTotals.keys());
		const products = await Promise.all(productIds.map((id) => ctx.db.get(id)));

		const breakdown = productIds
			.map((id, i) => {
				const product = products[i];
				const totals = productTotals.get(id)!;
				return {
					product_id: id,
					product_name: product?.name ?? "Unknown",
					sku: product?.sku ?? "",
					base_unit: product?.base_unit ?? "",
					remaining_qty: totals.remaining_qty,
					total_value: totals.total_value,
				};
			})
			// Sort by highest value first
			.sort((a, b) => b.total_value - a.total_value);

		return {
			grand_total_value: grandTotal,
			active_batch_count: activeBatches.length,
			product_count: productTotals.size,
			breakdown,
		};
	},
});

// ---------------------------------------------------------------------------
// Dead Stock Analysis
// Finds inventory that has been sitting unmoved for too long.
// ---------------------------------------------------------------------------

export const getDeadStock = query({
	args: {
		days_threshold: v.optional(v.number()),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireOwnerContext(ctx);

		const threshold = args.days_threshold ?? 90;
		const batchLimit = Math.min(args.limit ?? 200, 500);
		const cutoffMs = Date.now() - threshold * 24 * 60 * 60 * 1000;

		// Fetch batches ordered by received_at ascending so the oldest stock is
		// evaluated first.
		const batches = await ctx.db
			.query("batches")
			.withIndex("by_org_id_and_received_at", (q) =>
				q.eq("org_id", organization._id),
			)
			.order("asc")
			.take(1000);

		const deadBatches = batches
			.filter((b) => b.remaining_qty > 0 && b.received_at < cutoffMs)
			.slice(0, batchLimit);

		if (deadBatches.length === 0) {
			return { dead_stock: [], total_dead_stock_value: 0 };
		}

		// Enrich with product details
		const productCache = new Map<Id<"products">, Doc<"products"> | null>();

		const enriched = await Promise.all(
			deadBatches.map(async (batch) => {
				let product = productCache.get(batch.product_id);
				if (product === undefined) {
					product = await ctx.db.get(batch.product_id);
					productCache.set(batch.product_id, product);
				}

				const days_in_stock = Math.floor(
					(Date.now() - batch.received_at) / (24 * 60 * 60 * 1000),
				);

				return {
					batch_id: batch._id,
					batch_code: batch.batch_code,
					product_id: batch.product_id,
					product_name: product?.name ?? "Unknown",
					sku: product?.sku ?? "",
					base_unit: product?.base_unit ?? "",
					remaining_qty: batch.remaining_qty,
					cost_price: batch.cost_price,
					dead_stock_value: batch.remaining_qty * batch.cost_price,
					received_at: batch.received_at,
					days_in_stock,
					expiry_date: batch.expiry_date,
				};
			}),
		);

		const total_dead_stock_value = enriched.reduce(
			(sum, b) => sum + b.dead_stock_value,
			0,
		);

		return {
			dead_stock: enriched,
			total_dead_stock_value,
		};
	},
});
