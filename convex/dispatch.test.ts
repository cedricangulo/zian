import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import {
	type asOrgUser,
	createTestBackend,
	seedMembership,
	seedOrganization,
	seedUser,
} from "./test-utils.test";

// ---------------------------------------------------------------------------
// Helpers – reusable seed builders
// ---------------------------------------------------------------------------

async function seedProductWithBatches(
	owner: ReturnType<typeof asOrgUser>,
	opts: {
		sku: string;
		name: string;
		base_unit: string;
		track_expiry: boolean;
		batches: {
			batch_code: string;
			cost_price: number;
			quantity: number;
			expiry_date?: number;
		}[];
	},
) {
	const productId = await owner.mutation(api.catalog.createProduct, {
		sku: opts.sku,
		name: opts.name,
		base_unit: opts.base_unit,
		product_type: "raw_material",
		sellable: false,
		stock_tracked: true,
		track_expiry: opts.track_expiry,
		is_bom: false,
		min_stock_level: 0,
	});

	const batchIds: string[] = [];
	for (const b of opts.batches) {
		const receipt = await owner.mutation(api.inventory.createInboundReceipt, {
			product_id: productId,
			batch_code: b.batch_code,
			cost_price: b.cost_price,
			quantity: b.quantity,
			expiry_date: b.expiry_date,
		});
		batchIds.push(receipt.batch_id);
	}

	return { productId, batchIds };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("dispatch and FEFO", () => {
	// -----------------------------------------------------------------------
	// Basic FEFO deduction
	// -----------------------------------------------------------------------
	it("deducts batches in FEFO order (earliest expiry first)", async () => {
		const t = createTestBackend();
		const { actor: owner, orgId } = await seedMembership(t, {
			clerkOrgId: "org_dispatch_fefo",
			tokenIdentifier: "tid_dispatch_fefo",
		});

		const now = Date.now();
		const day = 24 * 60 * 60 * 1000;

		const { productId } = await seedProductWithBatches(owner, {
			sku: "DSP-001",
			name: "Milk",
			base_unit: "L",
			track_expiry: true,
			batches: [
				{
					batch_code: "B-FAR",
					cost_price: 10,
					quantity: 20,
					expiry_date: now + 30 * day,
				},
				{
					batch_code: "B-NEAR",
					cost_price: 12,
					quantity: 10,
					expiry_date: now + 5 * day,
				},
				{
					batch_code: "B-MID",
					cost_price: 11,
					quantity: 15,
					expiry_date: now + 15 * day,
				},
			],
		});

		const result = await owner.mutation(api.dispatch.createDispatch, {
			items: [{ product_id: productId, quantity: 18 }],
		});

		expect(result.slip).toHaveLength(1);
		expect(result.slip[0]?.product_name).toBe("Milk");
		expect(result.slip[0]?.quantity).toBe(18);

		// Verify batch remaining quantities:
		// FEFO order by expiry_date ascending: B-NEAR (5d), B-MID (15d), B-FAR (30d)
		// Need 18: take 10 from B-NEAR (fully depleted), then 8 from B-MID
		const batches = await t.run(async (ctx) => {
			return await ctx.db
				.query("batches")
				.withIndex("by_org_id_and_product_id_and_expiry_date", (q) =>
					q.eq("org_id", orgId).eq("product_id", productId),
				)
				.take(10);
		});

		// Sorted by expiry_date ascending
		expect(batches[0]?.batch_code).toBe("B-NEAR");
		expect(batches[0]?.remaining_qty).toBe(0); // 10 - 10

		expect(batches[1]?.batch_code).toBe("B-MID");
		expect(batches[1]?.remaining_qty).toBe(7); // 15 - 8

		expect(batches[2]?.batch_code).toBe("B-FAR");
		expect(batches[2]?.remaining_qty).toBe(20); // untouched
	});

	// -----------------------------------------------------------------------
	// Composite (BOM) dispatch
	// -----------------------------------------------------------------------
	it("deducts ingredient stock for composite BOM products", async () => {
		const t = createTestBackend();
		const { actor: owner, orgId } = await seedMembership(t, {
			clerkOrgId: "org_dispatch_bom",
			tokenIdentifier: "tid_dispatch_bom",
		});

		const now = Date.now();
		const day = 24 * 60 * 60 * 1000;

		// Create ingredient products with batches
		const { productId: coffeeId } = await seedProductWithBatches(owner, {
			sku: "ING-COFFEE",
			name: "Coffee Beans",
			base_unit: "g",
			track_expiry: true,
			batches: [
				{
					batch_code: "CB-01",
					cost_price: 0.05,
					quantity: 1000,
					expiry_date: now + 60 * day,
				},
			],
		});

		const { productId: milkId } = await seedProductWithBatches(owner, {
			sku: "ING-MILK",
			name: "Milk",
			base_unit: "ml",
			track_expiry: true,
			batches: [
				{
					batch_code: "MK-01",
					cost_price: 0.02,
					quantity: 5000,
					expiry_date: now + 10 * day,
				},
			],
		});

		// Create composite product (Latte)
		const latteId = await owner.mutation(api.catalog.createProduct, {
			sku: "COMP-LATTE",
			name: "Latte",
			base_unit: "cup",
			product_type: "composite",
			sellable: true,
			stock_tracked: true,
			track_expiry: false,
			is_bom: true,
			min_stock_level: 0,
		});

		// Add recipe lines: 1 Latte = 20g Coffee + 200ml Milk
		await owner.mutation(api.recipes.addRecipeLine, {
			parent_product_id: latteId,
			ingredient_product_id: coffeeId,
			quantity_required: 20,
		});
		await owner.mutation(api.recipes.addRecipeLine, {
			parent_product_id: latteId,
			ingredient_product_id: milkId,
			quantity_required: 200,
		});

		// Dispatch 3 lattes → should deduct 60g coffee, 600ml milk
		const result = await owner.mutation(api.dispatch.createDispatch, {
			items: [{ product_id: latteId, quantity: 3 }],
		});

		expect(result.slip).toHaveLength(1);
		expect(result.slip[0]?.product_name).toBe("Latte");
		expect(result.slip[0]?.base_unit).toBe("cup");
		expect(result.slip[0]?.quantity).toBe(3);

		// Verify ingredient batches were deducted
		const coffeeBatch = await t.run(async (ctx) => {
			const batches = await ctx.db
				.query("batches")
				.withIndex("by_org_id_and_product_id", (q) =>
					q.eq("org_id", orgId).eq("product_id", coffeeId),
				)
				.take(10);
			return batches[0];
		});
		expect(coffeeBatch?.remaining_qty).toBe(940); // 1000 - 60

		const milkBatch = await t.run(async (ctx) => {
			const batches = await ctx.db
				.query("batches")
				.withIndex("by_org_id_and_product_id", (q) =>
					q.eq("org_id", orgId).eq("product_id", milkId),
				)
				.take(10);
			return batches[0];
		});
		expect(milkBatch?.remaining_qty).toBe(4400); // 5000 - 600
	});

	// -----------------------------------------------------------------------
	// Insufficient stock
	// -----------------------------------------------------------------------
	it("rejects dispatch when stock is insufficient", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_dispatch_insuf",
			tokenIdentifier: "tid_dispatch_insuf",
		});

		const { productId } = await seedProductWithBatches(owner, {
			sku: "DSP-LOW",
			name: "Nails",
			base_unit: "pcs",
			track_expiry: false,
			batches: [{ batch_code: "N-01", cost_price: 0.1, quantity: 5 }],
		});

		await expect(
			owner.mutation(api.dispatch.createDispatch, {
				items: [{ product_id: productId, quantity: 10 }],
			}),
		).rejects.toThrow("Insufficient stock");
	});

	// -----------------------------------------------------------------------
	// Immutable transaction records
	// -----------------------------------------------------------------------
	it("creates immutable transaction and transaction_items", async () => {
		const t = createTestBackend();
		const { actor: owner, orgId } = await seedMembership(t, {
			clerkOrgId: "org_dispatch_immut",
			tokenIdentifier: "tid_dispatch_immut",
		});

		const { productId } = await seedProductWithBatches(owner, {
			sku: "DSP-IM",
			name: "Screws",
			base_unit: "pcs",
			track_expiry: false,
			batches: [{ batch_code: "SC-01", cost_price: 0.5, quantity: 100 }],
		});

		const result = await owner.mutation(api.dispatch.createDispatch, {
			items: [{ product_id: productId, quantity: 25 }],
		});

		const persisted = await t.run(async (ctx) => {
			const transaction = await ctx.db
				.query("transactions")
				.withIndex("by_org_id", (q) => q.eq("org_id", orgId))
				.take(10)
				.then((txs) => txs.find((tx) => tx._id === result.transaction_id));
			const items = await ctx.db
				.query("transaction_items")
				.withIndex("by_org_id_and_transaction_id", (q) =>
					q.eq("org_id", orgId).eq("transaction_id", result.transaction_id),
				)
				.take(50);
			return { transaction, items };
		});

		expect(persisted.transaction?.movement_type).toBe("dispatch");
		expect(persisted.transaction?.event_reason).toBe("sale");

		expect(persisted.items).toHaveLength(1);
		expect(persisted.items[0]?.quantity).toBe(25);
		expect(persisted.items[0]?.product_name_snapshot).toBe("Screws");
		expect(persisted.items[0]?.base_unit_snapshot).toBe("pcs");
		expect(persisted.items[0]?.cost_at_event).toBe(0.5);
	});

	// -----------------------------------------------------------------------
	// Cross-tenant isolation
	// -----------------------------------------------------------------------
	it("prevents cross-tenant dispatch", async () => {
		const t = createTestBackend();
		const { actor: ownerA } = await seedMembership(t, {
			clerkOrgId: "org_dispatch_iso_a",
			tokenIdentifier: "tid_dispatch_iso_a",
		});
		const { actor: ownerB } = await seedMembership(t, {
			clerkOrgId: "org_dispatch_iso_b",
			tokenIdentifier: "tid_dispatch_iso_b",
		});

		const { productId: productBId } = await seedProductWithBatches(ownerB, {
			sku: "DSP-ISO-B",
			name: "Foreign Product",
			base_unit: "pcs",
			track_expiry: false,
			batches: [{ batch_code: "ISO-B1", cost_price: 5, quantity: 50 }],
		});

		await expect(
			ownerA.mutation(api.dispatch.createDispatch, {
				items: [{ product_id: productBId, quantity: 1 }],
			}),
		).rejects.toThrow("Product not found in your organization");
	});

	// -----------------------------------------------------------------------
	// Empty dispatch
	// -----------------------------------------------------------------------
	it("rejects empty dispatch", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_dispatch_empty",
			tokenIdentifier: "tid_dispatch_empty",
		});

		await expect(
			owner.mutation(api.dispatch.createDispatch, { items: [] }),
		).rejects.toThrow("Dispatch must contain at least one item");
	});

	// -----------------------------------------------------------------------
	// Invalid quantity
	// -----------------------------------------------------------------------
	it("rejects zero or negative dispatch quantities", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_dispatch_neg",
			tokenIdentifier: "tid_dispatch_neg",
		});

		const { productId } = await seedProductWithBatches(owner, {
			sku: "DSP-NEG",
			name: "Bolts",
			base_unit: "pcs",
			track_expiry: false,
			batches: [{ batch_code: "BLT-01", cost_price: 1, quantity: 50 }],
		});

		await expect(
			owner.mutation(api.dispatch.createDispatch, {
				items: [{ product_id: productId, quantity: 0 }],
			}),
		).rejects.toThrow("Dispatch quantity must be greater than zero");

		await expect(
			owner.mutation(api.dispatch.createDispatch, {
				items: [{ product_id: productId, quantity: -5 }],
			}),
		).rejects.toThrow("Dispatch quantity must be greater than zero");
	});

	// -----------------------------------------------------------------------
	// Multi-batch spanning deduction
	// -----------------------------------------------------------------------
	it("spans deduction across multiple batches in FEFO order", async () => {
		const t = createTestBackend();
		const { actor: owner, orgId } = await seedMembership(t, {
			clerkOrgId: "org_dispatch_span",
			tokenIdentifier: "tid_dispatch_span",
		});

		const now = Date.now();
		const day = 24 * 60 * 60 * 1000;

		const { productId } = await seedProductWithBatches(owner, {
			sku: "DSP-SPAN",
			name: "Sugar",
			base_unit: "kg",
			track_expiry: true,
			batches: [
				{
					batch_code: "SU-A",
					cost_price: 2,
					quantity: 5,
					expiry_date: now + 3 * day,
				},
				{
					batch_code: "SU-B",
					cost_price: 2.5,
					quantity: 5,
					expiry_date: now + 7 * day,
				},
				{
					batch_code: "SU-C",
					cost_price: 3,
					quantity: 5,
					expiry_date: now + 14 * day,
				},
			],
		});

		// Dispatch 12 kg – should drain A (5), drain B (5), take 2 from C
		const result = await owner.mutation(api.dispatch.createDispatch, {
			items: [{ product_id: productId, quantity: 12 }],
		});

		expect(result.slip[0]?.quantity).toBe(12);

		const persisted = await t.run(async (ctx) => {
			const items = await ctx.db
				.query("transaction_items")
				.withIndex("by_org_id_and_transaction_id", (q) =>
					q.eq("org_id", orgId).eq("transaction_id", result.transaction_id),
				)
				.take(50);
			return items;
		});

		// Should have 3 transaction_items (one per batch touched)
		expect(persisted).toHaveLength(3);
		expect(persisted[0]?.quantity).toBe(5);
		expect(persisted[1]?.quantity).toBe(5);
		expect(persisted[2]?.quantity).toBe(2);
	});

	// -----------------------------------------------------------------------
	// Dispatch slip query
	// -----------------------------------------------------------------------
	it("retrieves a dispatch slip from getDispatchSlip query", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_dispatch_slip",
			tokenIdentifier: "tid_dispatch_slip",
		});

		const { productId } = await seedProductWithBatches(owner, {
			sku: "DSP-SLIP",
			name: "Cement",
			base_unit: "bag",
			track_expiry: false,
			batches: [{ batch_code: "CEM-01", cost_price: 15, quantity: 50 }],
		});

		const dispatch = await owner.mutation(api.dispatch.createDispatch, {
			items: [{ product_id: productId, quantity: 3 }],
		});

		const slip = await owner.query(api.dispatch.getDispatchSlip, {
			transaction_id: dispatch.transaction_id,
		});

		expect(slip.movement_type).toBe("dispatch");
		expect(slip.event_reason).toBe("sale");
		expect(slip.slip).toHaveLength(1);
		expect(slip.slip[0]?.product_name).toBe("Cement");
		expect(slip.slip[0]?.quantity).toBe(3);
		expect(slip.slip[0]?.base_unit).toBe("bag");
	});
});
