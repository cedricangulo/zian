import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import {
	asOrgUser,
	createTestBackend,
	seedMembership,
	seedOrganization,
	seedUser,
} from "./test-utils.test";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function seedBatch(
	owner: ReturnType<typeof asOrgUser>,
	opts: {
		sku: string;
		name: string;
		base_unit: string;
		quantity: number;
		cost_price: number;
		track_expiry?: boolean;
		expiry_date?: number;
	},
) {
	const productId = await owner.mutation(api.catalog.createProduct, {
		sku: opts.sku,
		name: opts.name,
		base_unit: opts.base_unit,
		product_type: "raw_material",
		sellable: false,
		stock_tracked: true,
		track_expiry: opts.track_expiry ?? false,
		is_bom: false,
		min_stock_level: 0,
	});

	const receipt = await owner.mutation(api.inventory.createInboundReceipt, {
		product_id: productId,
		batch_code: `BATCH-${opts.sku}`,
		cost_price: opts.cost_price,
		quantity: opts.quantity,
		expiry_date: opts.expiry_date,
	});

	return { productId, batchId: receipt.batch_id };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("stock adjustments", () => {
	// -----------------------------------------------------------------------
	// Decrease adjustment (spoilage / damage / theft)
	// -----------------------------------------------------------------------
	it("adjusts batch stock down with a spoilage reason", async () => {
		const t = createTestBackend();
		const { actor: owner, orgId } = await seedMembership(t, {
			clerkOrgId: "org_adj_spoilage",
			tokenIdentifier: "tid_adj_spoilage",
		});

		const { batchId } = await seedBatch(owner, {
			sku: "ADJ-001",
			name: "Tomatoes",
			base_unit: "kg",
			quantity: 50,
			cost_price: 3,
		});

		const result = await owner.mutation(api.adjustments.createAdjustment, {
			batch_id: batchId,
			adjusted_qty: 40,
			reason: "spoilage",
		});

		expect(result.previous_qty).toBe(50);
		expect(result.adjusted_qty).toBe(40);
		expect(result.delta).toBe(-10);

		// Verify batch was patched
		const batch = await t.run(async (ctx) => ctx.db.get(batchId));
		expect(batch?.remaining_qty).toBe(40);

		// Verify immutable transaction record
		const persisted = await t.run(async (ctx) => {
			const txns = await ctx.db
				.query("transactions")
				.withIndex("by_org_id_and_movement_type", (q) =>
					q.eq("org_id", orgId).eq("movement_type", "adjustment"),
				)
				.take(10);
			const txn = txns.find((tx) => tx._id === result.transaction_id);
			const items = await ctx.db
				.query("transaction_items")
				.withIndex("by_org_id_and_transaction_id", (q) =>
					q.eq("org_id", orgId).eq("transaction_id", result.transaction_id),
				)
				.take(10);
			return { txn, items };
		});

		expect(persisted.txn?.movement_type).toBe("adjustment");
		expect(persisted.txn?.event_reason).toBe("spoilage");
		expect(persisted.items).toHaveLength(1);
		expect(persisted.items[0]?.quantity).toBe(-10); // negative delta
		expect(persisted.items[0]?.product_name_snapshot).toBe("Tomatoes");
		expect(persisted.items[0]?.cost_at_event).toBe(3);
	});

	// -----------------------------------------------------------------------
	// Increase adjustment (correction – found extra stock)
	// -----------------------------------------------------------------------
	it("adjusts batch stock up with a correction reason", async () => {
		const t = createTestBackend();
		const { actor: owner, orgId } = await seedMembership(t, {
			clerkOrgId: "org_adj_correction",
			tokenIdentifier: "tid_adj_correction",
		});

		const { batchId } = await seedBatch(owner, {
			sku: "ADJ-UP",
			name: "Flour",
			base_unit: "kg",
			quantity: 20,
			cost_price: 1.5,
		});

		const result = await owner.mutation(api.adjustments.createAdjustment, {
			batch_id: batchId,
			adjusted_qty: 25,
			reason: "correction",
		});

		expect(result.delta).toBe(5); // positive delta

		const batch = await t.run(async (ctx) => ctx.db.get(batchId));
		expect(batch?.remaining_qty).toBe(25);
	});

	// -----------------------------------------------------------------------
	// Theft reason
	// -----------------------------------------------------------------------
	it("records theft reason correctly", async () => {
		const t = createTestBackend();
		const { actor: owner, orgId } = await seedMembership(t, {
			clerkOrgId: "org_adj_theft",
			tokenIdentifier: "tid_adj_theft",
		});

		const { batchId } = await seedBatch(owner, {
			sku: "ADJ-THEFT",
			name: "Sugar",
			base_unit: "kg",
			quantity: 30,
			cost_price: 2,
		});

		const result = await owner.mutation(api.adjustments.createAdjustment, {
			batch_id: batchId,
			adjusted_qty: 28,
			reason: "theft",
		});

		const persisted = await t.run(async (ctx) => {
			const txns = await ctx.db
				.query("transactions")
				.withIndex("by_org_id_and_movement_type", (q) =>
					q.eq("org_id", orgId).eq("movement_type", "adjustment"),
				)
				.take(10);
			return txns.find((tx) => tx._id === result.transaction_id);
		});

		expect(persisted?.event_reason).toBe("theft");
	});

	// -----------------------------------------------------------------------
	// Damage reason
	// -----------------------------------------------------------------------
	it("records damage reason correctly", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_adj_damage",
			tokenIdentifier: "tid_adj_damage",
		});

		const { batchId } = await seedBatch(owner, {
			sku: "ADJ-DMG",
			name: "Olive Oil",
			base_unit: "L",
			quantity: 10,
			cost_price: 8,
		});

		const result = await owner.mutation(api.adjustments.createAdjustment, {
			batch_id: batchId,
			adjusted_qty: 9,
			reason: "damage",
			notes: "One bottle cracked during storage",
		});

		expect(result.delta).toBe(-1);
	});

	// -----------------------------------------------------------------------
	// No-op: same quantity
	// -----------------------------------------------------------------------
	it("rejects adjustment when quantity is unchanged", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_adj_noop",
			tokenIdentifier: "tid_adj_noop",
		});

		const { batchId } = await seedBatch(owner, {
			sku: "ADJ-NOOP",
			name: "Salt",
			base_unit: "kg",
			quantity: 15,
			cost_price: 0.5,
		});

		await expect(
			owner.mutation(api.adjustments.createAdjustment, {
				batch_id: batchId,
				adjusted_qty: 15,
				reason: "correction",
			}),
		).rejects.toThrow("no adjustment needed");
	});

	// -----------------------------------------------------------------------
	// Negative quantity
	// -----------------------------------------------------------------------
	it("rejects negative adjusted quantity", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_adj_neg",
			tokenIdentifier: "tid_adj_neg",
		});

		const { batchId } = await seedBatch(owner, {
			sku: "ADJ-NEG",
			name: "Pepper",
			base_unit: "g",
			quantity: 100,
			cost_price: 0.1,
		});

		await expect(
			owner.mutation(api.adjustments.createAdjustment, {
				batch_id: batchId,
				adjusted_qty: -5,
				reason: "correction",
			}),
		).rejects.toThrow("non-negative number");
	});

	// -----------------------------------------------------------------------
	// Zero-out: adjust to 0 is allowed (batch fully depleted by spoilage)
	// -----------------------------------------------------------------------
	it("allows adjusting batch to zero quantity", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_adj_zero",
			tokenIdentifier: "tid_adj_zero",
		});

		const { batchId } = await seedBatch(owner, {
			sku: "ADJ-ZERO",
			name: "Eggs",
			base_unit: "pcs",
			quantity: 12,
			cost_price: 0.25,
		});

		const result = await owner.mutation(api.adjustments.createAdjustment, {
			batch_id: batchId,
			adjusted_qty: 0,
			reason: "spoilage",
		});

		expect(result.delta).toBe(-12);
		const batch = await t.run(async (ctx) => ctx.db.get(batchId));
		expect(batch?.remaining_qty).toBe(0);
	});

	// -----------------------------------------------------------------------
	// Cross-tenant isolation
	// -----------------------------------------------------------------------
	it("prevents adjusting another tenant's batch", async () => {
		const t = createTestBackend();
		const { actor: ownerA } = await seedMembership(t, {
			clerkOrgId: "org_adj_iso_a",
			tokenIdentifier: "tid_adj_iso_a",
		});
		const { actor: ownerB } = await seedMembership(t, {
			clerkOrgId: "org_adj_iso_b",
			tokenIdentifier: "tid_adj_iso_b",
		});

		const { batchId: batchBId } = await seedBatch(ownerB, {
			sku: "ADJ-ISO-B",
			name: "Foreign Batch",
			base_unit: "pcs",
			quantity: 50,
			cost_price: 5,
		});

		await expect(
			ownerA.mutation(api.adjustments.createAdjustment, {
				batch_id: batchBId,
				adjusted_qty: 30,
				reason: "correction",
			}),
		).rejects.toThrow("Batch not found in your organization");
	});

	// -----------------------------------------------------------------------
	// Staff can perform adjustments
	// -----------------------------------------------------------------------
	it("allows staff users to perform adjustments", async () => {
		const t = createTestBackend();
		const orgId = await seedOrganization(t, {
			clerkOrgId: "org_adj_staff",
		});

		await seedUser(t, {
			orgId,
			tokenIdentifier: "tid_adj_staff_owner",
			role: "owner",
		});
		await seedUser(t, {
			orgId,
			tokenIdentifier: "tid_adj_staff_user",
			role: "staff",
		});

		const owner = asOrgUser(t, {
			clerkOrgId: "org_adj_staff",
			tokenIdentifier: "tid_adj_staff_owner",
			orgRole: "admin",
		});
		const staff = asOrgUser(t, {
			clerkOrgId: "org_adj_staff",
			tokenIdentifier: "tid_adj_staff_user",
			orgRole: "member",
		});

		const { batchId } = await seedBatch(owner, {
			sku: "ADJ-STAFF",
			name: "Rice",
			base_unit: "kg",
			quantity: 100,
			cost_price: 1.2,
		});

		const result = await staff.mutation(api.adjustments.createAdjustment, {
			batch_id: batchId,
			adjusted_qty: 95,
			reason: "spoilage",
		});

		expect(result.delta).toBe(-5);
	});
});
