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

async function seedProduct(
	owner: ReturnType<typeof asOrgUser>,
	opts: { sku: string; name: string },
) {
	return owner.mutation(api.catalog.createProduct, {
		sku: opts.sku,
		name: opts.name,
		base_unit: "kg",
		product_type: "raw_material",
		sellable: false,
		stock_tracked: true,
		track_expiry: false,
		is_bom: false,
		min_stock_level: 0,
	});
}

async function seedBatch(
	owner: ReturnType<typeof asOrgUser>,
	opts: {
		product_id: string;
		qty: number;
		cost: number;
		batch_code?: string;
	},
) {
	return owner.mutation(api.inventory.createInboundReceipt, {
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		product_id: opts.product_id as any,
		batch_code: opts.batch_code ?? `BATCH-${Date.now()}`,
		cost_price: opts.cost,
		quantity: opts.qty,
	});
}

// ---------------------------------------------------------------------------
// Analytics Tests
// ---------------------------------------------------------------------------

describe("analytics: asset valuation", () => {
	it("returns grand total value of all active batches", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_av_basic",
			tokenIdentifier: "tid_av_basic",
		});

		const productId = await seedProduct(owner, {
			sku: "AV-001",
			name: "Flour",
		});

		// Two batches: 100 kg @ ₱10, 50 kg @ ₱20
		await seedBatch(owner, {
			product_id: productId,
			qty: 100,
			cost: 10,
			batch_code: "AV-B1",
		});
		await seedBatch(owner, {
			product_id: productId,
			qty: 50,
			cost: 20,
			batch_code: "AV-B2",
		});

		const result = await owner.query(api.analytics.getAssetValuation, {});

		// 100*10 + 50*20 = 1000 + 1000 = 2000
		expect(result.grand_total_value).toBe(2000);
		expect(result.active_batch_count).toBe(2);
		expect(result.product_count).toBe(1);
		expect(result.breakdown[0].product_name).toBe("Flour");
		expect(result.breakdown[0].remaining_qty).toBe(150);
		expect(result.breakdown[0].total_value).toBe(2000);
	});

	it("excludes fully depleted batches from valuation", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_av_depleted",
			tokenIdentifier: "tid_av_depleted",
		});

		const productId = await seedProduct(owner, {
			sku: "AV-DEP",
			name: "Empty Batch Item",
		});

		const { batch_id } = await seedBatch(owner, {
			product_id: productId,
			qty: 50,
			cost: 10,
			batch_code: "AV-DEP-B1",
		});

		// Fully deplete the batch via adjustment
		await owner.mutation(api.adjustments.createAdjustment, {
			batch_id,
			adjusted_qty: 0,
			reason: "spoilage",
		});

		const result = await owner.query(api.analytics.getAssetValuation, {});

		expect(result.grand_total_value).toBe(0);
		expect(result.active_batch_count).toBe(0);
	});

	it("breaks down valuation across multiple products", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_av_multi",
			tokenIdentifier: "tid_av_multi",
		});

		const productA = await seedProduct(owner, { sku: "AV-A", name: "Sugar" });
		const productB = await seedProduct(owner, { sku: "AV-B", name: "Salt" });

		await seedBatch(owner, {
			product_id: productA,
			qty: 100,
			cost: 5,
			batch_code: "AV-MA",
		});
		await seedBatch(owner, {
			product_id: productB,
			qty: 200,
			cost: 2,
			batch_code: "AV-MB",
		});

		const result = await owner.query(api.analytics.getAssetValuation, {});

		// 100*5=500, 200*2=400 → total 900, sorted desc by value
		expect(result.grand_total_value).toBe(900);
		expect(result.product_count).toBe(2);
		expect(result.breakdown[0].sku).toBe("AV-A"); // Sugar has highest value
		expect(result.breakdown[1].sku).toBe("AV-B");
	});

	it("enforces tenant isolation on asset valuation", async () => {
		const t = createTestBackend();
		const { actor: ownerA } = await seedMembership(t, {
			clerkOrgId: "org_av_iso_a",
			tokenIdentifier: "tid_av_iso_a",
		});
		const { actor: ownerB } = await seedMembership(t, {
			clerkOrgId: "org_av_iso_b",
			tokenIdentifier: "tid_av_iso_b",
		});

		const productB = await seedProduct(ownerB, {
			sku: "AV-ISO-B",
			name: "Org B Stock",
		});
		await seedBatch(ownerB, {
			product_id: productB,
			qty: 1000,
			cost: 100,
			batch_code: "AV-ISO-B1",
		});

		// Org A should see zero value even though Org B has lots of stock
		const resultA = await ownerA.query(api.analytics.getAssetValuation, {});
		expect(resultA.grand_total_value).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// Dead Stock Tests
// ---------------------------------------------------------------------------

describe("analytics: dead stock", () => {
	it("identifies batches received beyond the threshold", async () => {
		const t = createTestBackend();
		const { actor: owner, orgId } = await seedMembership(t, {
			clerkOrgId: "org_ds_basic",
			tokenIdentifier: "tid_ds_basic",
		});

		const productId = await seedProduct(owner, {
			sku: "DS-001",
			name: "Old Flour",
		});

		// Manually seed a batch with an old received_at timestamp (120 days ago)
		const oldReceivedAt = Date.now() - 120 * 24 * 60 * 60 * 1000;
		await t.run(async (ctx) => {
			await ctx.db.insert("batches", {
				org_id: orgId,
				product_id: productId,
				batch_code: "DS-OLD-B1",
				cost_price: 15,
				initial_qty: 80,
				remaining_qty: 80,
				received_at: oldReceivedAt,
			});
		});

		const result = await owner.query(api.analytics.getDeadStock, {
			days_threshold: 90,
		});

		expect(result.dead_stock.length).toBe(1);
		expect(result.dead_stock[0].batch_code).toBe("DS-OLD-B1");
		expect(result.dead_stock[0].days_in_stock).toBeGreaterThanOrEqual(120);
		expect(result.total_dead_stock_value).toBe(80 * 15);
	});

	it("excludes recently received batches from dead stock", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_ds_fresh",
			tokenIdentifier: "tid_ds_fresh",
		});

		const productId = await seedProduct(owner, {
			sku: "DS-FRESH",
			name: "Fresh Stock",
		});
		await seedBatch(owner, {
			product_id: productId,
			qty: 100,
			cost: 10,
			batch_code: "DS-FRESH-B1",
		});

		const result = await owner.query(api.analytics.getDeadStock, {
			days_threshold: 90,
		});

		expect(result.dead_stock.length).toBe(0);
		expect(result.total_dead_stock_value).toBe(0);
	});

	it("excludes fully depleted batches from dead stock", async () => {
		const t = createTestBackend();
		const { actor: owner, orgId } = await seedMembership(t, {
			clerkOrgId: "org_ds_depleted",
			tokenIdentifier: "tid_ds_depleted",
		});

		const productId = await seedProduct(owner, {
			sku: "DS-DEP",
			name: "Depleted Item",
		});
		const oldReceivedAt = Date.now() - 120 * 24 * 60 * 60 * 1000;

		await t.run(async (ctx) => {
			await ctx.db.insert("batches", {
				org_id: orgId,
				product_id: productId,
				batch_code: "DS-DEP-B1",
				cost_price: 10,
				initial_qty: 50,
				remaining_qty: 0, // already depleted
				received_at: oldReceivedAt,
			});
		});

		const result = await owner.query(api.analytics.getDeadStock, {
			days_threshold: 90,
		});

		expect(result.dead_stock.length).toBe(0);
	});
});

