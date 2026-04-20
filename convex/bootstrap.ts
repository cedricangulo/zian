import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";
import {
	getAuthenticatedIdentity,
	getClerkOrgId,
	getStringClaim,
} from "./helpers/auth";
import { getActiveOrganizationByClerkId } from "./helpers/tenant";

export const syncCurrentClerkOrg = mutation({
	args: {},
	handler: async (ctx) => {
		const identity = await getAuthenticatedIdentity(ctx);
		const clerkOrgId = getClerkOrgId(identity);
		const hasClerkOrgClaim = Boolean(getStringClaim(identity, "org_id"));
		if (!clerkOrgId) {
			throw new Error("Active organization required");
		}

		const organization = await getActiveOrganizationByClerkId(ctx, clerkOrgId);
		const orgId: Id<"organizations"> = organization
			? organization._id
			: await ctx.db.insert("organizations", {
					clerk_org_id: clerkOrgId,
					name: identity.name ?? "Organization",
					status: "active",
					onboarding_status: "profile_pending",
					business_name: undefined,
					business_sector: undefined,
					business_type: undefined,
					business_age_range: undefined,
					business_address: undefined,
					business_logo_file_id: undefined,
					archived_at: undefined,
				});

		const tokenIdentifier = identity.tokenIdentifier;
		const user = await ctx.db
			.query("users")
			.withIndex("by_org_id_and_token_identifier", (q) =>
				q.eq("org_id", orgId).eq("token_identifier", tokenIdentifier),
			)
			.unique();

		if (!user) {
			await ctx.db.insert("users", {
				org_id: orgId,
				token_identifier: tokenIdentifier,
				clerk_user_id: identity.subject,
				first_name: identity.givenName ?? "",
				last_name: identity.familyName ?? "",
				email: identity.email ?? tokenIdentifier,
				role: hasClerkOrgClaim
					? identity["org_role"] === "admin"
						? "owner"
						: "staff"
					: "owner",
			});
		}

		return orgId;
	},
});
