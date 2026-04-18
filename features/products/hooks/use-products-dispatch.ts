"use client";

import { parseAsString, useQueryState } from "nuqs";

import { useProductsListData } from "./use-products-list-data";

const DEFAULT_CATEGORY = "all";

export function useProductsDispatch() {
	const [search, setSearchQuery] = useQueryState(
		"search",
		parseAsString.withDefault("").withOptions({ history: "replace" }),
	);
	const [categoryQuery, setCategoryQuery] = useQueryState(
		"category",
		parseAsString
			.withDefault(DEFAULT_CATEGORY)
			.withOptions({ history: "replace" }),
	);

	const { products, totalCatalogProducts, categories, activeCategory, isLoading } =
		useProductsListData({
		searchTerm: search,
		requestedCategory: categoryQuery,
	});

	const category = activeCategory;
	const hasActiveFilters = search.trim().length > 0 || category !== DEFAULT_CATEGORY;

	const setSearch = (value: string) => {
		void setSearchQuery(value.trim() === "" ? null : value);
	};

	const setCategory = (value: string) => {
		const normalizedValue = categories.includes(value)
			? value
			: DEFAULT_CATEGORY;
		void setCategoryQuery(
			normalizedValue === DEFAULT_CATEGORY ? null : normalizedValue,
		);
	};

	return {
		search,
		setSearch,
		category,
		setCategory,
		categories,
		products,
		isLoading,
		totalProducts: products.length,
		hasCatalogProducts: totalCatalogProducts > 0,
		hasActiveFilters,
	};
}
