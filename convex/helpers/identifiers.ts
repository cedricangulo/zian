import type { Id } from "../_generated/dataModel";
import type { MutationCtx } from "../_generated/server";

export type ProductType = "raw_material" | "packaging" | "sellable" | "composite";

const SKU_PREFIX_BY_PRODUCT_TYPE: Record<ProductType, string> = {
	raw_material: "RAW",
	packaging: "PKG",
	sellable: "SEL",
	composite: "CMP",
};

function normalizeSku(input: string) {
	return input.trim();
}

function normalizeBatchCode(input: string) {
	return input.trim();
}

export async function ensureUniqueSku(
	ctx: MutationCtx,
	orgId: Id<"organizations">,
	sku: string,
	excludingId?: string,
) {
	const collisions = await ctx.db
		.query("products")
		.withIndex("by_org_id_and_sku", (q) => q.eq("org_id", orgId).eq("sku", sku))
		.take(2);

	if (excludingId) {
		if (collisions.some((product) => product._id !== excludingId)) {
			throw new Error("SKU already exists in your organization");
		}
		return;
	}

	if (collisions.length > 0) {
		throw new Error("SKU already exists in your organization");
	}
}

async function generateAutoSku(
	ctx: MutationCtx,
	orgId: Id<"organizations">,
	productType: ProductType,
) {
	const prefix = SKU_PREFIX_BY_PRODUCT_TYPE[productType];

	const sameTypeProducts = await ctx.db
		.query("products")
		.withIndex("by_org_id_and_product_type", (q) =>
			q.eq("org_id", orgId).eq("product_type", productType),
		)
		.take(5000);

	let sequence = sameTypeProducts.length + 1;
	for (let attempts = 0; attempts < 10000; attempts += 1) {
		const candidate = `${prefix}-${String(sequence).padStart(4, "0")}`;
		const existing = await ctx.db
			.query("products")
			.withIndex("by_org_id_and_sku", (q) =>
				q.eq("org_id", orgId).eq("sku", candidate),
			)
			.take(1);

		if (existing.length === 0) {
			return candidate;
		}

		sequence += 1;
	}

	throw new Error("Unable to generate a unique SKU");
}

export async function resolveSku(
	ctx: MutationCtx,
	orgId: Id<"organizations">,
	productType: ProductType,
	requestedSku?: string,
	excludingId?: string,
) {
	const normalizedSku = requestedSku ? normalizeSku(requestedSku) : "";
	if (normalizedSku) {
		await ensureUniqueSku(ctx, orgId, normalizedSku, excludingId);
		return normalizedSku;
	}

	return await generateAutoSku(ctx, orgId, productType);
}

async function ensureUniqueBatchCode(
	ctx: MutationCtx,
	orgId: Id<"organizations">,
	batchCode: string,
) {
	const duplicateBatch = await ctx.db
		.query("batches")
		.withIndex("by_org_id_and_batch_code", (q) =>
			q.eq("org_id", orgId).eq("batch_code", batchCode),
		)
		.take(1);

	if (duplicateBatch.length > 0) {
		throw new Error("Batch code already exists in your organization");
	}
}

async function generateAutoBatchCode(ctx: MutationCtx, orgId: Id<"organizations">) {
	const batches = await ctx.db
		.query("batches")
		.withIndex("by_org_id", (q) => q.eq("org_id", orgId))
		.take(5000);

	let maxObserved = 0;
	for (const batch of batches) {
		const match = /^BCH-(\d+)$/.exec(batch.batch_code);
		if (!match) {
			continue;
		}
		const parsed = Number.parseInt(match[1], 10);
		if (Number.isFinite(parsed) && parsed > maxObserved) {
			maxObserved = parsed;
		}
	}

	let sequence = maxObserved + 1;
	for (let attempts = 0; attempts < 20000; attempts += 1) {
		const candidate = `BCH-${String(sequence).padStart(4, "0")}`;
		const existing = await ctx.db
			.query("batches")
			.withIndex("by_org_id_and_batch_code", (q) =>
				q.eq("org_id", orgId).eq("batch_code", candidate),
			)
			.take(1);

		if (existing.length === 0) {
			return candidate;
		}
		sequence += 1;
	}

	throw new Error("Unable to generate a unique batch code");
}

export async function resolveBatchCode(
	ctx: MutationCtx,
	orgId: Id<"organizations">,
	requestedBatchCode?: string,
) {
	const normalizedBatchCode = requestedBatchCode
		? normalizeBatchCode(requestedBatchCode)
		: "";
	if (normalizedBatchCode) {
		await ensureUniqueBatchCode(ctx, orgId, normalizedBatchCode);
		return normalizedBatchCode;
	}

	return await generateAutoBatchCode(ctx, orgId);
}
