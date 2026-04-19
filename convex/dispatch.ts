import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { writeAuditLog } from "./helpers/audit";
import { requireCurrentContext } from "./helpers/context";

const MAX_DISPATCH_ITEMS = 200;
const MAX_BATCHES_PER_PRODUCT = 500;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type StockRequirement = {
	product: Doc<"products">;
	quantityRequired: number;
};

type BatchDeduction = {
	batchId: Id<"batches">;
	productId: Id<"products">;
	productNameSnapshot: string;
	baseUnitSnapshot: string;
	quantityDeducted: number;
	costAtEvent: number;
};

type DispatchSlipItem = {
	product_name: string;
	base_unit: string;
	quantity: number;
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function ensurePositive(value: number, fieldLabel: string) {
	if (!Number.isFinite(value) || value <= 0) {
		throw new Error(`${fieldLabel} must be greater than zero`);
	}
}

/**
 * Expand a list of requested dispatch items into a flat map of physical stock
 * requirements. Composite (BOM) products are expanded into their ingredient
 * rows; non-BOM products are added directly.
 */
async function expandRequirements(
	ctx: MutationCtx,
	orgId: Id<"organizations">,
	items: { product_id: Id<"products">; quantity: number }[],
): Promise<Map<Id<"products">, StockRequirement>> {
	const requirements = new Map<Id<"products">, StockRequirement>();

	for (const item of items) {
		const product = await ctx.db.get(item.product_id);
		if (!product || product.org_id !== orgId) {
			throw new Error("Product not found in your organization");
		}
		if (product.archived_at) {
			throw new Error(`Product "${product.name}" is archived`);
		}

		if (product.is_bom) {
			// Expand composite product into ingredient requirements
			const recipeLines = await ctx.db
				.query("recipes")
				.withIndex("by_org_id_and_parent_product_id", (q) =>
					q.eq("org_id", orgId).eq("parent_product_id", product._id),
				)
				.take(MAX_DISPATCH_ITEMS);

			if (recipeLines.length === 0) {
				throw new Error(
					`Composite product "${product.name}" has no recipe lines`,
				);
			}

			for (const line of recipeLines) {
				const ingredientProduct = await ctx.db.get(
					line.ingredient_product_id,
				);
				if (!ingredientProduct || ingredientProduct.org_id !== orgId) {
					throw new Error(
						`Ingredient not found for recipe of "${product.name}"`,
					);
				}

				const requiredQty = line.quantity_required * item.quantity;
				const existing = requirements.get(ingredientProduct._id);
				if (existing) {
					existing.quantityRequired += requiredQty;
				} else {
					requirements.set(ingredientProduct._id, {
						product: ingredientProduct,
						quantityRequired: requiredQty,
					});
				}
			}
		} else {
			// Non-BOM: deduct the product itself
			const existing = requirements.get(product._id);
			if (existing) {
				existing.quantityRequired += item.quantity;
			} else {
				requirements.set(product._id, {
					product,
					quantityRequired: item.quantity,
				});
			}
		}
	}

	return requirements;
}

/**
 * Deduct stock from batches for a single product using FEFO order.
 *
 * Batches are selected via the `by_org_id_and_product_id_and_expiry_date`
 * index which naturally returns ascending expiry_date (earliest first).
 * Batches without an expiry date sort *after* those with one in Convex's
 * index ordering (undefined fields sort last), so they are consumed last –
 * effectively FIFO for non-perishable goods.
 *
 * Returns the list of batch deductions performed.
 */
async function deductProductFEFO(
	ctx: MutationCtx,
	orgId: Id<"organizations">,
	requirement: StockRequirement,
): Promise<BatchDeduction[]> {
	let remaining = requirement.quantityRequired;
	const deductions: BatchDeduction[] = [];

	const batches = await ctx.db
		.query("batches")
		.withIndex("by_org_id_and_product_id_and_expiry_date", (q) =>
			q.eq("org_id", orgId).eq("product_id", requirement.product._id),
		)
		.take(MAX_BATCHES_PER_PRODUCT);

	for (const batch of batches) {
		if (remaining <= 0) break;
		if (batch.remaining_qty <= 0) continue;

		const deducted = Math.min(batch.remaining_qty, remaining);
		await ctx.db.patch(batch._id, {
			remaining_qty: batch.remaining_qty - deducted,
		});

		deductions.push({
			batchId: batch._id,
			productId: requirement.product._id,
			productNameSnapshot: requirement.product.name,
			baseUnitSnapshot: requirement.product.base_unit,
			quantityDeducted: deducted,
			costAtEvent: batch.cost_price,
		});

		remaining -= deducted;
	}

	if (remaining > 0) {
		throw new Error(
			`Insufficient stock for product "${requirement.product.name}". ` +
				`Short by ${remaining} ${requirement.product.base_unit}`,
		);
	}

	return deductions;
}

// ---------------------------------------------------------------------------
// Mutations
// ---------------------------------------------------------------------------

export const createDispatch = mutation({
	args: {
		items: v.array(
			v.object({
				product_id: v.id("products"),
				quantity: v.number(),
			}),
		),
		event_reason: v.optional(
			v.union(v.literal("sale"), v.literal("recipe_consumption")),
		),
	},
	handler: async (ctx, args) => {
		const { organization, user } = await requireCurrentContext(ctx);

		if (args.items.length === 0) {
			throw new Error("Dispatch must contain at least one item");
		}
		if (args.items.length > MAX_DISPATCH_ITEMS) {
			throw new Error("Too many items in a single dispatch");
		}

		// Validate every requested quantity
		for (const item of args.items) {
			ensurePositive(item.quantity, "Dispatch quantity");
		}

		const eventReason = args.event_reason ?? "sale";
		const eventTime = Date.now();

		// 1. Expand BOM products into flat ingredient requirements
		const requirements = await expandRequirements(
			ctx,
			organization._id,
			args.items,
		);

		// 2. Deduct stock in FEFO order for each requirement
		const allDeductions: BatchDeduction[] = [];
		for (const requirement of requirements.values()) {
			const deductions = await deductProductFEFO(
				ctx,
				organization._id,
				requirement,
			);
			allDeductions.push(...deductions);
		}

		// 3. Create a single transaction record
		const transactionId = await ctx.db.insert("transactions", {
			org_id: organization._id,
			user_id: user._id,
			movement_type: "dispatch",
			event_reason: eventReason,
			created_at: eventTime,
		});

		// 4. Create transaction items for each batch deduction
		for (const d of allDeductions) {
			await ctx.db.insert("transaction_items", {
				org_id: organization._id,
				transaction_id: transactionId,
				product_id: d.productId,
				batch_id: d.batchId,
				product_name_snapshot: d.productNameSnapshot,
				base_unit_snapshot: d.baseUnitSnapshot,
				quantity: d.quantityDeducted,
				cost_at_event: d.costAtEvent,
				created_at: eventTime,
			});
		}

		// 5. Build the dispatch slip (no pricing info – "No POS" rule)
		const slipItems: DispatchSlipItem[] = [];
		const slipMap = new Map<
			Id<"products">,
			{ product_name: string; base_unit: string; quantity: number }
		>();

		for (const d of allDeductions) {
			const existing = slipMap.get(d.productId);
			if (existing) {
				existing.quantity += d.quantityDeducted;
			} else {
				slipMap.set(d.productId, {
					product_name: d.productNameSnapshot,
					base_unit: d.baseUnitSnapshot,
					quantity: d.quantityDeducted,
				});
			}
		}
		for (const entry of slipMap.values()) {
			slipItems.push(entry);
		}

		// 6. Audit log
		await writeAuditLog(ctx, {
			orgId: organization._id,
			userId: user._id,
			actionType: "create",
			entityAffected: "transactions",
			recordId: transactionId,
			changeLog: {
				next: {
					movement_type: "dispatch",
					event_reason: eventReason,
					item_count: allDeductions.length,
				},
			},
		});

		return {
			transaction_id: transactionId,
			dispatched_at: eventTime,
			slip: slipItems,
		};
	},
});


// ---------------------------------------------------------------------------
// Queries
// ---------------------------------------------------------------------------

export const getDispatchSlip = query({
	args: {
		transaction_id: v.id("transactions"),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireCurrentContext(ctx);

		const transaction = await ctx.db.get(args.transaction_id);
		if (!transaction || transaction.org_id !== organization._id) {
			throw new Error("Transaction not found in your organization");
		}
		if (transaction.movement_type !== "dispatch") {
			throw new Error("Transaction is not a dispatch");
		}

		const items = await ctx.db
			.query("transaction_items")
			.withIndex("by_org_id_and_transaction_id", (q) =>
				q
					.eq("org_id", organization._id)
					.eq("transaction_id", args.transaction_id),
			)
			.take(MAX_DISPATCH_ITEMS);

		// Aggregate items by product for the slip view
		const slipMap = new Map<
			string,
			{ product_name: string; base_unit: string; quantity: number }
		>();

		for (const item of items) {
			const key = item.product_id;
			const existing = slipMap.get(key);
			if (existing) {
				existing.quantity += item.quantity;
			} else {
				slipMap.set(key, {
					product_name: item.product_name_snapshot,
					base_unit: item.base_unit_snapshot,
					quantity: item.quantity,
				});
			}
		}

		return {
			transaction_id: transaction._id,
			movement_type: transaction.movement_type,
			event_reason: transaction.event_reason,
			created_at: transaction.created_at,
			slip: Array.from(slipMap.values()),
		};
	},
});
