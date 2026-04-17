import { v } from "convex/values";
import type { Id } from "./_generated/dataModel";
import { mutation, query, type MutationCtx } from "./_generated/server";
import { computeDelta, writeAuditLog } from "./helpers/audit";
import { requireCurrentContext, requireOwnerContext } from "./helpers/context";

async function deleteSupplierRecord(
	ctx: MutationCtx,
	orgId: Id<"organizations">,
	supplierId: Id<"suppliers">,
) {
	const supplier = await ctx.db.get(supplierId);
	if (!supplier || supplier.org_id !== orgId) {
		throw new Error("Supplier not found in your organization");
	}

	const referencingBatch = await ctx.db
		.query("batches")
		.withIndex("by_org_id_and_supplier_id", (q) =>
			q.eq("org_id", orgId).eq("supplier_id", supplierId),
		)
		.take(1);

	if (referencingBatch.length > 0) {
		throw new Error(
			"Cannot archive supplier because it is referenced by existing batches",
		);
	}

	await ctx.db.delete(supplierId);
	return supplierId;
}

export const listSuppliers = query({
	args: {},
	handler: async (ctx) => {
		const { organization } = await requireCurrentContext(ctx);
		return await ctx.db
			.query("suppliers")
			.withIndex("by_org_id", (q) => q.eq("org_id", organization._id))
			.take(100);
	},
});

export const getSupplierById = query({
	args: {
		supplier_id: v.id("suppliers"),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireCurrentContext(ctx);
		const supplier = await ctx.db.get(args.supplier_id);
		if (!supplier || supplier.org_id !== organization._id) {
			throw new Error("Supplier not found in your organization");
		}

		return supplier;
	},
});

export const createSupplier = mutation({
	args: {
		name: v.string(),
		contact_first_name: v.optional(v.string()),
		contact_last_name: v.optional(v.string()),
		phone_number: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { organization, user } = await requireOwnerContext(ctx);
		const supplierId = await ctx.db.insert("suppliers", {
			org_id: organization._id,
			name: args.name,
			contact_first_name: args.contact_first_name,
			contact_last_name: args.contact_last_name,
			phone_number: args.phone_number,
		});
		await writeAuditLog(ctx, {
			orgId: organization._id,
			userId: user._id,
			actionType: "create",
			entityAffected: "suppliers",
			recordId: supplierId,
			changeLog: { next: { name: args.name } },
		});
		return supplierId;
	},
});

export const updateSupplier = mutation({
	args: {
		supplier_id: v.id("suppliers"),
		name: v.string(),
		contact_first_name: v.optional(v.string()),
		contact_last_name: v.optional(v.string()),
		phone_number: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { organization, user } = await requireOwnerContext(ctx);
		const supplier = await ctx.db.get(args.supplier_id);
		if (!supplier || supplier.org_id !== organization._id) {
			throw new Error("Supplier not found in your organization");
		}

		const patchData = {
			name: args.name,
			contact_first_name: args.contact_first_name,
			contact_last_name: args.contact_last_name,
			phone_number: args.phone_number,
		};
		const delta = computeDelta(supplier as Record<string, unknown>, patchData);
		await ctx.db.patch(args.supplier_id, patchData);
		if (delta) {
			await writeAuditLog(ctx, {
				orgId: organization._id,
				userId: user._id,
				actionType: "update",
				entityAffected: "suppliers",
				recordId: args.supplier_id,
				changeLog: delta,
			});
		}

		return args.supplier_id;
	},
});

export const archiveSupplier = mutation({
	args: {
		supplier_id: v.id("suppliers"),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireOwnerContext(ctx);
		return await deleteSupplierRecord(ctx, organization._id, args.supplier_id);
	},
});

export const deleteSupplier = mutation({
	args: {
		supplier_id: v.id("suppliers"),
	},
	handler: async (ctx, args) => {
		const { organization } = await requireOwnerContext(ctx);
		return await deleteSupplierRecord(ctx, organization._id, args.supplier_id);
	},
});
