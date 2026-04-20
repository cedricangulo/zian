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

describe("inventory low stock query", () => {
	it("returns only products below minimum stock level", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_low_stock",
			tokenIdentifier: "tid_low_stock",
		});

		const sugarId = await owner.mutation(api.catalog.createProduct, {
			sku: "LOW-001",
			name: "Sugar",
			base_unit: "g",
			product_type: "raw_material",
			sellable: false,
			stock_tracked: true,
			track_expiry: false,
			is_bom: false,
			min_stock_level: 10,
		});

		const coffeeId = await owner.mutation(api.catalog.createProduct, {
			sku: "LOW-002",
			name: "Coffee",
			base_unit: "g",
			product_type: "raw_material",
			sellable: false,
			stock_tracked: true,
			track_expiry: false,
			is_bom: false,
			min_stock_level: 5,
		});

		await owner.mutation(api.inventory.createInboundReceipt, {
			product_id: sugarId,
			batch_code: "LOW-B1",
			cost_price: 2,
			quantity: 4,
		});

		await owner.mutation(api.inventory.createInboundReceipt, {
			product_id: coffeeId,
			batch_code: "LOW-B2",
			cost_price: 3,
			quantity: 7,
		});

		const result = await owner.query(api.inventory.getLowStockItems, {});

		expect(result.total_items).toBe(1);
		expect(result.low_stock_items).toHaveLength(1);
		expect(result.low_stock_items[0]?.product_name).toBe("Sugar");
		expect(result.low_stock_items[0]?.current_stock_qty).toBe(4);
		expect(result.low_stock_items[0]?.min_stock_level).toBe(10);
		expect(result.low_stock_items[0]?.stock_deficit).toBe(6);
	});

	it("blocks staff from low stock query", async () => {
		const t = createTestBackend();
		const orgId = await seedOrganization(t, {
			clerkOrgId: "org_low_stock_auth",
		});

		await seedUser(t, {
			orgId,
			tokenIdentifier: "tid_low_stock_owner",
			role: "owner",
		});
		await seedUser(t, {
			orgId,
			tokenIdentifier: "tid_low_stock_staff",
			role: "staff",
		});

		const owner = asOrgUser(t, {
			clerkOrgId: "org_low_stock_auth",
			tokenIdentifier: "tid_low_stock_owner",
			orgRole: "admin",
		});
		const staff = asOrgUser(t, {
			clerkOrgId: "org_low_stock_auth",
			tokenIdentifier: "tid_low_stock_staff",
			orgRole: "member",
		});

		const productId = await owner.mutation(api.catalog.createProduct, {
			sku: "LOW-AUTH-001",
			name: "Milk",
			base_unit: "L",
			product_type: "raw_material",
			sellable: false,
			stock_tracked: true,
			track_expiry: false,
			is_bom: false,
			min_stock_level: 10,
		});

		await owner.mutation(api.inventory.createInboundReceipt, {
			product_id: productId,
			batch_code: "LOW-AUTH-B1",
			cost_price: 6,
			quantity: 2,
		});

		await expect(staff.query(api.inventory.getLowStockItems, {})).rejects.toThrow(
			"Unauthorized",
		);
	});
});

