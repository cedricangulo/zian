import { z } from "zod/v4";

import {
	BUSINESS_AGE_RANGE_VALUES,
	BUSINESS_SECTOR_VALUES,
} from "../data/options";

// Custom schema for validating file uploads
const fileListSchema = z.custom<FileList | undefined>(
	(value) => value === undefined || value instanceof FileList,
	"Invalid file upload value.",
);

// Schema for validating business onboarding form inputs
export const businessOnboardingSchema = z.object({
	business_name: z.string().trim().min(1, "Business name is required."),
	business_sector: z.enum(BUSINESS_SECTOR_VALUES, {
		message: "Please select a business sector.",
	}),
	business_type: z.string().trim().min(1, "Business type is required."),
	business_age_range: z.enum(BUSINESS_AGE_RANGE_VALUES, {
		message: "Please select a business age range.",
	}),
	business_address: z.string().trim().min(1, "Business address is required."),
	business_logo_file_id: z.string().trim().optional(),
	logo_file: fileListSchema.optional(),
});

export type BusinessOnboardingInput = z.infer<typeof businessOnboardingSchema>;
