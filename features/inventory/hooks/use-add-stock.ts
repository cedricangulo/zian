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

	return {
		stage,
		mode,
		existingDraft,
		newDraft,
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
