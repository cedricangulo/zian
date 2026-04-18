"use client";

import { useState } from "react";

interface RawMaterialSelectable {
	id: string;
}

interface UseRawMaterialsSelectionParams<TOption extends RawMaterialSelectable> {
	options: TOption[];
	onConfirm: (materials: TOption[]) => void;
	onOpenChange: (nextOpen: boolean) => void;
}

export function useRawMaterialsSelection<TOption extends RawMaterialSelectable>({
	options,
	onConfirm,
	onOpenChange,
}: UseRawMaterialsSelectionParams<TOption>) {
	const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);

	const toggleSelection = (materialId: string, checked: boolean) => {
		setSelectedMaterialIds((currentIds) => {
			if (checked) {
				if (currentIds.includes(materialId)) {
					return currentIds;
				}

				return [...currentIds, materialId];
			}

			return currentIds.filter((id) => id !== materialId);
		});
	};

	const handleConfirm = () => {
		const selectedMaterials = options.filter((material) =>
			selectedMaterialIds.includes(material.id),
		);

		onConfirm(selectedMaterials);
		setSelectedMaterialIds([]);
	};

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) {
			setSelectedMaterialIds([]);
		}

		onOpenChange(nextOpen);
	};

	const handleCancel = () => {
		setSelectedMaterialIds([]);
		onOpenChange(false);
	};

	return {
		handleCancel,
		handleConfirm,
		handleOpenChange,
		selectedMaterialIds,
		toggleSelection,
	};
}