describe("inventory overview queries", () => {
	it("returns inventory table rows with totals and status indicators", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_inventory_overview",
			tokenIdentifier: "tid_inventory_overview",
		});

		const now = Date.now();
		const day = 24 * 60 * 60 * 1000;

		const eggsId = await owner.mutation(api.catalog.createProduct, {
			sku: "RAW-EGG-01",
			name: "Egg",
			base_unit: "pcs",
			product_type: "raw_material",
			sellable: false,
			stock_tracked: true,
			track_expiry: false,
			is_bom: false,
			min_stock_level: 20,
		});

		const milkId = await owner.mutation(api.catalog.createProduct, {
			sku: "RAW-MLK-01",
			name: "Milk",
			base_unit: "L",
			product_type: "raw_material",
			sellable: false,
			stock_tracked: true,
			track_expiry: true,
			is_bom: false,
			min_stock_level: 5,
		});

		const lettuceId = await owner.mutation(api.catalog.createProduct, {
			sku: "RAW-LET-01",
			name: "Lettuce",
			base_unit: "kg",
			product_type: "raw_material",
			sellable: false,
			stock_tracked: true,
			track_expiry: true,
			is_bom: false,
			min_stock_level: 1,
		});

		await owner.mutation(api.inventory.createInboundReceipt, {
			product_id: eggsId,
			batch_code: "INV-EGG-B1",
			cost_price: 10,
			quantity: 89,
		});

		await owner.mutation(api.inventory.createInboundReceipt, {
			product_id: milkId,
			batch_code: "INV-MLK-B1",
			cost_price: 5,
			quantity: 50,
			expiry_date: now + 2 * day,
		});

		await owner.mutation(api.inventory.createInboundReceipt, {
			product_id: lettuceId,
			batch_code: "INV-LET-B1",
			cost_price: 2,
			quantity: 10,
			expiry_date: now - day,
		});

		await owner.mutation(api.dispatch.createDispatch, {
			items: [{ product_id: eggsId, quantity: 5 }],
		});

		const result = await owner.query(api.inventory.listInventoryProducts, {});

		expect(result.totals.total_skus).toBe(3);
		expect(result.totals.total_dispatch_value).toBe(50);
		expect(result.totals.total_asset_value).toBe(1110);

		const eggs = result.items.find((item) => item.sku === "RAW-EGG-01");
		expect(eggs?.current_stock_qty).toBe(84);
		expect(eggs?.asset_value).toBe(840);
		expect(eggs?.status).toBe("good");

		const milk = result.items.find((item) => item.sku === "RAW-MLK-01");
		expect(milk?.status).toBe("expiring");

		const lettuce = result.items.find((item) => item.sku === "RAW-LET-01");
		expect(lettuce?.status).toBe("expired");
	});

	it("returns batch rows for a product with value and expiry status", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_inventory_batches",
			tokenIdentifier: "tid_inventory_batches",
		});

		const now = Date.now();
		const day = 24 * 60 * 60 * 1000;

		const eggsId = await owner.mutation(api.catalog.createProduct, {
			sku: "RAW-EGG-BATCH",
			name: "Egg",
			base_unit: "pcs",
			product_type: "raw_material",
			sellable: false,
			stock_tracked: true,
			track_expiry: true,
			is_bom: false,
			min_stock_level: 0,
		});

		await owner.mutation(api.inventory.createInboundReceipt, {
			product_id: eggsId,
			batch_code: "BCH-01",
			cost_price: 5,
			quantity: 89,
			expiry_date: now + 2 * day,
		});

		await owner.mutation(api.inventory.createInboundReceipt, {
			product_id: eggsId,
			batch_code: "BCH-02",
			cost_price: 6,
			quantity: 89,
			expiry_date: now - day,
		});

		const result = await owner.query(api.inventory.getProductBatches, {
			product_id: eggsId,
		});

		expect(result.total_batches).toBe(2);
		expect(result.total_batch_value).toBe(979);

		const batchA = result.batches.find((batch) => batch.batch_code === "BCH-01");
		expect(batchA?.quantity).toBe(89);
		expect(batchA?.batch_value).toBe(445);
		expect(batchA?.status).toBe("expiring");

		const batchB = result.batches.find((batch) => batch.batch_code === "BCH-02");
		expect(batchB?.quantity).toBe(89);
		expect(batchB?.batch_value).toBe(534);
		expect(batchB?.status).toBe("expired");
	});

	it("blocks staff from inventory overview and batch detail queries", async () => {
		const t = createTestBackend();
		const orgId = await seedOrganization(t, {
			clerkOrgId: "org_inventory_auth",
		});

		await seedUser(t, {
			orgId,
			tokenIdentifier: "tid_inventory_owner",
			role: "owner",
		});
		await seedUser(t, {
			orgId,
			tokenIdentifier: "tid_inventory_staff",
			role: "staff",
		});

		const owner = asOrgUser(t, {
			clerkOrgId: "org_inventory_auth",
			tokenIdentifier: "tid_inventory_owner",
			orgRole: "admin",
		});
		const staff = asOrgUser(t, {
			clerkOrgId: "org_inventory_auth",
			tokenIdentifier: "tid_inventory_staff",
			orgRole: "member",
		});

		const productId = await owner.mutation(api.catalog.createProduct, {
			sku: "INV-AUTH-001",
			name: "Paper Straw",
			base_unit: "pcs",
			product_type: "packaging",
			sellable: false,
			stock_tracked: true,
			track_expiry: false,
			is_bom: false,
			min_stock_level: 10,
		});

		await owner.mutation(api.inventory.createInboundReceipt, {
			product_id: productId,
			batch_code: "INV-AUTH-B1",
			cost_price: 1,
			quantity: 20,
		});

		await expect(staff.query(api.inventory.listInventoryProducts, {})).rejects.toThrow(
			"Unauthorized",
		);

		await expect(
			staff.query(api.inventory.getProductBatches, {
				product_id: productId,
			}),
		).rejects.toThrow("Unauthorized");
	});
});