// ---------------------------------------------------------------------------
// Dispatch Value Tests
// ---------------------------------------------------------------------------

describe("analytics: dispatch value", () => {
	it("calculates total dispatch value with per-product breakdown", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_dv_basic",
			tokenIdentifier: "tid_dv_basic",
		});

		const productId = await seedProduct(owner, {
			sku: "DV-001",
			name: "Coffee Beans",
		});

		await seedBatch(owner, {
			product_id: productId,
			qty: 100,
			cost: 10,
			batch_code: "DV-B1",
		});

		await owner.mutation(api.dispatch.createDispatch, {
			items: [{ product_id: productId, quantity: 20 }],
		});

		const result = await owner.query(api.analytics.getDispatchValue, {
			range: "all",
		});

		expect(result.total_dispatch_value).toBe(200);
		expect(result.dispatch_count).toBe(1);
		expect(result.item_count).toBe(1);
		expect(result.breakdown).toHaveLength(1);
		expect(result.breakdown[0]?.product_name).toBe("Coffee Beans");
		expect(result.breakdown[0]?.quantity).toBe(20);
		expect(result.breakdown[0]?.total_value).toBe(200);
	});

	it("filters dispatch value by time range", async () => {
		const t = createTestBackend();
		const { actor: owner, orgId, userId } = await seedMembership(t, {
			clerkOrgId: "org_dv_range",
			tokenIdentifier: "tid_dv_range",
		});

		const productId = await seedProduct(owner, {
			sku: "DV-002",
			name: "Milk",
		});

		await seedBatch(owner, {
			product_id: productId,
			qty: 50,
			cost: 10,
			batch_code: "DV-RANGE-B1",
		});

		const oldCreatedAt = Date.now() - 10 * 24 * 60 * 60 * 1000;
		await t.run(async (ctx) => {
			const oldTransactionId = await ctx.db.insert("transactions", {
				org_id: orgId,
				user_id: userId,
				movement_type: "dispatch",
				event_reason: "sale",
				created_at: oldCreatedAt,
			});

			await ctx.db.insert("transaction_items", {
				org_id: orgId,
				transaction_id: oldTransactionId,
				product_id: productId,
				product_name_snapshot: "Milk",
				base_unit_snapshot: "kg",
				quantity: 5,
				cost_at_event: 10,
				created_at: oldCreatedAt,
			});
		});

		await owner.mutation(api.dispatch.createDispatch, {
			items: [{ product_id: productId, quantity: 3 }],
		});

		const todayResult = await owner.query(api.analytics.getDispatchValue, {
			range: "today",
		});
		const allResult = await owner.query(api.analytics.getDispatchValue, {
			range: "all",
		});

		expect(todayResult.total_dispatch_value).toBe(30);
		expect(todayResult.dispatch_count).toBe(1);

		expect(allResult.total_dispatch_value).toBe(80);
		expect(allResult.dispatch_count).toBe(2);
	});
});

