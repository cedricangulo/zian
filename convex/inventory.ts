import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { writeAuditLog } from "./helpers/audit";
import { requireCurrentContext } from "./helpers/context";

function ensurePositive(value: number, fieldLabel: string) {
	if (!Number.isFinite(value) || value <= 0) {
		throw new Error(`${fieldLabel} must be greater than zero`);
	}
}

function normalizeBatchCode(batchCode: string) {
	const normalized = batchCode.trim();
	if (!normalized) {
		throw new Error("Batch code is required");
	}
	return normalized;
}

export const createInboundReceipt = mutation({
	args: {
		product_id: v.id("products"),
		supplier_id: v.optional(v.id("suppliers")),
		batch_code: v.string(),
		cost_price: v.number(),
		quantity: v.number(),
		expiry_date: v.optional(v.number()),
		received_at: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		const { organization, user } = await requireCurrentContext(ctx);

		const batchCode = normalizeBatchCode(args.batch_code);
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

		const duplicateBatch = await ctx.db
			.query("batches")
			.withIndex("by_org_id_and_batch_code", (q) =>
				q.eq("org_id", organization._id).eq("batch_code", batchCode),
			)
			.take(1);

		if (duplicateBatch.length > 0) {
			throw new Error("Batch code already exists in your organization");
		}

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
		};
	},
});
