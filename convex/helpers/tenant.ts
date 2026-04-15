import type { Doc, Id } from "../_generated/dataModel";
import type { MutationCtx, QueryCtx } from "../_generated/server";

export async function getActiveOrganizationByClerkId(
	ctx: QueryCtx | MutationCtx,
	clerkOrgId: string,
): Promise<Doc<"organizations"> | null> {
	const organization = await ctx.db
		.query("organizations")
		.withIndex("by_clerk_org_id", (q) => q.eq("clerk_org_id", clerkOrgId))
		.unique();
	return organization;
}

export async function getUserByTokenIdentifier(
	ctx: QueryCtx | MutationCtx,
	orgId: Id<"organizations">,
	tokenIdentifier: string,
): Promise<Doc<"users"> | null> {
	const user = await ctx.db
		.query("users")
		.withIndex("by_org_id_and_token_identifier", (q) =>
			q.eq("org_id", orgId).eq("token_identifier", tokenIdentifier),
		)
		.unique();
	return user;
}
