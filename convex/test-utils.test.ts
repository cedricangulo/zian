import { convexTest } from "convex-test";
import { test } from "vitest";
import type { UserIdentity } from "convex/server";
import type { Id } from "./_generated/dataModel";
import schema from "./schema";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const modules = (import.meta as any).glob("./**/*.ts");

type OrgRoleClaim = "admin" | "owner" | "member";
type AppUserRole = "super_admin" | "owner" | "staff";

// Dummy test so vitest doesn't complain about no test suite found
test.skip("utils", () => {});

export function createTestBackend() {
	return convexTest(schema, modules);
}

type SeedOrganizationOptions = {
	clerkOrgId: string;
	name?: string;
	status?: "active" | "suspended" | "archived";
};

export async function seedOrganization(
	t: ReturnType<typeof createTestBackend>,
	options: SeedOrganizationOptions,
): Promise<Id<"organizations">> {
	return await t.run(async (ctx) => {
		return await ctx.db.insert("organizations", {
			clerk_org_id: options.clerkOrgId,
			name: options.name ?? `Org ${options.clerkOrgId}`,
			status: options.status ?? "active",
			archived_at: options.status === "archived" ? Date.now() : undefined,
		});
	});
}

type SeedUserOptions = {
	orgId: Id<"organizations">;
	tokenIdentifier: string;
	clerkUserId?: string;
	firstName?: string;
	lastName?: string;
	email?: string;
	role?: AppUserRole;
};

export async function seedUser(
	t: ReturnType<typeof createTestBackend>,
	options: SeedUserOptions,
): Promise<Id<"users">> {
	return await t.run(async (ctx) => {
		return await ctx.db.insert("users", {
			org_id: options.orgId,
			token_identifier: options.tokenIdentifier,
			clerk_user_id: options.clerkUserId ?? options.tokenIdentifier,
			first_name: options.firstName ?? "Test",
			last_name: options.lastName ?? "User",
			email:
				options.email ??
				`${options.tokenIdentifier.replace(/[^a-zA-Z0-9]/g, "")}@example.test`,
			role: options.role ?? "owner",
		});
	});
}

type AsOrgUserOptions = {
	clerkOrgId: string;
	tokenIdentifier: string;
	subject?: string;
	orgRole?: OrgRoleClaim;
	email?: string;
	name?: string;
	givenName?: string;
	familyName?: string;
};

export function asOrgUser(
	t: ReturnType<typeof createTestBackend>,
	options: AsOrgUserOptions,
) {
	const identity: Partial<UserIdentity> = {
		tokenIdentifier: options.tokenIdentifier,
		subject: options.subject ?? options.tokenIdentifier,
		issuer: "https://clerk.test",
		name: options.name ?? "Test User",
		givenName: options.givenName ?? "Test",
		familyName: options.familyName ?? "User",
		email:
			options.email ??
			`${options.tokenIdentifier.replace(/[^a-zA-Z0-9]/g, "")}@example.test`,
		org_id: options.clerkOrgId,
		org_role: options.orgRole ?? "admin",
	};

	return t.withIdentity(identity);
}

type SeedMembershipOptions = {
	clerkOrgId: string;
	tokenIdentifier: string;
	appRole?: AppUserRole;
	orgRole?: OrgRoleClaim;
};

export async function seedMembership(
	t: ReturnType<typeof createTestBackend>,
	options: SeedMembershipOptions,
) {
	const orgId = await seedOrganization(t, { clerkOrgId: options.clerkOrgId });
	const userId = await seedUser(t, {
		orgId,
		tokenIdentifier: options.tokenIdentifier,
		role: options.appRole ?? "owner",
	});

	const actor = asOrgUser(t, {
		clerkOrgId: options.clerkOrgId,
		tokenIdentifier: options.tokenIdentifier,
		orgRole: options.orgRole ?? "admin",
	});

	return { orgId, userId, actor };
}