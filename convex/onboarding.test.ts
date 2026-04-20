import { describe, expect, it } from "vitest";
import { api } from "./_generated/api";
import { createTestBackend, seedMembership } from "./test-utils.test";

describe("onboarding profile and business setup", () => {
	it("moves onboarding from profile step to business step then complete", async () => {
		const t = createTestBackend();
		const { actor, orgId, userId } = await seedMembership(t, {
			clerkOrgId: "org_onboarding_flow",
			tokenIdentifier: "tid_onboarding_flow",
		});

		const initialStatus = await actor.query(
			api.onboarding.getOnboardingStatus,
			{},
		);
		expect(initialStatus.status).toBe("profile_pending");
		expect(initialStatus.is_complete).toBe(false);

		const profileResult = await actor.mutation(
			api.onboarding.updateProfileSetup,
			{
				first_name: "Owner",
				middle_name: "M",
				last_name: "Flow",
				contact_number: "09171234567",
				sex: "male",
			},
		);
		expect(profileResult.user_id).toBe(userId);
		expect(profileResult.onboarding_status).toBe("business_pending");

		const afterProfile = await actor.query(
			api.onboarding.getOnboardingStatus,
			{},
		);
		expect(afterProfile.status).toBe("business_pending");
		expect(afterProfile.profile_complete).toBe(true);
		expect(afterProfile.business_complete).toBe(false);

		const businessResult = await actor.mutation(
			api.onboarding.updateBusinessDetails,
			{
				business_name: "Flow Cafe",
				business_sector: "dairy_and_refrigerated_goods",
				business_type: "Cafe",
				business_age_range: "1_3_years",
				business_address: "Makati City",
				business_logo_file_id: "file_logo_flow",
			},
		);
		expect(businessResult.organization_id).toBe(orgId);
		expect(businessResult.onboarding_status).toBe("complete");

		const finalStatus = await actor.query(
			api.onboarding.getOnboardingStatus,
			{},
		);
		expect(finalStatus.is_complete).toBe(true);
		expect(finalStatus.status).toBe("complete");
		expect(finalStatus.profile_complete).toBe(true);
		expect(finalStatus.business_complete).toBe(true);
	});

	it("stays business_pending until business details are submitted", async () => {
		const t = createTestBackend();
		const { actor } = await seedMembership(t, {
			clerkOrgId: "org_onboarding_pending",
			tokenIdentifier: "tid_onboarding_pending",
		});

		await actor.mutation(api.onboarding.updateProfileSetup, {
			first_name: "Owner",
			middle_name: undefined,
			last_name: "Pending",
			contact_number: "09998887777",
			sex: "female",
		});

		const status = await actor.query(api.onboarding.getOnboardingStatus, {});
		expect(status.status).toBe("business_pending");
		expect(status.is_complete).toBe(false);
		expect(status.profile_complete).toBe(true);
		expect(status.business_complete).toBe(false);
	});

	it("relinks personal fallback org id to Clerk org id", async () => {
		const t = createTestBackend();
		const tokenIdentifier = "tid_onboarding_relink";
		const subject = "user_onboarding_relink";
		const personalClerkOrgId = `personal_${subject}`;
		const nextClerkOrgId = "org_onboarding_relinked";

		const { actor, orgId } = await seedMembership(t, {
			clerkOrgId: personalClerkOrgId,
			tokenIdentifier,
		});

		// Override subject to mirror real fallback behavior (personal_<subject>)
		const relinkActor = t.withIdentity({
			tokenIdentifier,
			subject,
			issuer: "https://clerk.test",
			email: "relink@example.test",
			name: "Relink User",
			givenName: "Relink",
			familyName: "User",
		});

		const result = await relinkActor.mutation(
			api.onboarding.relinkPersonalOrgToClerkOrg,
			{
				clerk_org_id: nextClerkOrgId,
			},
		);

		expect(result.organization_id).toBe(orgId);
		expect(result.clerk_org_id).toBe(nextClerkOrgId);
		expect(result.relinked).toBe(true);

		const organizations = await t.run(async (ctx) => {
			return await ctx.db.query("organizations").collect();
		});

		expect(organizations).toHaveLength(1);
		expect(organizations[0]?.clerk_org_id).toBe(nextClerkOrgId);

		// Keep actor variable used to avoid dead-code in stricter lint settings.
		expect(actor).toBeTruthy();
	});
});
