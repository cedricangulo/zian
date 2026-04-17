import type { Doc, Id, TableNames } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";
import {
	getAuthenticatedIdentity,
	getClerkOrgId,
	getClerkOrgRole,
} from "./auth";
import {
	getActiveOrganizationByClerkId,
	getUserByTokenIdentifier,
} from "./tenant";

export type CurrentContext = {
	identity: NonNullable<
		Awaited<ReturnType<QueryCtx["auth"]["getUserIdentity"]>>
	>;
	organization: Doc<"organizations">;
	user: Doc<"users">;
};

export async function requireCurrentContext(
	ctx: QueryCtx | MutationCtx,
): Promise<CurrentContext> {
	const identity = await getAuthenticatedIdentity(ctx);
	const clerkOrgId = getClerkOrgId(identity);
	if (!clerkOrgId) {
		throw new Error("Active organization required");
	}

	const organization = await getActiveOrganizationByClerkId(ctx, clerkOrgId);
	if (!organization) {
		throw new Error("Organization not found");
	}

	const user = await getUserByTokenIdentifier(
		ctx,
		organization._id,
		identity.tokenIdentifier,
	);
	if (!user) {
		throw new Error("User profile not found");
	}

	return { identity, organization, user };
}

export async function requireOwnerContext(
	ctx: QueryCtx | MutationCtx,
): Promise<CurrentContext> {
	const current = await requireCurrentContext(ctx);
	const role = getClerkOrgRole(current.identity);
	if (current.user.role !== "owner" && current.user.role !== "super_admin") {
		if (role !== "admin" && role !== "owner") {
			throw new Error("Unauthorized");
		}
	}
	return current;
}

export async function requireSuperAdminContext(
	ctx: QueryCtx | MutationCtx,
): Promise<CurrentContext> {
	const current = await requireCurrentContext(ctx);
	if (current.user.role !== "super_admin") {
		throw new Error("Unauthorized");
	}
	return current;
}

export function ensureOrgScopedId<T extends TableNames>(id: Id<T>) {
	return id;
}
