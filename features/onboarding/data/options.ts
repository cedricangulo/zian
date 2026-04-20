export const ONBOARDING_STATUS_VALUES = [
	"profile_pending",
	"business_pending",
	"complete",
] as const;

export type OnboardingStatusValue = (typeof ONBOARDING_STATUS_VALUES)[number];

export const PROFILE_SEX_VALUES = [
	"male",
	"female",
	"prefer_not_to_say",
] as const;

export type ProfileSexValue = (typeof PROFILE_SEX_VALUES)[number];

export const BUSINESS_SECTOR_VALUES = [
	"food_and_beverages",
	"micro_retail",
	"health_and_personal_care",
	"small_scale_production",
	"raw_ingredients_and_produce",
	"dairy_and_refrigerated_goods",
	"syrups_and_flavorings",
	"dry_goods_and_baking_supplies",
	"consumables_and_packaging",
	"food_snacks_and_beverages",
	"personal_care_and_toiletries",
	"household_and_cleaning_supplies",
	"auto_and_hardware_parts",
	"office_and_school_supplies",
	"clothing_and_accessories",
	"pet_and_agrivet_needs",
	"medicines_and_pharmaceuticals",
	"vitamins_and_health_supplements",
	"first_aid_and_wound_care",
	"hair_skin_and_spa_chemicals",
	"daily_personal_care",
	"clinic_salon_consumables",
	"raw_materials_and_base_items",
	"hardware_tools_and_spare_parts",
	"fluids_inks_and_chemicals",
	"production_consumables",
	"packaging_and_containers",
] as const;

export type BusinessSectorValue = (typeof BUSINESS_SECTOR_VALUES)[number];

export const BUSINESS_AGE_RANGE_VALUES = [
	"0_1_year",
	"1_3_years",
	"3_5_years",
	"5_plus_years",
] as const;

export type BusinessAgeRangeValue = (typeof BUSINESS_AGE_RANGE_VALUES)[number];

/**
 * Utility function to convert enum-like string values into human-readable labels.
 * For example, "food_and_beverages" becomes "Food And Beverages".
 */
function formatEnumLabel(value: string) {
	return value
		.split("_")																											// Split the string into segments based on underscores
		.filter(Boolean)																								// Remove empty segments caused by consecutive underscores
		.map((segment) => segment[0]?.toUpperCase() + segment.slice(1)) // Capitalize first letter of each segment
		.join(" ");																											// Join the segments back into a single string with spaces
}

export const PROFILE_SEX_OPTIONS = PROFILE_SEX_VALUES.map((value) => ({
	value,
	label: formatEnumLabel(value),
}));

export const BUSINESS_AGE_RANGE_OPTIONS = BUSINESS_AGE_RANGE_VALUES.map(
	(value) => ({
		value,
		label: formatEnumLabel(value),
	}),
);

export const BUSINESS_SECTOR_OPTIONS = BUSINESS_SECTOR_VALUES.map((value) => ({
	value,
	label: formatEnumLabel(value),
}));
