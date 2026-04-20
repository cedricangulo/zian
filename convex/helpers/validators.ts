import { v } from "convex/values";
import {
	BUSINESS_AGE_RANGE_VALUES,
	BUSINESS_SECTOR_VALUES,
	ONBOARDING_STATUS_VALUES,
	PROFILE_SEX_VALUES,
} from "../../features/onboarding/data/options";

export type OnboardingStatus = (typeof ONBOARDING_STATUS_VALUES)[number];

export const onboardingStatus = v.union(
	v.literal(ONBOARDING_STATUS_VALUES[0]),
	v.literal(ONBOARDING_STATUS_VALUES[1]),
	v.literal(ONBOARDING_STATUS_VALUES[2]),
);

export type ProfileSex = (typeof PROFILE_SEX_VALUES)[number];

export const profileSex = v.union(
	v.literal(PROFILE_SEX_VALUES[0]),
	v.literal(PROFILE_SEX_VALUES[1]),
	v.literal(PROFILE_SEX_VALUES[2]),
);

export type BusinessSector = (typeof BUSINESS_SECTOR_VALUES)[number];

export const businessSector = v.union(
	v.literal(BUSINESS_SECTOR_VALUES[0]),
	v.literal(BUSINESS_SECTOR_VALUES[1]),
	v.literal(BUSINESS_SECTOR_VALUES[2]),
	v.literal(BUSINESS_SECTOR_VALUES[3]),
	v.literal(BUSINESS_SECTOR_VALUES[4]),
	v.literal(BUSINESS_SECTOR_VALUES[5]),
	v.literal(BUSINESS_SECTOR_VALUES[6]),
	v.literal(BUSINESS_SECTOR_VALUES[7]),
	v.literal(BUSINESS_SECTOR_VALUES[8]),
	v.literal(BUSINESS_SECTOR_VALUES[9]),
	v.literal(BUSINESS_SECTOR_VALUES[10]),
	v.literal(BUSINESS_SECTOR_VALUES[11]),
	v.literal(BUSINESS_SECTOR_VALUES[12]),
	v.literal(BUSINESS_SECTOR_VALUES[13]),
	v.literal(BUSINESS_SECTOR_VALUES[14]),
	v.literal(BUSINESS_SECTOR_VALUES[15]),
	v.literal(BUSINESS_SECTOR_VALUES[16]),
	v.literal(BUSINESS_SECTOR_VALUES[17]),
	v.literal(BUSINESS_SECTOR_VALUES[18]),
	v.literal(BUSINESS_SECTOR_VALUES[19]),
	v.literal(BUSINESS_SECTOR_VALUES[20]),
	v.literal(BUSINESS_SECTOR_VALUES[21]),
	v.literal(BUSINESS_SECTOR_VALUES[22]),
	v.literal(BUSINESS_SECTOR_VALUES[23]),
	v.literal(BUSINESS_SECTOR_VALUES[24]),
	v.literal(BUSINESS_SECTOR_VALUES[25]),
	v.literal(BUSINESS_SECTOR_VALUES[26]),
);

export type BusinessAgeRange = (typeof BUSINESS_AGE_RANGE_VALUES)[number];

export const businessAgeRange = v.union(
	v.literal(BUSINESS_AGE_RANGE_VALUES[0]),
	v.literal(BUSINESS_AGE_RANGE_VALUES[1]),
	v.literal(BUSINESS_AGE_RANGE_VALUES[2]),
	v.literal(BUSINESS_AGE_RANGE_VALUES[3]),
);
