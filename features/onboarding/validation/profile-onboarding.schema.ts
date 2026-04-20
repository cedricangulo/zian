import { z } from "zod/v4";

import { PROFILE_SEX_VALUES } from "../data/options";

// Schema for validating profile onboarding form inputs
export const profileOnboardingSchema = z.object({
	first_name: z.string().trim().min(1, "First name is required."),
	middle_name: z.string().trim().optional(),
	last_name: z.string().trim().min(1, "Last name is required."),
	contact_number: z.string().trim().min(7, "Contact number is too short."),
	sex: z.enum(PROFILE_SEX_VALUES, {
		message: "Please select a sex.",
	}),
});

export type ProfileOnboardingInput = z.infer<typeof profileOnboardingSchema>;
