import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import {
	asOrgUser,
	createTestBackend,
	seedMembership,
	seedOrganization,
	seedUser,
} from "./test-utils.test";

describe("inventory intake", () => {
	it("creates inbound receipt and records immutable transaction history", async () => {
		const t = createTestBackend();
		const { actor: owner, orgId } = await seedMembership(t, {
			clerkOrgId: "org_intake_happy",
			tokenIdentifier: "tid_intake_owner",
			appRole: "owner",
			orgRole: "admin",
		});

		const productId = await owner.mutation(api.catalog.createProduct, {
			sku: "IN-001",
			name: "Fresh Milk",
			base_unit: "L",
			product_type: "raw_material",
			sellable: false,
			stock_tracked: true,
			track_expiry: true,
			is_bom: false,
			min_stock_level: 5,
		});

		const supplierId = await owner.mutation(api.suppliers.createSupplier, {
			name: "Cold Chain Supplier",
		});

		const receivedAt = Date.now();
		const receipt = await owner.mutation(api.inventory.createInboundReceipt, {
			product_id: productId,
			supplier_id: supplierId,
			batch_code: "BATCH-IN-001",
			cost_price: 12.5,
			quantity: 20,
			expiry_date: receivedAt + 7 * 24 * 60 * 60 * 1000,
			received_at: receivedAt,
		});

		expect(receipt.batch_code).toBe("BATCH-IN-001");
		expect(receipt.received_at).toBe(receivedAt);

		const persisted = await t.run(async (ctx) => {
			const batch = await ctx.db.get(receipt.batch_id);
			const transaction = await ctx.db.get(receipt.transaction_id);
			const items = await ctx.db
				.query("transaction_items")
				.withIndex("by_org_id_and_transaction_id", (q) =>
					q.eq("org_id", orgId).eq("transaction_id", receipt.transaction_id),
				)
				.take(10);

			return { batch, transaction, items };
		});

		expect(persisted.batch?.initial_qty).toBe(20);
		expect(persisted.batch?.remaining_qty).toBe(20);
		expect(persisted.batch?.batch_code).toBe("BATCH-IN-001");
		expect(persisted.batch?.supplier_id).toBe(supplierId);

		expect(persisted.transaction?.movement_type).toBe("inbound");
		expect(persisted.transaction?.event_reason).toBe("purchase");

		expect(persisted.items).toHaveLength(1);
		expect(persisted.items[0]?.batch_id).toBe(receipt.batch_id);
		expect(persisted.items[0]?.quantity).toBe(20);
		expect(persisted.items[0]?.product_name_snapshot).toBe("Fresh Milk");
		expect(persisted.items[0]?.base_unit_snapshot).toBe("L");
	});

	it("requires expiry date for products that track expiry", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_intake_expiry",
			tokenIdentifier: "tid_intake_expiry",
		});

		const productId = await owner.mutation(api.catalog.createProduct, {
			sku: "IN-EXP-001",
			name: "Yogurt",
			base_unit: "pcs",
			product_type: "raw_material",
			sellable: false,
			stock_tracked: true,
			track_expiry: true,
			is_bom: false,
			min_stock_level: 2,
		});

		await expect(
			owner.mutation(api.inventory.createInboundReceipt, {
				product_id: productId,
				batch_code: "IN-EXP-B1",
				cost_price: 3.2,
				quantity: 10,
			}),
		).rejects.toThrow("Expiry date required for this product");
	});

	it("allows staff to record inbound receipts", async () => {
		const t = createTestBackend();
		const orgId = await seedOrganization(t, {
			clerkOrgId: "org_intake_staff",
		});

		await seedUser(t, {
			orgId,
			tokenIdentifier: "tid_intake_owner_staff_org",
			role: "owner",
		});

		const staffUserId = await seedUser(t, {
			orgId,
			tokenIdentifier: "tid_intake_staff_user",
			role: "staff",
		});

		const owner = asOrgUser(t, {
			clerkOrgId: "org_intake_staff",
			tokenIdentifier: "tid_intake_owner_staff_org",
			orgRole: "admin",
		});

		const staff = asOrgUser(t, {
			clerkOrgId: "org_intake_staff",
			tokenIdentifier: "tid_intake_staff_user",
			orgRole: "member",
		});

		const productId = await owner.mutation(api.catalog.createProduct, {
			sku: "IN-STF-001",
			name: "Coffee Beans",
			base_unit: "kg",
			product_type: "raw_material",
			sellable: false,
			stock_tracked: true,
			track_expiry: false,
			is_bom: false,
			min_stock_level: 1,
		});

		const receipt = await staff.mutation(api.inventory.createInboundReceipt, {
			product_id: productId,
			batch_code: "IN-STF-B1",
			cost_price: 18,
			quantity: 6,
		});

		const transaction = await t.run(
			async (ctx) => await ctx.db.get(receipt.transaction_id),
		);
		expect(transaction?.user_id).toBe(staffUserId);
	});

	it("rejects duplicate batch code in the same tenant but allows it across tenants", async () => {
		const t = createTestBackend();
		const { actor: ownerA } = await seedMembership(t, {
			clerkOrgId: "org_intake_dup_a",
			tokenIdentifier: "tid_intake_dup_a",
		});
		const { actor: ownerB } = await seedMembership(t, {
			clerkOrgId: "org_intake_dup_b",
			tokenIdentifier: "tid_intake_dup_b",
		});

		const productAId = await ownerA.mutation(api.catalog.createProduct, {
			sku: "IN-DUP-A",
			name: "Flour A",
			base_unit: "kg",
			product_type: "raw_material",
			sellable: false,
			stock_tracked: true,
			track_expiry: false,
			is_bom: false,
			min_stock_level: 1,
		});

		const productBId = await ownerB.mutation(api.catalog.createProduct, {
			sku: "IN-DUP-B",
			name: "Flour B",
			base_unit: "kg",
			product_type: "raw_material",
			sellable: false,
			stock_tracked: true,
			track_expiry: false,
			is_bom: false,
			min_stock_level: 1,
		});

		await ownerA.mutation(api.inventory.createInboundReceipt, {
			product_id: productAId,
			batch_code: "DUPLICATE-BATCH",
			cost_price: 9,
			quantity: 4,
		});

		await expect(
			ownerA.mutation(api.inventory.createInboundReceipt, {
				product_id: productAId,
				batch_code: "DUPLICATE-BATCH",
				cost_price: 9,
				quantity: 4,
			}),
		).rejects.toThrow("Batch code already exists in your organization");

		await expect(
			ownerB.mutation(api.inventory.createInboundReceipt, {
				product_id: productBId,
				batch_code: "DUPLICATE-BATCH",
				cost_price: 11,
				quantity: 5,
			}),
		).resolves.toBeTruthy();
	});

	it("rejects cross-tenant product and supplier references", async () => {
		const t = createTestBackend();
		const { actor: ownerA } = await seedMembership(t, {
			clerkOrgId: "org_intake_tenant_a",
			tokenIdentifier: "tid_intake_tenant_a",
		});
		const { actor: ownerB } = await seedMembership(t, {
			clerkOrgId: "org_intake_tenant_b",
			tokenIdentifier: "tid_intake_tenant_b",
		});

		const localProductId = await ownerA.mutation(api.catalog.createProduct, {
			sku: "IN-TEN-A",
			name: "Tenant A Product",
			base_unit: "pcs",
			product_type: "raw_material",
			sellable: false,
			stock_tracked: true,
			track_expiry: false,
			is_bom: false,
			min_stock_level: 1,
		});

		const foreignProductId = await ownerB.mutation(api.catalog.createProduct, {
			sku: "IN-TEN-B",
			name: "Tenant B Product",
			base_unit: "pcs",
			product_type: "raw_material",
			sellable: false,
			stock_tracked: true,
			track_expiry: false,
			is_bom: false,
			min_stock_level: 1,
		});

		const foreignSupplierId = await ownerB.mutation(
			api.suppliers.createSupplier,
			{
				name: "Foreign Supplier",
			},
		);

		await expect(
			ownerA.mutation(api.inventory.createInboundReceipt, {
				product_id: foreignProductId,
				batch_code: "X-TEN-01",
				cost_price: 3,
				quantity: 2,
			}),
		).rejects.toThrow("Product not found in your organization");

		await expect(
			ownerA.mutation(api.inventory.createInboundReceipt, {
				product_id: localProductId,
				supplier_id: foreignSupplierId,
				batch_code: "X-TEN-02",
				cost_price: 3,
				quantity: 2,
			}),
		).rejects.toThrow("Supplier not found in your organization");
	});

	it("keeps transaction item snapshots immutable after product edits", async () => {
		const t = createTestBackend();
		const { actor: owner, orgId } = await seedMembership(t, {
			clerkOrgId: "org_intake_snapshot",
			tokenIdentifier: "tid_intake_snapshot",
		});

		const productId = await owner.mutation(api.catalog.createProduct, {
			sku: "IN-SNAP-001",
			name: "Old Name",
			base_unit: "box",
			product_type: "sellable",
			sellable: true,
			stock_tracked: true,
			track_expiry: false,
			is_bom: false,
			min_stock_level: 0,
		});

		const receipt = await owner.mutation(api.inventory.createInboundReceipt, {
			product_id: productId,
			batch_code: "IN-SNAP-B1",
			cost_price: 20,
			quantity: 1,
		});

		await owner.mutation(api.catalog.updateProduct, {
			product_id: productId,
			category_id: null,
			sku: "IN-SNAP-001",
			name: "New Name",
			base_unit: "carton",
			product_type: "sellable",
			sellable: true,
			stock_tracked: true,
			track_expiry: false,
			is_bom: false,
			min_stock_level: 0,
		});

		const transactionItems = await t.run(async (ctx) => {
			return await ctx.db
				.query("transaction_items")
				.withIndex("by_org_id_and_transaction_id", (q) =>
					q.eq("org_id", orgId).eq("transaction_id", receipt.transaction_id),
				)
				.take(10);
		});

		expect(transactionItems).toHaveLength(1);
		expect(transactionItems[0]?.product_name_snapshot).toBe("Old Name");
		expect(transactionItems[0]?.base_unit_snapshot).toBe("box");
	});
});
