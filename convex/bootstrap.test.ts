import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { createTestBackend } from "./test-utils.test";

describe("bootstrap.syncCurrentClerkOrg", () => {
	it("provisions an organization and owner profile for an authenticated admin", async () => {
		const t = createTestBackend();
		const actor = t.withIdentity({
			tokenIdentifier: "tid_owner_1",
			subject: "clerk_user_1",
			issuer: "https://clerk.test",
			email: "owner@example.test",
			name: "Owner One",
			givenName: "Owner",
			familyName: "One",
			org_id: "org_clerk_1",
			org_role: "admin",
		});

		const orgId = await actor.mutation(api.bootstrap.syncCurrentClerkOrg, {});

		const organization = await t.run(async (ctx) => await ctx.db.get(orgId));
		expect(organization?.clerk_org_id).toBe("org_clerk_1");
		expect(organization?.status).toBe("active");

		const users = await t.run(async (ctx) => {
			return await ctx.db
				.query("users")
				.withIndex("by_org_id", (q) => q.eq("org_id", orgId))
				.take(10);
		});
		expect(users).toHaveLength(1);
		expect(users[0]?.token_identifier).toBe("tid_owner_1");
		expect(users[0]?.role).toBe("owner");
	});

	it("is idempotent when run repeatedly for the same org and user", async () => {
		const t = createTestBackend();
		const actor = t.withIdentity({
			tokenIdentifier: "tid_owner_2",
			subject: "clerk_user_2",
			issuer: "https://clerk.test",
			email: "owner2@example.test",
			name: "Owner Two",
			org_id: "org_clerk_2",
			org_role: "admin",
		});

		const firstOrgId = await actor.mutation(api.bootstrap.syncCurrentClerkOrg, {});
		const secondOrgId = await actor.mutation(api.bootstrap.syncCurrentClerkOrg, {});

		expect(secondOrgId).toBe(firstOrgId);

		const organizations = await t.run(async (ctx) => {
			return await ctx.db
				.query("organizations")
				.withIndex("by_clerk_org_id", (q) =>
					q.eq("clerk_org_id", "org_clerk_2"),
				)
				.take(10);
		});
		expect(organizations).toHaveLength(1);

		const users = await t.run(async (ctx) => {
			return await ctx.db
				.query("users")
				.withIndex("by_org_id", (q) => q.eq("org_id", firstOrgId))
				.take(10);
		});
		expect(users).toHaveLength(1);
	});

	it("requires an active organization claim in identity", async () => {
		const t = createTestBackend();
		const actor = t.withIdentity({
			tokenIdentifier: "tid_no_org",
			subject: "clerk_user_no_org",
			issuer: "https://clerk.test",
		});

		await expect(
			actor.mutation(api.bootstrap.syncCurrentClerkOrg, {}),
		).rejects.toThrow("Active organization required");
	});
});