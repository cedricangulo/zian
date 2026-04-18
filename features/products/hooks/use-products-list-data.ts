"use client";

import { useMemo } from "react";
import { useQuery } from "convex/react";

import { api } from "@/convex/_generated/api";

import type { ProductCardItem } from "../types";

type ProductsListFilters = {
	searchTerm: string;
	requestedCategory: string;
};

export function useProductsListData({
	searchTerm,
	requestedCategory,
}: ProductsListFilters) {
	const catalogProductsQuery = useQuery(api.catalog.listProducts, {});

	return useMemo(() => {
		const mappedProducts: ProductCardItem[] = (catalogProductsQuery ?? [])
			.filter((product) => !product.archived_at)
			.map((product) => ({
				id: product._id,
				name: product.name,
				category: product.product_type,
				availability: "available",
				imageSrc: "/image-placeholder.png",
				baseUnit: product.base_unit,
			}));

		const dynamicCategories = Array.from(
			new Set(mappedProducts.map((product) => product.category)),
		).sort((left, right) => left.localeCompare(right));

		const categories = ["all", ...dynamicCategories];
		const activeCategory = categories.includes(requestedCategory)
			? requestedCategory
			: "all";

		const normalizedSearch = searchTerm.trim().toLowerCase();
		const filteredProducts = mappedProducts.filter((product) => {
			const matchesCategory =
				activeCategory === "all" || product.category === activeCategory;
			const matchesSearch =
				normalizedSearch.length === 0 ||
				product.name.toLowerCase().includes(normalizedSearch);

			return matchesCategory && matchesSearch;
		});

		return {
			categories,
			activeCategory,
			isLoading: catalogProductsQuery === undefined,
			products: filteredProducts,
			totalCatalogProducts: mappedProducts.length,
		};
	}, [catalogProductsQuery, requestedCategory, searchTerm]);
}
