"use client";

import { useMutation } from "convex/react";

import { api } from "@/convex/_generated/api";

export function useOnboardingMutations() {
	const updateProfileSetup = useMutation(api.onboarding.updateProfileSetup);
	const updateBusinessDetails = useMutation(
		api.onboarding.updateBusinessDetails,
	);
	const generateBusinessLogoUploadUrl = useMutation(
		api.onboarding.generateBusinessLogoUploadUrl,
	);
	const relinkPersonalOrgToClerkOrg = useMutation(
		api.onboarding.relinkPersonalOrgToClerkOrg,
	);

	return {
		updateProfileSetup,
		updateBusinessDetails,
		generateBusinessLogoUploadUrl,
		relinkPersonalOrgToClerkOrg,
	};
}
