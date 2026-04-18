"use client";

import { useState } from "react";
import { useMutation } from "convex/react";

import { api } from "@/convex/_generated/api";
import { DashboardShell } from "@/features/dashboard";

import { DispatchSlipSheet } from "./dispatch-slip-sheet";
import { AddProductDialogButton } from "./dialogs/add-product-dialog";
import { ProductsDispatch } from "./product-dispatch";
import { useDispatchDraftState, useProductsDispatch } from "../hooks";

export function ProductsDispatchWorkspace() {
	const {
		search,
		setSearch,
		category,
		setCategory,
		categories,
		products,
		totalProducts,
		hasCatalogProducts,
		hasActiveFilters,
		isLoading,
	} = useProductsDispatch();

	const {
		items,
		groupedItems,
		totalQuantity,
		increment,
		decrement,
		removeItem,
		clearAll,
		getQuantityByProductId,
	} = useDispatchDraftState();

	const createDispatch = useMutation(api.dispatch.createDispatch);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [lastTransactionId, setLastTransactionId] = useState<string | null>(null);

	const handleSubmitDispatch = async () => {
		if (items.length === 0 || isSubmitting) {
			return;
		}

		setSubmitError(null);
		setIsSubmitting(true);

		try {
			const result = await createDispatch({
				items: items.map((item) => ({
					product_id: item.id,
					quantity: item.quantity,
				})),
				event_reason: "sale",
			});

			setLastTransactionId(result.transaction_id);
			clearAll();
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Failed to submit dispatch. Please try again.";
			setSubmitError(message);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<DashboardShell
			title={<h2 className="type-lg">Dispatch Products</h2>}
			action={
				<>
					<DispatchSlipSheet
						groups={groupedItems}
						totalQuantity={totalQuantity}
						onRemoveItem={removeItem}
						onClearAll={clearAll}
						onSubmitDispatch={handleSubmitDispatch}
						isSubmitting={isSubmitting}
						lastTransactionId={lastTransactionId}
						submitError={submitError}
					/>
					<AddProductDialogButton />
				</>
			}
		>
			<ProductsDispatch
				search={search}
				onSearchChange={setSearch}
				category={category}
				onCategoryChange={setCategory}
				categories={categories}
				products={products}
				totalProducts={totalProducts}
				hasCatalogProducts={hasCatalogProducts}
				hasActiveFilters={hasActiveFilters}
				isLoading={isLoading}
				getQuantityByProductId={getQuantityByProductId}
				onIncrement={increment}
				onDecrement={decrement}
			/>
		</DashboardShell>
	);
}