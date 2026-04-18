"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";

import {
	standardCatalogItems,
	type StandardCatalogItem,
} from "../data/mock-data";

export interface StandardItemFormValues {
	search: string;
	category: string;
	queuedItemIds: string[];
}

interface UseStandardItemFormStateParams {
	onSave: () => void;
}

export function useStandardItemFormState({
	onSave,
}: UseStandardItemFormStateParams) {
	const {
		control,
		formState: { errors },
		handleSubmit,
		register,
		watch,
	} = useForm<StandardItemFormValues>({
		defaultValues: {
			search: "",
			category: "all",
			queuedItemIds: [],
		},
	});

	const searchInput = watch("search");
	const categoryInput = watch("category");

	const filteredItems = useMemo(() => {
		const normalizedSearch = searchInput.trim().toLowerCase();
		const normalizedCategory = categoryInput.toLowerCase();

		return standardCatalogItems.filter((item) => {
			const matchesCategory =
				normalizedCategory === "all" ||
				item.category.toLowerCase() === normalizedCategory;
			const matchesSearch =
				normalizedSearch.length === 0 ||
				item.name.toLowerCase().includes(normalizedSearch) ||
				item.category.toLowerCase().includes(normalizedSearch);

			return matchesCategory && matchesSearch;
		});
	}, [categoryInput, searchInput]);

	const submit = handleSubmit(() => {
		onSave();
	});

	return {
		control,
		errors,
		filteredItems,
		register,
		submit,
	};
}

export function getQueuedCatalogItems(queuedItemIds: string[]) {
	const queuedItemSet = new Set(queuedItemIds);

	return standardCatalogItems.filter((item) => queuedItemSet.has(item.id));
}

export function toggleQueuedCatalogItem(
	queuedItemIds: string[],
	itemId: string,
	checked: boolean,
) {
	if (checked) {
		if (queuedItemIds.includes(itemId)) {
			return queuedItemIds;
		}

		return [...queuedItemIds, itemId];
	}

	return queuedItemIds.filter((queuedId) => queuedId !== itemId);
}

export function removeQueuedCatalogItem(
	queuedItemIds: string[],
	itemId: string,
) {
	return queuedItemIds.filter((queuedId) => queuedId !== itemId);
}

export type QueuedCatalogItem = StandardCatalogItem;