// ---------------------------------------------------------------------------
// Expiring Batches Tests
// ---------------------------------------------------------------------------

describe("analytics: expiring batches", () => {
	it("returns batches expiring soon with urgency buckets", async () => {
		const t = createTestBackend();
		const { actor: owner, orgId } = await seedMembership(t, {
			clerkOrgId: "org_exp_watch",
			tokenIdentifier: "tid_exp_watch",
		});

		const productId = await seedProduct(owner, {
			sku: "EXP-001",
			name: "Milk Powder",
		});

		const now = Date.now();
		await t.run(async (ctx) => {
			await ctx.db.insert("batches", {
				org_id: orgId,
				product_id: productId,
				batch_code: "EXP-CRITICAL",
				cost_price: 12,
				initial_qty: 10,
				remaining_qty: 10,
				expiry_date: now + 2 * 24 * 60 * 60 * 1000,
				received_at: now - 5 * 24 * 60 * 60 * 1000,
			});

			await ctx.db.insert("batches", {
				org_id: orgId,
				product_id: productId,
				batch_code: "EXP-WATCH",
				cost_price: 12,
				initial_qty: 8,
				remaining_qty: 8,
				expiry_date: now + 10 * 24 * 60 * 60 * 1000,
				received_at: now - 5 * 24 * 60 * 60 * 1000,
			});

			await ctx.db.insert("batches", {
				org_id: orgId,
				product_id: productId,
				batch_code: "EXP-EXPIRED",
				cost_price: 12,
				initial_qty: 6,
				remaining_qty: 6,
				expiry_date: now - 1 * 24 * 60 * 60 * 1000,
				received_at: now - 5 * 24 * 60 * 60 * 1000,
			});

			await ctx.db.insert("batches", {
				org_id: orgId,
				product_id: productId,
				batch_code: "EXP-FAR",
				cost_price: 12,
				initial_qty: 6,
				remaining_qty: 6,
				expiry_date: now + 20 * 24 * 60 * 60 * 1000,
				received_at: now - 5 * 24 * 60 * 60 * 1000,
			});

			await ctx.db.insert("batches", {
				org_id: orgId,
				product_id: productId,
				batch_code: "EXP-DEPLETED",
				cost_price: 12,
				initial_qty: 6,
				remaining_qty: 0,
				expiry_date: now + 1 * 24 * 60 * 60 * 1000,
				received_at: now - 5 * 24 * 60 * 60 * 1000,
			});
		});

		const result = await owner.query(api.analytics.getExpiringBatches, {
			days_threshold: 14,
		});

		const codes = result.batches_expiring_soon.map((row) => row.batch_code);
		expect(codes).toContain("EXP-CRITICAL");
		expect(codes).toContain("EXP-WATCH");
		expect(codes).not.toContain("EXP-EXPIRED");
		expect(codes).not.toContain("EXP-FAR");
		expect(codes).not.toContain("EXP-DEPLETED");

		expect(result.count_critical).toBe(1);
		expect(result.count_warning).toBe(0);
		expect(result.count_watch).toBe(1);
	});
});

