"use client";

import { useState, useCallback } from "react";

import {
	initialExistingStockDraft,
	initialNewStockDraft,
	type ExistingStockDraft,
	type NewStockDraft,
	type StockAddMode,
} from "../types";

type AddStockDialogStage = "choice" | StockAddMode;

interface UseAddStockDialogStateParams {
	onSave: () => void;
}

function isExistingStockDraftDirty(draft: ExistingStockDraft) {
	return (
		draft.selectedItemId !== initialExistingStockDraft.selectedItemId ||
		draft.itemName !== initialExistingStockDraft.itemName ||
		draft.batchCode !== initialExistingStockDraft.batchCode ||
		draft.quantity !== initialExistingStockDraft.quantity ||
		draft.expiryDate !== initialExistingStockDraft.expiryDate ||
		draft.totalAssetValue !== initialExistingStockDraft.totalAssetValue
	);
}

function isNewStockDraftDirty(draft: NewStockDraft) {
	return (
		draft.itemImageName !== initialNewStockDraft.itemImageName ||
		draft.itemName !== initialNewStockDraft.itemName ||
		draft.category !== initialNewStockDraft.category ||
		draft.unit !== initialNewStockDraft.unit ||
		draft.supplier !== initialNewStockDraft.supplier ||
		draft.sku !== initialNewStockDraft.sku ||
		draft.batchCode !== initialNewStockDraft.batchCode ||
		draft.quantity !== initialNewStockDraft.quantity ||
		draft.hasExpiryDate !== initialNewStockDraft.hasExpiryDate ||
		draft.expiryDate !== initialNewStockDraft.expiryDate ||
		draft.totalAssetValue !== initialNewStockDraft.totalAssetValue
	);
}

export function useAddStockDialogState({
	onSave,
}: UseAddStockDialogStateParams) {
	const [stage, setStage] = useState<AddStockDialogStage>("choice");
	const [mode, setMode] = useState<StockAddMode>("existing");
	const [existingDraft, setExistingDraft] = useState<ExistingStockDraft>(
		initialExistingStockDraft,
	);
	const [newDraft, setNewDraft] = useState<NewStockDraft>(initialNewStockDraft);

	const goToChoice = useCallback(() => {
		setStage("choice");
	}, []);

	const goToSelectedMode = useCallback(() => {
		setStage(mode);
	}, [mode]);

	const resetDialogState = useCallback(() => {
		setStage("choice");
		setMode("existing");
		setExistingDraft(initialExistingStockDraft);
		setNewDraft(initialNewStockDraft);
	}, []);

	const handleSave = useCallback(() => {
		onSave();
	}, [onSave]);

	const hasUnsavedChanges =
		isExistingStockDraftDirty(existingDraft) || isNewStockDraftDirty(newDraft);

	return {
		stage,
		mode,
		existingDraft,
		newDraft,
		hasUnsavedChanges,
		setMode,
		setExistingDraft,
		setNewDraft,
		goToChoice,
		goToSelectedMode,
		resetDialogState,
		handleSave,
	};
}

export type AddStockDialogState = ReturnType<typeof useAddStockDialogState>;
