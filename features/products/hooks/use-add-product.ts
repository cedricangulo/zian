"use client";

import { useCallback, useState } from "react";

export type ProductAddMode = "standard-item" | "recipe-builder";

export interface ProductRawMaterialOption {
	id: string;
	name: string;
	unit: string;
}

export interface SelectedProductRawMaterial extends ProductRawMaterialOption {
	quantity: number;
}

type AddProductDialogStage =
	| "choice"
	| "standard-item-step-two"
	| "recipe-builder-step-two";

interface UseAddProductDialogStateParams {
	onSave: () => void;
}

function getStepTwoStage(mode: ProductAddMode): AddProductDialogStage {
	return mode === "standard-item"
		? "standard-item-step-two"
		: "recipe-builder-step-two";
}

export function useAddProductDialogState({
	onSave,
}: UseAddProductDialogStateParams) {
	const [stage, setStage] = useState<AddProductDialogStage>("choice");
	const [mode, setMode] = useState<ProductAddMode>("standard-item");
	const [selectedRawMaterials, setSelectedRawMaterials] = useState<
		SelectedProductRawMaterial[]
	>([]);

	const goToChoice = useCallback(() => {
		setStage("choice");
	}, []);

	const goToSelectedMode = useCallback(() => {
		setStage(getStepTwoStage(mode));
	}, [mode]);

	const goToStepTwo = useCallback(() => {
		setStage(getStepTwoStage(mode));
	}, [mode]);

	const addManyRawMaterials = useCallback(
		(materials: ProductRawMaterialOption[]) => {
			if (materials.length === 0) {
				return;
			}

			setSelectedRawMaterials((currentMaterials) => {
				const materialById = new Map(
					currentMaterials.map((material) => [material.id, material]),
				);

				for (const material of materials) {
					if (!materialById.has(material.id)) {
						materialById.set(material.id, {
							...material,
							quantity: 1,
						});
					}
				}

				return Array.from(materialById.values());
			});
		},
		[],
	);

	const removeRawMaterial = useCallback((materialId: string) => {
		setSelectedRawMaterials((currentMaterials) =>
			currentMaterials.filter((material) => material.id !== materialId),
		);
	}, []);

	const clearRawMaterials = useCallback(() => {
		setSelectedRawMaterials([]);
	}, []);

	const resetDialogState = useCallback(() => {
		setStage("choice");
		setMode("standard-item");
		clearRawMaterials();
	}, [clearRawMaterials]);

	const handleSave = useCallback(() => {
		onSave();
	}, [onSave]);

	return {
		stage,
		mode,
		selectedRawMaterials,
		setMode,
		goToChoice,
		goToSelectedMode,
		goToStepTwo,
		addManyRawMaterials,
		removeRawMaterial,
		clearRawMaterials,
		resetDialogState,
		handleSave,
	};
}

export type AddProductDialogState = ReturnType<typeof useAddProductDialogState>;