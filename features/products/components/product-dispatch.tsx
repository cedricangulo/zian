"use client";

import { ProductsCardGrid } from "./product-card";
import { ProductsSearchSection } from "./search-product";
import type { ProductCardItem } from "../types";

type Props = {
	search: string;
	onSearchChange: (value: string) => void;
	category: string;
	onCategoryChange: (value: string) => void;
	categories: string[];
	products: ProductCardItem[];
	totalProducts: number;
	hasCatalogProducts: boolean;
	hasActiveFilters: boolean;
	isLoading: boolean;
	getQuantityByProductId: (productId: ProductCardItem["id"]) => number;
	onIncrement: (product: ProductCardItem) => void;
	onDecrement: (product: ProductCardItem) => void;
};

export function ProductsDispatch({
	search,
	onSearchChange,
	category,
	onCategoryChange,
	categories,
	products,
	totalProducts,
	hasCatalogProducts,
	hasActiveFilters,
	isLoading,
	getQuantityByProductId,
	onIncrement,
	onDecrement,
}: Props) {
	return (
		<section className="space-y-4">
			<ProductsSearchSection
				search={search}
				onSearchChange={onSearchChange}
				category={category}
				categories={categories}
				onCategoryChange={onCategoryChange}
			/>
			<p className="type-sm text-muted-foreground">{totalProducts} Total</p>
			<ProductsCardGrid
				products={products}
				hasCatalogProducts={hasCatalogProducts}
				hasActiveFilters={hasActiveFilters}
				isLoading={isLoading}
				getQuantityByProductId={getQuantityByProductId}
				onIncrement={onIncrement}
				onDecrement={onDecrement}
			/>
		</section>
	);
}
