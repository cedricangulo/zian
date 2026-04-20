import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireSuperAdminContext } from "./helpers/context";

// ---------------------------------------------------------------------------
// Platform Usage — Super Admin only
// Provides high-level health metrics across all tenants.
// ---------------------------------------------------------------------------

export const getPlatformUsage = query({
	args: {
		limit: v.optional(v.number()),
	},
	handler: async (ctx, args) => {
		// This endpoint is restricted to super_admin role only.
		// requireCurrentContext resolves user via the Clerk token, so no
		// org claim is required for super admins.
		await requireSuperAdminContext(ctx);

		const orgLimit = Math.min(args.limit ?? 500, 500);

		// Fetch all organizations — bounded by limit
		const organizations = await ctx.db
			.query("organizations")
			.order("asc")
			.take(orgLimit);

		// Count orgs by status in a single pass
		let activeCount = 0;
		let suspendedCount = 0;
		let archivedCount = 0;

		for (const org of organizations) {
			if (org.status === "active") activeCount++;
			else if (org.status === "suspended") suspendedCount++;
			else if (org.status === "archived") archivedCount++;
		}

		// Fetch users per organization — bounded per org
		const orgIds = organizations.map((o) => o._id);

		const userCountsPerOrg = await Promise.all(
			orgIds.map(async (orgId) => {
				// Take 201 so we can detect if a tenant has >200 users
				const users = await ctx.db
					.query("users")
					.withIndex("by_org_id", (q) => q.eq("org_id", orgId))
					.take(201);
				return { orgId, count: users.length };
			}),
		);

		const userCountMap = new Map(
			userCountsPerOrg.map(({ orgId, count }) => [orgId, count]),
		);

		// Build per-tenant summary
		const tenants = organizations.map((org) => ({
			org_id: org._id,
			clerk_org_id: org.clerk_org_id,
			name: org.name,
			status: org.status,
			user_count: userCountMap.get(org._id) ?? 0,
		}));

		const totalUsers = userCountsPerOrg.reduce(
			(sum, { count }) => sum + count,
			0,
		);

		return {
			total_organizations: organizations.length,
			active_organizations: activeCount,
			suspended_organizations: suspendedCount,
			archived_organizations: archivedCount,
			total_users: totalUsers,
			tenants,
		};
	},
});
