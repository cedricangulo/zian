"use client";

import {
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

import type { AddStockDialogState } from "../../hooks/use-add-stock";

import { ExistingStockForm } from "./existing-stock-form";
import { NewStockForm } from "./new-stock-form";
import { StockChoiceStep } from "./stock-choice-step";

type AddStockDialogContentProps = AddStockDialogState;

export function AddStockDialogContent({
	stage,
	mode,
	existingDraft,
	newDraft,
	setMode,
	setExistingDraft,
	setNewDraft,
	goToChoice,
	goToSelectedMode,
	handleSave,
}: AddStockDialogContentProps) {
	return (
		<>
			<DialogHeader>
				<DialogTitle>
					{stage === "choice"
						? "Add stock"
						: mode === "existing"
							? "Add existing stock"
							: "Add new stock"}
				</DialogTitle>
				<DialogDescription>
					{stage === "choice"
						? "Pick the flow you want to continue with."
						: "Keep this first version short. You can expand the form later."}
				</DialogDescription>
			</DialogHeader>

			{stage === "choice" ? (
				<StockChoiceStep
					value={mode}
					onValueChange={setMode}
					onNext={goToSelectedMode}
				/>
			) : mode === "existing" ? (
				<ExistingStockForm
					value={existingDraft}
					onBack={goToChoice}
					onChange={setExistingDraft}
					onSave={handleSave}
				/>
			) : (
				<NewStockForm
					value={newDraft}
					onBack={goToChoice}
					onChange={setNewDraft}
					onSave={handleSave}
				/>
			)}
		</>
	);
}
