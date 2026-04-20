"use client";

import { useMemo } from "react";

import {
	Combobox,
	ComboboxCollection,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxGroup,
	ComboboxInput,
	ComboboxItem,
	ComboboxLabel,
	ComboboxList,
	ComboboxSeparator,
} from "@/components/ui/combobox";

import { BUSINESS_SECTOR_OPTIONS, type BusinessSectorValue } from "../data/options";

const SECTOR_LABEL_OVERRIDES: Partial<Record<BusinessSectorValue, string>> = {
	food_and_beverages: "Food & Beverages",
	micro_retail: "Micro retail",
	health_and_personal_care: "Health & personal care",
	small_scale_production: "Small-scale production",
	raw_ingredients_and_produce: "Raw ingredients & produce",
	dairy_and_refrigerated_goods: "Dairy & refrigerated goods",
	syrups_and_flavorings: "Syrups & flavorings",
	dry_goods_and_baking_supplies: "Dry goods & baking supplies",
	consumables_and_packaging: "Consumables & packaging",
	food_snacks_and_beverages: "Food, snacks & beverages",
	personal_care_and_toiletries: "Personal care & toiletries",
	household_and_cleaning_supplies: "Household & cleaning supplies",
	auto_and_hardware_parts: "Auto & hardware parts",
	office_and_school_supplies: "Office & school supplies",
	clothing_and_accessories: "Clothing & accessories",
	pet_and_agrivet_needs: "Pet & agrivet needs",
	medicines_and_pharmaceuticals: "Medicines & pharmaceuticals",
	vitamins_and_health_supplements: "Vitamins & health supplements",
	first_aid_and_wound_care: "First aid & wound care",
	hair_skin_and_spa_chemicals: "Hair, skin & spa chemicals",
	daily_personal_care: "Daily personal care",
	clinic_salon_consumables: "Clinic/salon consumables",
	raw_materials_and_base_items: "Raw materials & base items",
	hardware_tools_and_spare_parts: "Hardware, tools & spare parts",
	fluids_inks_and_chemicals: "Fluids, inks & chemicals",
	production_consumables: "Production consumables",
	packaging_and_containers: "Packaging & containers",
};

const BUSINESS_SECTOR_GROUPS = [
	{
		value: "Food & Beverages",
		items: [
			"raw_ingredients_and_produce",
			"dairy_and_refrigerated_goods",
			"syrups_and_flavorings",
			"dry_goods_and_baking_supplies",
			"consumables_and_packaging",
		],
	},
	{
		value: "Micro retail",
		items: [
			"food_snacks_and_beverages",
			"personal_care_and_toiletries",
			"household_and_cleaning_supplies",
			"auto_and_hardware_parts",
			"office_and_school_supplies",
			"clothing_and_accessories",
			"pet_and_agrivet_needs",
		],
	},
	{
		value: "Health & personal care",
		items: [
			"medicines_and_pharmaceuticals",
			"vitamins_and_health_supplements",
			"first_aid_and_wound_care",
			"hair_skin_and_spa_chemicals",
			"daily_personal_care",
			"clinic_salon_consumables",
		],
	},
	{
		value: "Small-scale production",
		items: [
			"raw_materials_and_base_items",
			"hardware_tools_and_spare_parts",
			"fluids_inks_and_chemicals",
			"production_consumables",
			"packaging_and_containers",
		],
	},
] as const satisfies ReadonlyArray<{
	value: string;
	items: ReadonlyArray<BusinessSectorValue>;
}>;

interface BusinessSectorComboboxProps {
	id: string;
	value?: BusinessSectorValue;
	onValueChange: (nextValue: BusinessSectorValue | undefined) => void;
	disabled?: boolean;
	invalid?: boolean;
}

export function BusinessSectorCombobox({
	id,
	value,
	onValueChange,
	disabled,
	invalid,
}: BusinessSectorComboboxProps) {
	const portalContainer =
		typeof document === "undefined" ? undefined : document.body;

	const maps = useMemo(() => {
		const labelByValue = new Map<BusinessSectorValue, string>();
		const valueByLabel = new Map<string, BusinessSectorValue>();
		for (const option of BUSINESS_SECTOR_OPTIONS) {
			const label = SECTOR_LABEL_OVERRIDES[option.value] ?? option.label;
			labelByValue.set(option.value, label);
			valueByLabel.set(label, option.value);
		}
		return { labelByValue, valueByLabel };
	}, []);

	const groupedSectorLabels = useMemo(
		() =>
			BUSINESS_SECTOR_GROUPS.map((group) => ({
				value: group.value,
				items: group.items.map(
					(itemValue) => maps.labelByValue.get(itemValue) ?? itemValue,
				),
			})),
		[maps.labelByValue],
	);

	const selectedLabel = value ? (maps.labelByValue.get(value) ?? null) : null;

	return (
		<Combobox
			items={groupedSectorLabels}
			value={selectedLabel}
			onValueChange={(nextLabel) => {
				if (!nextLabel) {
					onValueChange(undefined);
					return;
				}
				onValueChange(maps.valueByLabel.get(nextLabel));
			}}
		>
			<ComboboxInput
				id={id}
				disabled={disabled}
				aria-invalid={invalid}
				placeholder="Choose your business sector"
			/>
			<ComboboxContent
				portalContainer={portalContainer}
				align="start"
				className="w-(--radix-popover-trigger-width)"
			>
				<ComboboxEmpty>No sector found.</ComboboxEmpty>
				<ComboboxList>
					{(group, index) => (
						<ComboboxGroup key={group.value} items={group.items}>
							<ComboboxLabel>{group.value}</ComboboxLabel>
							<ComboboxCollection>
								{(itemLabel) => (
									<ComboboxItem
										key={`${group.value}:${itemLabel}`}
										value={itemLabel}
									>
										{itemLabel}
									</ComboboxItem>
								)}
							</ComboboxCollection>
							{index < groupedSectorLabels.length - 1 ? (
								<ComboboxSeparator />
							) : null}
						</ComboboxGroup>
					)}
				</ComboboxList>
			</ComboboxContent>
		</Combobox>
	);
}
