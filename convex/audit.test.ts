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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("audit log", () => {
	// -----------------------------------------------------------------------
	// Create product emits audit log
	// -----------------------------------------------------------------------
	it("emits a create audit log when a product is created", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_audit_create",
			tokenIdentifier: "tid_audit_create",
		});

		const productId = await seedProduct(owner, {
			sku: "AUD-001",
			name: "Audit Product",
		});

		const logs = await owner.query(api.audit.listAuditLogs, {});

		const productLog = logs.find(
			(l) => l.entity_affected === "products" && l.record_id === productId,
		);

		expect(productLog).toBeDefined();
		expect(productLog?.action_type).toBe("create");
		const changeLog = productLog?.change_log as {
			next: { sku: string; name: string };
		};
		expect(changeLog.next.sku).toBe("AUD-001");
		expect(changeLog.next.name).toBe("Audit Product");
	});

	// -----------------------------------------------------------------------
	// Update product emits delta audit log
	// -----------------------------------------------------------------------
	it("emits an update audit log with before/after delta when a product is updated", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_audit_update",
			tokenIdentifier: "tid_audit_update",
		});

		const productId = await seedProduct(owner, {
			sku: "AUD-UPD",
			name: "Original Name",
		});

		await owner.mutation(api.catalog.updateProduct, {
			product_id: productId,
			sku: "AUD-UPD",
			name: "Updated Name",
			base_unit: "kg",
			product_type: "raw_material",
			sellable: false,
			stock_tracked: true,
			track_expiry: false,
			is_bom: false,
			min_stock_level: 0,
			category_id: null,
		});

		const logs = await owner.query(api.audit.listAuditLogs, {
			entity_affected: "products",
		});

		const updateLog = logs.find(
			(l) => l.action_type === "update" && l.record_id === productId,
		);

		expect(updateLog).toBeDefined();
		const changeLog = updateLog?.change_log as {
			previous: { name: string };
			next: { name: string };
		};
		expect(changeLog.previous.name).toBe("Original Name");
		expect(changeLog.next.name).toBe("Updated Name");
	});

	// -----------------------------------------------------------------------
	// Archive product emits audit log
	// -----------------------------------------------------------------------
	it("emits an archive audit log when a product is archived", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_audit_archive",
			tokenIdentifier: "tid_audit_archive",
		});

		const productId = await seedProduct(owner, {
			sku: "AUD-ARCH",
			name: "Archive Me",
		});

		await owner.mutation(api.catalog.archiveProduct, { product_id: productId });

		const logs = await owner.query(api.audit.listAuditLogs, {
			entity_affected: "products",
		});

		const archiveLog = logs.find(
			(l) => l.action_type === "archive" && l.record_id === productId,
		);

		expect(archiveLog).toBeDefined();
		const changeLog = archiveLog?.change_log as {
			next: { archived_at: number };
		};
		expect(typeof changeLog.next.archived_at).toBe("number");
	});

	// -----------------------------------------------------------------------
	// Adjustment emits audit log
	// -----------------------------------------------------------------------
	it("emits an adjust audit log with before/after qty when a batch is adjusted", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_audit_adjust",
			tokenIdentifier: "tid_audit_adjust",
		});

		const productId = await seedProduct(owner, {
			sku: "AUD-ADJ",
			name: "Adjustable Item",
		});

		const receipt = await owner.mutation(api.inventory.createInboundReceipt, {
			product_id: productId,
			batch_code: "AUD-BATCH",
			cost_price: 10,
			quantity: 100,
		});

		await owner.mutation(api.adjustments.createAdjustment, {
			batch_id: receipt.batch_id,
			adjusted_qty: 80,
			reason: "spoilage",
		});

		const logs = await owner.query(api.audit.listAuditLogs, {
			entity_affected: "batches",
		});

		const adjustLog = logs.find(
			(l) => l.action_type === "adjust" && l.record_id === receipt.batch_id,
		);

		expect(adjustLog).toBeDefined();
		const changeLog = adjustLog?.change_log as {
			previous: { remaining_qty: number };
			next: { remaining_qty: number; reason: string };
		};
		expect(changeLog.previous.remaining_qty).toBe(100);
		expect(changeLog.next.remaining_qty).toBe(80);
		expect(changeLog.next.reason).toBe("spoilage");
	});

	// -----------------------------------------------------------------------
	// User name enrichment
	// -----------------------------------------------------------------------
	it("enriches audit logs with user name and email", async () => {
		const t = createTestBackend();
		const orgId = await seedOrganization(t, { clerkOrgId: "org_audit_enrich" });
		await seedUser(t, {
			orgId,
			tokenIdentifier: "tid_audit_enrich",
			firstName: "Alice",
			lastName: "Smith",
			email: "alice@example.test",
		});

		const owner = asOrgUser(t, {
			clerkOrgId: "org_audit_enrich",
			tokenIdentifier: "tid_audit_enrich",
			orgRole: "admin",
		});

		await seedProduct(owner, { sku: "AUD-ENR", name: "Enriched" });

		const logs = await owner.query(api.audit.listAuditLogs, {});
		const log = logs[0];

		expect(log?.user_name).toContain("Alice");
		expect(log?.user_email).toBe("alice@example.test");
	});

	// -----------------------------------------------------------------------
	// Staff cannot view audit logs
	// -----------------------------------------------------------------------
	it("blocks staff from viewing audit logs", async () => {
		const t = createTestBackend();
		const { orgId } = await seedMembership(t, {
			clerkOrgId: "org_audit_staff",
			tokenIdentifier: "tid_audit_owner",
		});

		await seedUser(t, {
			orgId,
			tokenIdentifier: "tid_audit_staff",
			role: "staff",
		});

		const staff = asOrgUser(t, {
			clerkOrgId: "org_audit_staff",
			tokenIdentifier: "tid_audit_staff",
			orgRole: "member",
		});

		await expect(
			staff.query(api.audit.listAuditLogs, {}),
		).rejects.toThrow("Unauthorized");
	});

	// -----------------------------------------------------------------------
	// Cross-tenant isolation
	// -----------------------------------------------------------------------
	it("enforces cross-tenant isolation on audit log queries", async () => {
		const t = createTestBackend();
		const { actor: ownerA } = await seedMembership(t, {
			clerkOrgId: "org_audit_iso_a",
			tokenIdentifier: "tid_audit_iso_a",
		});
		const { actor: ownerB } = await seedMembership(t, {
			clerkOrgId: "org_audit_iso_b",
			tokenIdentifier: "tid_audit_iso_b",
		});

		await seedProduct(ownerB, { sku: "ISO-B-001", name: "Org B Product" });

		const logsA = await ownerA.query(api.audit.listAuditLogs, {});
		const orgBProductLog = logsA.find(
			(l) => (l.change_log as { next?: { sku?: string } })?.next?.sku === "ISO-B-001",
		);

		expect(orgBProductLog).toBeUndefined();
	});

	// -----------------------------------------------------------------------
	// Supplier create and update audit logs
	// -----------------------------------------------------------------------
	it("emits create and update audit logs for suppliers", async () => {
		const t = createTestBackend();
		const { actor: owner } = await seedMembership(t, {
			clerkOrgId: "org_audit_supplier",
			tokenIdentifier: "tid_audit_supplier",
		});

		const supplierId = await owner.mutation(api.suppliers.createSupplier, {
			name: "Original Supplier",
		});

		await owner.mutation(api.suppliers.updateSupplier, {
			supplier_id: supplierId,
			name: "Renamed Supplier",
		});

		const logs = await owner.query(api.audit.listAuditLogs, {
			entity_affected: "suppliers",
		});

		const createLog = logs.find(
			(l) => l.action_type === "create" && l.record_id === supplierId,
		);
		const updateLog = logs.find(
			(l) => l.action_type === "update" && l.record_id === supplierId,
		);

		expect(createLog).toBeDefined();
		expect(updateLog).toBeDefined();
		const updateChange = updateLog?.change_log as {
			previous: { name: string };
			next: { name: string };
		};
		expect(updateChange.previous.name).toBe("Original Supplier");
		expect(updateChange.next.name).toBe("Renamed Supplier");
	});
});
