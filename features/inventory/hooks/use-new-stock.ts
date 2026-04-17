"use client";

import { useEffect, useMemo } from "react";
import { type Control, useWatch } from "react-hook-form";

import type { NewStockDraft } from "../types";

const DEFAULT_CATEGORY_OPTIONS = [
	"Beans",
	"Milk",
	"Packaging",
	"Syrups",
	"Ingredients",
];

const DEFAULT_UNIT_OPTIONS = ["pcs", "kg", "g", "L", "mL", "pack"];

const DEFAULT_SUPPLIER_OPTIONS = [
	"Bean Source Trading",
	"Daily Dairy Supply",
	"Packline Distributors",
	"Northside Ingredients",
];

export function normalizeNewStockDraft(
	input: Partial<NewStockDraft> | undefined,
): NewStockDraft {
	return {
		itemImageName: input?.itemImageName ?? "",
		itemName: input?.itemName ?? "",
		category: input?.category ?? "",
		unit: input?.unit ?? "",
		supplier: input?.supplier ?? "",
		sku: input?.sku ?? "",
		batchCode: input?.batchCode ?? "",
		quantity: input?.quantity ?? "",
		hasExpiryDate: input?.hasExpiryDate ?? false,
		expiryDate: input?.expiryDate ?? "",
		totalAssetValue: input?.totalAssetValue ?? "",
	};
}

interface UseNewStockFormStateParams {
	control: Control<NewStockDraft>;
	onChange: (nextValue: NewStockDraft) => void;
}

export function useNewStockFormState({
	control,
	onChange,
}: UseNewStockFormStateParams) {
	const itemImageName = useWatch({ control, name: "itemImageName" });
	const itemName = useWatch({ control, name: "itemName" });
	const category = useWatch({ control, name: "category" });
	const unit = useWatch({ control, name: "unit" });
	const supplier = useWatch({ control, name: "supplier" });
	const sku = useWatch({ control, name: "sku" });
	const batchCode = useWatch({ control, name: "batchCode" });
	const quantity = useWatch({ control, name: "quantity" });
	const hasExpiryDate = useWatch({ control, name: "hasExpiryDate" });
	const expiryDate = useWatch({ control, name: "expiryDate" });
	const totalAssetValue = useWatch({ control, name: "totalAssetValue" });

	const categoryOptions = useMemo(() => {
		return DEFAULT_CATEGORY_OPTIONS;
	}, []);

	const unitOptions = useMemo(() => {
		return DEFAULT_UNIT_OPTIONS;
	}, []);

	const supplierOptions = useMemo(() => {
		return DEFAULT_SUPPLIER_OPTIONS;
	}, []);

	useEffect(() => {
		onChange(
			normalizeNewStockDraft({
				itemImageName,
				itemName,
				category,
				unit,
				supplier,
				sku,
				batchCode,
				quantity,
				hasExpiryDate,
				expiryDate,
				totalAssetValue,
			}),
		);
	}, [
		itemImageName,
		itemName,
		category,
		unit,
		supplier,
		sku,
		batchCode,
		quantity,
		hasExpiryDate,
		expiryDate,
		totalAssetValue,
		onChange,
	]);

	return {
		categoryOptions,
		unitOptions,
		supplierOptions,
		hasExpiryDate,
		itemImageName,
		selectedUnit: unit,
	};
}