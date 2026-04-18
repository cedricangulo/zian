"use client";

import { useMemo, useState } from "react";

import type { ProductCardItem } from "../types";

type DispatchDraftByProductId = Record<string, ProductCardItem & { quantity: number }>;

export function useDispatchDraftState() {
	const [draftByProductId, setDraftByProductId] =
		useState<DispatchDraftByProductId>({});

	const increment = (product: ProductCardItem) => {
		setDraftByProductId((currentDraft) => {
			const currentItem = currentDraft[product.id];
			const nextQuantity = (currentItem?.quantity ?? 0) + 1;

			return {
				...currentDraft,
				[product.id]: {
					...product,
					quantity: nextQuantity,
				},
			};
		});
	};

	const decrement = (product: ProductCardItem) => {
		setDraftByProductId((currentDraft) => {
			const currentItem = currentDraft[product.id];
			if (!currentItem) {
				return currentDraft;
			}

			const nextQuantity = currentItem.quantity - 1;
			if (nextQuantity <= 0) {
				const nextDraft = { ...currentDraft };
				delete nextDraft[product.id];
				return nextDraft;
			}

			return {
				...currentDraft,
				[product.id]: {
					...currentItem,
					quantity: nextQuantity,
				},
			};
		});
	};

	const removeItem = (productId: ProductCardItem["id"]) => {
		setDraftByProductId((currentDraft) => {
			if (!currentDraft[productId]) {
				return currentDraft;
			}

			const nextDraft = { ...currentDraft };
			delete nextDraft[productId];
			return nextDraft;
		});
	};

	const clearAll = () => {
		setDraftByProductId({});
	};

	const items = useMemo(
		() => Object.values(draftByProductId),
		[draftByProductId],
	);

	const totalQuantity = useMemo(
		() => items.reduce((total, item) => total + item.quantity, 0),
		[items],
	);

	const groupedItems = useMemo(() => {
		const groupedByCategory = new Map<string, typeof items>();

		for (const item of items) {
			const currentCategoryItems = groupedByCategory.get(item.category) ?? [];
			groupedByCategory.set(item.category, [...currentCategoryItems, item]);
		}

		return Array.from(groupedByCategory.entries())
			.sort(([leftCategory], [rightCategory]) =>
				leftCategory.localeCompare(rightCategory),
			)
			.map(([category, categoryItems]) => ({
				category,
				items: categoryItems.sort((leftItem, rightItem) =>
					leftItem.name.localeCompare(rightItem.name),
				),
			}));
	}, [items]);

	const getQuantityByProductId = (productId: ProductCardItem["id"]) =>
		draftByProductId[productId]?.quantity ?? 0;

	return {
		items,
		groupedItems,
		totalQuantity,
		increment,
		decrement,
		removeItem,
		clearAll,
		getQuantityByProductId,
	};
}