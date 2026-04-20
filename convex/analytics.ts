import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { query } from "./_generated/server";
import { requireOwnerContext } from "./helpers/context";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const dashboardRange = v.union(
	v.literal("today"),
	v.literal("week"),
	v.literal("month"),
	v.literal("all"),
);

function getRangeStart(range: "today" | "week" | "month" | "all") {
	if (range === "all") {
		return null;
	}

	const now = Date.now();
	if (range === "week") {
		return now - 7 * MS_PER_DAY;
	}

	const date = new Date(now);
	if (range === "today") {
		date.setHours(0, 0, 0, 0);
		return date.getTime();
	}

	date.setDate(1);
	date.setHours(0, 0, 0, 0);
	return date.getTime();
}

function formatMonthKey(date: Date) {
	return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

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
// Dispatch Value
// Calculates total dispatch value for a selected dashboard time range.
// ---------------------------------------------------------------------------

export const getDispatchValue = query({
	args: {
		range: v.optional(dashboardRange),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireOwnerContext(ctx);

		const range = args.range ?? "all";
		const fromTimestamp = getRangeStart(range);
		const transactionLimit = Math.min(args.limit ?? 1000, 2000);

		const transactions = await ctx.db
			.query("transactions")
			.withIndex("by_org_id_and_created_at", (q) =>
				q.eq("org_id", organization._id),
			)
			.order("desc")
			.take(transactionLimit);

		const dispatchTransactions = transactions.filter((transaction) => {
			if (transaction.movement_type !== "dispatch") {
				return false;
			}
			if (fromTimestamp === null) {
				return true;
			}
			return transaction.created_at >= fromTimestamp;
		});

		if (dispatchTransactions.length === 0) {
			return {
				range,
				from_timestamp: fromTimestamp,
				total_dispatch_value: 0,
				dispatch_count: 0,
				item_count: 0,
				breakdown: [],
			};
		}

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

		const productTotals = new Map<
			Id<"products">,
			{ quantity: number; total_value: number }
		>();

		let totalDispatchValue = 0;
		let itemCount = 0;

		for (const items of dispatchItemsByTransaction) {
			for (const item of items) {
				const lineValue = item.quantity * item.cost_at_event;
				totalDispatchValue += lineValue;
				itemCount += 1;

				const existing = productTotals.get(item.product_id);
				if (existing) {
					existing.quantity += item.quantity;
					existing.total_value += lineValue;
				} else {
					productTotals.set(item.product_id, {
						quantity: item.quantity,
						total_value: lineValue,
					});
				}
			}
		}

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
					quantity: totals.quantity,
					total_value: totals.total_value,
				};
			})
			.sort((a, b) => b.total_value - a.total_value);

		return {
			range,
			from_timestamp: fromTimestamp,
			total_dispatch_value: totalDispatchValue,
			dispatch_count: dispatchTransactions.length,
			item_count: itemCount,
			breakdown,
		};
	},
});

// ---------------------------------------------------------------------------
// Critical Expiry Watch
// Finds active batches that will expire within a configurable time window.
// ---------------------------------------------------------------------------

export const getExpiringBatches = query({
	args: {
		days_threshold: v.optional(v.number()),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireOwnerContext(ctx);

		const daysThreshold = Math.min(Math.max(args.days_threshold ?? 14, 1), 90);
		const maxRows = Math.min(args.limit ?? 100, 300);

		const now = Date.now();
		const expiryWindowEnd = now + daysThreshold * MS_PER_DAY;

		const batches = await ctx.db
			.query("batches")
			.withIndex("by_org_id", (q) => q.eq("org_id", organization._id))
			.take(2000);

		const productCache = new Map<Id<"products">, Doc<"products"> | null>();
		const expiring = [] as Array<{
			batch_id: Id<"batches">;
			batch_code: string;
			product_id: Id<"products">;
			product_name: string;
			sku: string;
			base_unit: string;
			remaining_qty: number;
			expiry_date: number;
			days_until_expiry: number;
			urgency: "critical" | "warning" | "watch";
		}>;

		for (const batch of batches) {
			if (batch.remaining_qty <= 0 || batch.expiry_date === undefined) {
				continue;
			}
			if (batch.expiry_date < now || batch.expiry_date > expiryWindowEnd) {
				continue;
			}

			const daysUntilExpiry = Math.ceil((batch.expiry_date - now) / MS_PER_DAY);

			let urgency: "critical" | "warning" | "watch" = "watch";
			if (daysUntilExpiry <= 2) {
				urgency = "critical";
			} else if (daysUntilExpiry <= 7) {
				urgency = "warning";
			}

			let product = productCache.get(batch.product_id);
			if (product === undefined) {
				product = await ctx.db.get(batch.product_id);
				productCache.set(batch.product_id, product);
			}

			expiring.push({
				batch_id: batch._id,
				batch_code: batch.batch_code,
				product_id: batch.product_id,
				product_name: product?.name ?? "Unknown",
				sku: product?.sku ?? "",
				base_unit: product?.base_unit ?? "",
				remaining_qty: batch.remaining_qty,
				expiry_date: batch.expiry_date,
				days_until_expiry: daysUntilExpiry,
				urgency,
			});
		}

		expiring.sort((a, b) => a.days_until_expiry - b.days_until_expiry);

		const countCritical = expiring.filter(
			(batch) => batch.urgency === "critical",
		).length;
		const countWarning = expiring.filter(
			(batch) => batch.urgency === "warning",
		).length;
		const countWatch = expiring.filter((batch) => batch.urgency === "watch").length;

		return {
			days_threshold: daysThreshold,
			batches_expiring_soon: expiring.slice(0, maxRows),
			count_critical: countCritical,
			count_warning: countWarning,
			count_watch: countWatch,
		};
	},
});

