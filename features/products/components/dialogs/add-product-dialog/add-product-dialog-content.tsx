"use client";

import {
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

import type { AddProductDialogState } from "../../../hooks/use-add-product";
import { StandardItemStepTwoDialog } from "../../standard-item";

import { ProductChoiceStep } from "./product-choice-step";
import { RecipeBuilderStepTwoDialog } from "./recipe-builder-step-two-dialog";

type AddProductDialogContentProps = AddProductDialogState;

function getDialogTitle(stage: AddProductDialogState["stage"]) {
	if (stage === "choice") {
		return "What are you adding?";
	}

	if (stage === "standard-item-step-two") {
		return "Add Standard Item";
	}

	return "Recipe Builder";
}

function getDialogDescription(stage: AddProductDialogState["stage"]) {
	if (stage === "choice") {
		return "Choose how this product will interact with your inventory.";
	}

	if (stage === "recipe-builder-step-two") {
		return "Set up a composite product by defining its ingredients and materials.";
	}

	return "Add existing items from your inventory to your product catalog";
}

export function AddProductDialogContent({
	stage,
	mode,
	selectedRawMaterials,
	setMode,
	goToChoice,
	goToSelectedMode,
	addManyRawMaterials,
	removeRawMaterial,
	handleSave,
}: AddProductDialogContentProps) {
	return (
		<>
			<DialogHeader>
				<DialogTitle>{getDialogTitle(stage)}</DialogTitle>
				<DialogDescription>{getDialogDescription(stage)}</DialogDescription>
			</DialogHeader>

			{stage === "choice" ? (
				<ProductChoiceStep
					value={mode}
					onValueChange={setMode}
					onNext={goToSelectedMode}
				/>
			) : null}

			{stage === "standard-item-step-two" ? (
				<StandardItemStepTwoDialog onBack={goToChoice} onSave={handleSave} />
			) : null}

			{stage === "recipe-builder-step-two" ? (
				<RecipeBuilderStepTwoDialog
					onBack={goToChoice}
					onSave={handleSave}
					selectedRawMaterials={selectedRawMaterials}
					onAddRawMaterials={addManyRawMaterials}
					onRemoveRawMaterial={removeRawMaterial}
				/>
			) : null}
		</>
	);
}