// ---------------------------------------------------------------------------
// Procurement Cost Trends Tests
// ---------------------------------------------------------------------------

describe("analytics: procurement cost trends", () => {
	it("compares current month costs against previous month", async () => {
		const t = createTestBackend();
		const { actor: owner, orgId } = await seedMembership(t, {
			clerkOrgId: "org_cost_trends",
			tokenIdentifier: "tid_cost_trends",
		});

		const productId = await seedProduct(owner, {
			sku: "CT-001",
			name: "Arabica Coffee",
		});

		const now = new Date();
		const currentMonthStart = new Date(
			now.getFullYear(),
			now.getMonth(),
			1,
		).getTime();
		const previousMonthStart = new Date(
			now.getFullYear(),
			now.getMonth() - 1,
			1,
		).getTime();

		await t.run(async (ctx) => {
			await ctx.db.insert("batches", {
				org_id: orgId,
				product_id: productId,
				batch_code: "CT-PREV",
				cost_price: 100,
				initial_qty: 20,
				remaining_qty: 20,
				received_at: previousMonthStart + 2 * 24 * 60 * 60 * 1000,
			});

			await ctx.db.insert("batches", {
				org_id: orgId,
				product_id: productId,
				batch_code: "CT-CURR",
				cost_price: 120,
				initial_qty: 20,
				remaining_qty: 20,
				received_at: currentMonthStart + 2 * 24 * 60 * 60 * 1000,
			});
		});

		const result = await owner.query(api.analytics.getProcurementCostTrends, {});

		expect(result.trends).toHaveLength(1);
		expect(result.trends[0]?.product_id).toBe(productId);
		expect(result.trends[0]?.previous_month_cost_price).toBe(100);
		expect(result.trends[0]?.current_cost_price).toBe(120);
		expect(result.trends[0]?.cost_change).toBe(20);
		expect(result.trends[0]?.price_trend).toBe("increased");
	});
});

// ---------------------------------------------------------------------------
// Admin: Platform Usage Tests
// ---------------------------------------------------------------------------

describe("admin: platform usage", () => {
	it("returns platform-wide org and user counts for super admin", async () => {
		const t = createTestBackend();

		// Seed a super admin user
		const orgId = await seedOrganization(t, { clerkOrgId: "org_sa_platform" });
		const superAdminId = await seedUser(t, {
			orgId,
			tokenIdentifier: "tid_sa_platform",
			role: "super_admin",
		});

		// Seed a second org with two users
		const orgId2 = await seedOrganization(t, { clerkOrgId: "org_sa_tenant2" });
		await seedUser(t, {
			orgId: orgId2,
			tokenIdentifier: "tid_sa_t2u1",
			role: "owner",
		});
		await seedUser(t, {
			orgId: orgId2,
			tokenIdentifier: "tid_sa_t2u2",
			role: "staff",
		});

		const superAdmin = asOrgUser(t, {
			clerkOrgId: "org_sa_platform",
			tokenIdentifier: "tid_sa_platform",
			orgRole: "admin",
		});

		const result = await superAdmin.query(api.admin.getPlatformUsage, {});

		expect(result.total_organizations).toBeGreaterThanOrEqual(2);
		expect(result.active_organizations).toBeGreaterThanOrEqual(2);
		expect(result.total_users).toBeGreaterThanOrEqual(3); // 1 SA + 2 tenant users
	});

	it("blocks non-super-admin owners from platform usage query", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_sa_blocked",
			tokenIdentifier: "tid_sa_blocked",
		});

		await expect(owner.query(api.admin.getPlatformUsage, {})).rejects.toThrow(
			"Unauthorized",
		);
	});

	it("blocks staff from platform usage query", async () => {
		const t = createTestBackend();
		const orgId = await seedOrganization(t, {
			clerkOrgId: "org_sa_staff_block",
		});
		await seedUser(t, {
			orgId,
			tokenIdentifier: "tid_sa_staff",
			role: "staff",
		});

		const staff = asOrgUser(t, {
			clerkOrgId: "org_sa_staff_block",
			tokenIdentifier: "tid_sa_staff",
			orgRole: "member",
		});

		await expect(staff.query(api.admin.getPlatformUsage, {})).rejects.toThrow(
			"Unauthorized",
		);
	});
});
