import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { writeAuditLog } from "./helpers/audit";
import { requireCurrentContext } from "./helpers/context";

const adjustmentReason = v.union(
	v.literal("spoilage"),
	v.literal("damage"),
	v.literal("theft"),
	v.literal("correction"),
);

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const createAdjustment = mutation({
	args: {
		batch_id: v.id("batches"),
		adjusted_qty: v.number(),
		reason: adjustmentReason,
		notes: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { organization, user } = await requireCurrentContext(ctx);

		if (!Number.isFinite(args.adjusted_qty) || args.adjusted_qty < 0) {
			throw new Error("Adjusted quantity must be a non-negative number");
		}

		const batch = await ctx.db.get(args.batch_id);
		if (!batch || batch.org_id !== organization._id) {
			throw new Error("Batch not found in your organization");
		}

		const delta = args.adjusted_qty - batch.remaining_qty;

		if (delta === 0) {
			throw new Error(
				"Adjusted quantity matches current stock; no adjustment needed",
			);
		}

		const product = await ctx.db.get(batch.product_id);
		if (!product || product.org_id !== organization._id) {
			throw new Error("Product not found in your organization");
		}

		const eventTime = Date.now();

		// Patch the batch first – if anything below fails, Convex rolls back the
		// whole transaction atomically, keeping stock and history in sync.
		await ctx.db.patch(args.batch_id, {
			remaining_qty: args.adjusted_qty,
		});

		const transactionId = await ctx.db.insert("transactions", {
			org_id: organization._id,
			user_id: user._id,
			movement_type: "adjustment",
			event_reason: args.reason,
			created_at: eventTime,
		});

		await ctx.db.insert("transaction_items", {
			org_id: organization._id,
			transaction_id: transactionId,
			product_id: product._id,
			batch_id: args.batch_id,
			product_name_snapshot: product.name,
			base_unit_snapshot: product.base_unit,
			// Positive delta = stock increased; negative = stock decreased
			quantity: delta,
			cost_at_event: batch.cost_price,
			created_at: eventTime,
		});

		await writeAuditLog(ctx, {
			orgId: organization._id,
			userId: user._id,
			actionType: "adjust",
			entityAffected: "batches",
			recordId: args.batch_id,
			changeLog: {
				previous: { remaining_qty: batch.remaining_qty },
				next: { remaining_qty: args.adjusted_qty, reason: args.reason },
			},
		});

		return {
			transaction_id: transactionId,
			batch_id: args.batch_id,
			previous_qty: batch.remaining_qty,
			adjusted_qty: args.adjusted_qty,
			delta,
		};
	},
});

// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const listAdjustments = query({
	args: {
		batch_id: v.optional(v.id("batches")),
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireCurrentContext(ctx);

		const limit = Math.min(args.limit ?? 50, 200);

		if (args.batch_id) {
			// Verify the batch belongs to this org
			const batch = await ctx.db.get(args.batch_id);
			if (!batch || batch.org_id !== organization._id) {
				throw new Error("Batch not found in your organization");
			}

			// Get transaction_items for this batch, then filter to adjustments
			const items = await ctx.db
				.query("transaction_items")
				.withIndex("by_org_id_and_batch_id", (q) =>
					q.eq("org_id", organization._id).eq("batch_id", args.batch_id!),
				)
				.order("desc")
				.take(limit);

			return items;
		}

		// List all adjustment transactions for the org
		const transactions = await ctx.db
			.query("transactions")
			.withIndex("by_org_id_and_movement_type", (q) =>
				q.eq("org_id", organization._id).eq("movement_type", "adjustment"),
			)
			.order("desc")
			.take(limit);

		return transactions;
	},
});