describe("inventory item and batch creation flows", () => {
	it("auto-generates a batch code for inbound receipts when omitted", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_batch_auto",
			tokenIdentifier: "tid_batch_auto",
		});

		const productId = await owner.mutation(api.catalog.createProduct, {
			sku: "AUTO-BATCH-001",
			name: "Boba Pearls",
			base_unit: "g",
			product_type: "raw_material",
			sellable: false,
			stock_tracked: true,
			track_expiry: false,
			is_bom: false,
			min_stock_level: 0,
		});

		const receipt = await owner.mutation(api.inventory.createInboundReceipt, {
			product_id: productId,
			cost_price: 3,
			quantity: 40,
		});

		expect(receipt.batch_code).toMatch(/^BCH-\d{4,}$/);
		expect(receipt.total_asset_value).toBe(120);

		const batch = await t.run(async (ctx) => ctx.db.get(receipt.batch_id));
		expect(batch?.batch_code).toBe(receipt.batch_code);
	});

	it("creates a new item with initial batch using auto SKU and auto batch code", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_item_batch_create",
			tokenIdentifier: "tid_item_batch_create",
		});

		const categoryId = await owner.mutation(api.categories.createCategory, {
			name: "Food",
		});

		const supplierId = await owner.mutation(api.suppliers.createSupplier, {
			name: "Farm Supplier",
		});

		const now = Date.now();
		const created = await owner.mutation(
			api.inventory.createProductWithInitialBatch,
			{
				category_id: categoryId,
				name: "Egg",
				image_url: "https://example.com/images/egg.png",
				product_type: "raw_material",
				base_unit: "pcs",
				sellable: false,
				track_expiry: true,
				is_bom: false,
				min_stock_level: 20,
				supplier_id: supplierId,
				cost_price: 5.4,
				quantity: 89,
				expiry_date: now + 5 * 24 * 60 * 60 * 1000,
			},
		);

		expect(created.sku).toMatch(/^RAW-\d{4,}$/);
		expect(created.batch_code).toMatch(/^BCH-\d{4,}$/);
		expect(created.total_asset_value).toBeCloseTo(480.6);

		const persisted = await t.run(async (ctx) => {
			const product = await ctx.db.get(created.product_id);
			const batch = await ctx.db.get(created.batch_id);
			return { product, batch };
		});

		expect(persisted.product?.name).toBe("Egg");
		expect(persisted.product?.image_url).toBe(
			"https://example.com/images/egg.png",
		);
		expect(persisted.product?.sku).toBe(created.sku);
		expect(persisted.batch?.batch_code).toBe(created.batch_code);
		expect(persisted.batch?.supplier_id).toBe(supplierId);
		expect(persisted.batch?.remaining_qty).toBe(89);
	});

	it("auto-generates SKU for catalog.createProduct when sku is omitted", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_sku_auto",
			tokenIdentifier: "tid_sku_auto",
		});

		const productId = await owner.mutation(api.catalog.createProduct, {
			name: "Paper Straw",
			image_url: "https://example.com/images/straw.png",
			base_unit: "pcs",
			product_type: "packaging",
			sellable: false,
			stock_tracked: true,
			track_expiry: false,
			is_bom: false,
			min_stock_level: 100,
		});

		const product = await owner.query(api.catalog.getProductById, {
			product_id: productId,
		});

		expect(product.sku).toMatch(/^PKG-\d{4,}$/);
		expect(product.image_url).toBe("https://example.com/images/straw.png");
	});

	it("blocks staff from combined createProductWithInitialBatch", async () => {
		const t = createTestBackend();
		const orgId = await seedOrganization(t, {
			clerkOrgId: "org_item_batch_auth",
		});

		await seedUser(t, {
			orgId,
			tokenIdentifier: "tid_item_batch_owner",
			role: "owner",
		});
		await seedUser(t, {
			orgId,
			tokenIdentifier: "tid_item_batch_staff",
			role: "staff",
		});

		const staff = asOrgUser(t, {
			clerkOrgId: "org_item_batch_auth",
			tokenIdentifier: "tid_item_batch_staff",
			orgRole: "member",
		});

		await expect(
			staff.mutation(api.inventory.createProductWithInitialBatch, {
				name: "Coke 1.5L",
				product_type: "sellable",
				base_unit: "bottle",
				sellable: true,
				track_expiry: false,
				is_bom: false,
				cost_price: 50,
				quantity: 10,
			}),
		).rejects.toThrow("Unauthorized");
	});
});
