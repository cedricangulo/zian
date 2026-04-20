import type { MutationCtx, QueryCtx } from "../_generated/server";

export async function getAuthenticatedIdentity(ctx: QueryCtx | MutationCtx) {
	const identity = await ctx.auth.getUserIdentity();
	if (!identity) {
		throw new Error("Not authenticated");
	}
	return identity;
}

export function getStringClaim(
	identity: Awaited<ReturnType<QueryCtx["auth"]["getUserIdentity"]>>,
	claim: string,
): string | undefined {
	if (!identity) {
		return undefined;
	}
	const value = identity[claim];
	return typeof value === "string" ? value : undefined;
}

export function getClerkOrgId(
	identity: Awaited<ReturnType<QueryCtx["auth"]["getUserIdentity"]>>,
): string | undefined {
	const orgId = getStringClaim(identity, "org_id");
	if (orgId) {
		return orgId;
	}

	if (!identity?.subject) {
		return undefined;
	}

	// Fallback for first-time owner signups before Clerk org claims exist.
	return `personal_${identity.subject}`;
}

export function getClerkOrgRole(
	identity: Awaited<ReturnType<QueryCtx["auth"]["getUserIdentity"]>>,
): string | undefined {
	return getStringClaim(identity, "org_role");
}
