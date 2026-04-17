"use client";

import { useEffect, useMemo } from "react";
import { type Control, useWatch } from "react-hook-form";

import type { ExistingStockDraft, ExistingStockItem } from "../types";

export function normalizeExistingStockDraft(
	input: Partial<ExistingStockDraft> | undefined,
): ExistingStockDraft {
	return {
		selectedItemId: input?.selectedItemId ?? "",
		itemName: input?.itemName ?? "",
		search: input?.search ?? "",
		category: input?.category ?? "all",
		batchCode: input?.batchCode ?? "",
		quantity: input?.quantity ?? "",
		expiryDate: input?.expiryDate ?? "",
		totalAssetValue: input?.totalAssetValue ?? "",
	};
}

interface UseExistingStockFormStateParams {
	control: Control<ExistingStockDraft>;
	onChange: (nextValue: ExistingStockDraft) => void;
	items: ExistingStockItem[];
}

export function useExistingStockFormState({
	control,
	onChange,
	items,
}: UseExistingStockFormStateParams) {
	const itemName = useWatch({ control, name: "itemName" });
	const search = useWatch({ control, name: "search" });
	const selectedCategory = useWatch({ control, name: "category" });
	const selectedItemId = useWatch({ control, name: "selectedItemId" });
	const batchCode = useWatch({ control, name: "batchCode" });
	const quantity = useWatch({ control, name: "quantity" });
	const expiryDate = useWatch({ control, name: "expiryDate" });
	const totalAssetValue = useWatch({ control, name: "totalAssetValue" });

	const categoryOptions = useMemo(() => {
		return ["all", ...new Set(items.map((item) => item.category))];
	}, [items]);

	const filteredItems = useMemo(() => {
		const normalizedSearch = (search ?? "").trim().toLowerCase();

		return items.filter((item) => {
			const matchesCategory =
				!selectedCategory ||
				selectedCategory === "all" ||
				item.category === selectedCategory;

			const matchesSearch =
				normalizedSearch.length === 0 ||
				item.name.toLowerCase().includes(normalizedSearch) ||
				item.category.toLowerCase().includes(normalizedSearch);

			return matchesCategory && matchesSearch;
		});
	}, [items, search, selectedCategory]);

	const selectedItemName = useMemo(() => {
		const selectedItem = items.find((item) => item.id === selectedItemId);
		return selectedItem?.name ?? "";
	}, [items, selectedItemId]);

	useEffect(() => {
		onChange(
			normalizeExistingStockDraft({
				itemName,
				search,
				category: selectedCategory,
				selectedItemId,
				batchCode,
				quantity,
				expiryDate,
				totalAssetValue,
			}),
		);
	}, [
		itemName,
		search,
		selectedCategory,
		selectedItemId,
		batchCode,
		quantity,
		expiryDate,
		totalAssetValue,
		onChange,
	]);

	return {
		categoryOptions,
		filteredItems,
		selectedItemId,
		selectedItemName,
	};
}