import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { computeDelta, writeAuditLog } from "./helpers/audit";
import { getAuthenticatedIdentity } from "./helpers/auth";
import { requireCurrentContext } from "./helpers/context";
import {
	businessAgeRange,
	businessSector,
	type OnboardingStatus,
	profileSex,
} from "./helpers/validators";

function hasProfileSetup(user: Doc<"users">) {
	return Boolean(
		user.first_name.trim() &&
			user.last_name.trim() &&
			user.contact_number?.trim() &&
			user.sex,
	);
}

function hasBusinessSetup(organization: Doc<"organizations">) {
	return Boolean(
		organization.business_name?.trim() &&
			organization.business_sector &&
			organization.business_type?.trim() &&
			organization.business_age_range &&
			organization.business_address?.trim(),
	);
}

function deriveOnboardingStatus(
	organization: Doc<"organizations">,
	user: Doc<"users">,
): OnboardingStatus {
	if (!hasProfileSetup(user)) {
		return "profile_pending";
	}

	if (!hasBusinessSetup(organization)) {
		return "business_pending";
	}

	return "complete";
}

export const updateProfileSetup = mutation({
	args: {
		first_name: v.string(),
		middle_name: v.optional(v.string()),
		last_name: v.string(),
		contact_number: v.string(),
		sex: profileSex,
	},
	handler: async (ctx, args) => {
		const { organization, user } = await requireCurrentContext(ctx);
		const patchData = {
			first_name: args.first_name.trim(),
			middle_name: args.middle_name?.trim(),
			last_name: args.last_name.trim(),
			contact_number: args.contact_number.trim(),
			sex: args.sex,
		};
		const delta = computeDelta(user as Record<string, unknown>, patchData);
		await ctx.db.patch(user._id, patchData);

		const nextUser = await ctx.db.get(user._id);
		if (!nextUser) {
			throw new Error("User profile not found");
		}

		const nextStatus = deriveOnboardingStatus(organization, nextUser);
		if (organization.onboarding_status !== nextStatus) {
			await ctx.db.patch(organization._id, { onboarding_status: nextStatus });
		}

		if (delta) {
			await writeAuditLog(ctx, {
				orgId: organization._id,
				userId: user._id,
				actionType: "update",
				entityAffected: "users",
				recordId: user._id,
				changeLog: delta,
			});
		}

		return { user_id: user._id, onboarding_status: nextStatus };
	},
});

export const updateBusinessDetails = mutation({
	args: {
		business_name: v.string(),
		business_sector: businessSector,
		business_type: v.string(),
		business_age_range: businessAgeRange,
		business_address: v.string(),
		business_logo_file_id: v.optional(v.string()),
	},
	handler: async (ctx, args) => {
		const { organization, user } = await requireCurrentContext(ctx);

		const patchData = {
			name: args.business_name.trim(),
			business_name: args.business_name.trim(),
			business_sector: args.business_sector,
			business_type: args.business_type.trim(),
			business_age_range: args.business_age_range,
			business_address: args.business_address.trim(),
			business_logo_file_id: args.business_logo_file_id?.trim(),
		};
		const nextOrganization = {
			...organization,
			...patchData,
		} as Doc<"organizations">;
		const nextStatus = deriveOnboardingStatus(nextOrganization, user);
		const updatePayload = {
			...patchData,
			onboarding_status: nextStatus,
		};

		const delta = computeDelta(
			organization as Record<string, unknown>,
			updatePayload,
		);
		await ctx.db.patch(organization._id, updatePayload);

		if (delta) {
			await writeAuditLog(ctx, {
				orgId: organization._id,
				userId: user._id,
				actionType: "update",
				entityAffected: "organizations",
				recordId: organization._id,
				changeLog: delta,
			});
		}

		return { organization_id: organization._id, onboarding_status: nextStatus };
	},
});

export const generateBusinessLogoUploadUrl = mutation({
	args: {},
	handler: async (ctx) => {
		await requireCurrentContext(ctx);
		return await ctx.storage.generateUploadUrl();
	},
});

export const relinkPersonalOrgToClerkOrg = mutation({
	args: {
		clerk_org_id: v.string(),
	},
	handler: async (ctx, args) => {
		const identity = await getAuthenticatedIdentity(ctx);
		if (!identity.subject) {
			throw new Error("Authenticated identity is missing subject");
		}

		const nextClerkOrgId = args.clerk_org_id.trim();
		if (!nextClerkOrgId) {
			throw new Error("Clerk organization id is required");
		}

		const personalClerkOrgId = `personal_${identity.subject}`;

		const existingTargetOrg = await ctx.db
			.query("organizations")
			.withIndex("by_clerk_org_id", (q) =>
				q.eq("clerk_org_id", nextClerkOrgId),
			)
			.unique();

		if (existingTargetOrg) {
			return {
				organization_id: existingTargetOrg._id,
				clerk_org_id: existingTargetOrg.clerk_org_id,
				relinked: false,
			};
		}

		const personalOrg = await ctx.db
			.query("organizations")
			.withIndex("by_clerk_org_id", (q) =>
				q.eq("clerk_org_id", personalClerkOrgId),
			)
			.unique();

		if (!personalOrg) {
			throw new Error("Personal onboarding organization not found");
		}

		await ctx.db.patch(personalOrg._id, {
			clerk_org_id: nextClerkOrgId,
		});

		return {
			organization_id: personalOrg._id,
			clerk_org_id: nextClerkOrgId,
			relinked: true,
		};
	},
});

export const getOnboardingStatus = query({
	args: {},
	handler: async (ctx) => {
		const { organization, user } = await requireCurrentContext(ctx);
		const derivedStatus = deriveOnboardingStatus(organization, user);
		const status = organization.onboarding_status ?? derivedStatus;

		return {
			status,
			derived_status: derivedStatus,
			profile_complete: hasProfileSetup(user),
			business_complete: hasBusinessSetup(organization),
			is_complete: status === "complete",
		};
	},
});