// ---------------------------------------------------------------------------
// Procurement Cost Trends
// Compares current-month latest costs against an earlier comparison month.
// ---------------------------------------------------------------------------

export const getProcurementCostTrends = query({
	args: {
		months_back: v.optional(v.number()),
		limit: v.optional(v.number()),
		min_price_change_percent: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireOwnerContext(ctx);

		const monthsBack = Math.min(Math.max(Math.floor(args.months_back ?? 1), 1), 12);
		const maxRows = Math.min(args.limit ?? 100, 300);
		const minPriceChangePercent = Math.max(args.min_price_change_percent ?? 0, 0);

		const now = new Date();
		const currentMonthStartDate = new Date(now.getFullYear(), now.getMonth(), 1);
		const nextMonthStartDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
		const previousMonthStartDate = new Date(
			now.getFullYear(),
			now.getMonth() - monthsBack,
			1,
		);
		const previousMonthEndDate = new Date(
			now.getFullYear(),
			now.getMonth() - monthsBack + 1,
			1,
		);

		const currentMonthStart = currentMonthStartDate.getTime();
		const nextMonthStart = nextMonthStartDate.getTime();
		const previousMonthStart = previousMonthStartDate.getTime();
		const previousMonthEnd = previousMonthEndDate.getTime();

		const batches = await ctx.db
			.query("batches")
			.withIndex("by_org_id_and_received_at", (q) =>
				q.eq("org_id", organization._id).gte("received_at", previousMonthStart),
			)
			.order("desc")
			.take(3000);

		const latestCurrentByProduct = new Map<Id<"products">, Doc<"batches">>();
		const latestPreviousByProduct = new Map<Id<"products">, Doc<"batches">>();

		for (const batch of batches) {
			if (
				batch.received_at >= currentMonthStart &&
				batch.received_at < nextMonthStart
			) {
				if (!latestCurrentByProduct.has(batch.product_id)) {
					latestCurrentByProduct.set(batch.product_id, batch);
				}
				continue;
			}

			if (
				batch.received_at >= previousMonthStart &&
				batch.received_at < previousMonthEnd &&
				!latestPreviousByProduct.has(batch.product_id)
			) {
				latestPreviousByProduct.set(batch.product_id, batch);
			}
		}

		const comparableProductIds = Array.from(latestCurrentByProduct.keys()).filter(
			(productId) => latestPreviousByProduct.has(productId),
		);

		if (comparableProductIds.length === 0) {
			return {
				months_back: monthsBack,
				date_range: {
					current_month: formatMonthKey(currentMonthStartDate),
					previous_month: formatMonthKey(previousMonthStartDate),
				},
				trends: [],
			};
		}

		const products = await Promise.all(
			comparableProductIds.map((productId) => ctx.db.get(productId)),
		);

		const trends = comparableProductIds
			.map((productId, index) => {
				const currentBatch = latestCurrentByProduct.get(productId)!;
				const previousBatch = latestPreviousByProduct.get(productId)!;
				const costChange = currentBatch.cost_price - previousBatch.cost_price;
				const costChangePercent =
					previousBatch.cost_price === 0
						? 0
						: (costChange / previousBatch.cost_price) * 100;

				let priceTrend: "increased" | "decreased" | "stable" = "stable";
				if (costChange > 0) {
					priceTrend = "increased";
				} else if (costChange < 0) {
					priceTrend = "decreased";
				}

				const product = products[index];
				return {
					product_id: productId,
					product_name: product?.name ?? "Unknown",
					sku: product?.sku ?? "",
					current_cost_price: currentBatch.cost_price,
					previous_month_cost_price: previousBatch.cost_price,
					cost_change: costChange,
					cost_change_percent: costChangePercent,
					price_trend: priceTrend,
				};
			})
			.filter(
				(item) => Math.abs(item.cost_change_percent) >= minPriceChangePercent,
			)
			.sort((a, b) => Math.abs(b.cost_change) - Math.abs(a.cost_change))
			.slice(0, maxRows);

		return {
			months_back: monthsBack,
			date_range: {
				current_month: formatMonthKey(currentMonthStartDate),
				previous_month: formatMonthKey(previousMonthStartDate),
			},
			trends,
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
