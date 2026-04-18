"use client";

import { useCallback, useState, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";

import type {
	ProductRawMaterialOption,
	SelectedProductRawMaterial,
} from "./use-add-product";

export interface RecipeBuilderFormValues {
	productName: string;
	category: string;
	skuCode: string;
	productImageName: string;
}

interface UseRecipeBuilderFormStateParams {
	onAddRawMaterials: (materials: ProductRawMaterialOption[]) => void;
	onSave: () => void;
	selectedRawMaterials: SelectedProductRawMaterial[];
}

export function useRecipeBuilderFormState({
	onAddRawMaterials,
	onSave,
	selectedRawMaterials,
}: UseRecipeBuilderFormStateParams) {
	const [rawMaterialDialogOpen, setRawMaterialDialogOpen] = useState(false);
	const [ingredientsError, setIngredientsError] = useState<string | null>(null);
	const {
		control,
		formState: { errors },
		handleSubmit,
		register,
		setValue,
		watch,
	} = useForm<RecipeBuilderFormValues>({
		defaultValues: {
			productName: "",
			category: "",
			skuCode: "",
			productImageName: "",
		},
	});
	const productImageName = watch("productImageName");

	const handleSelectRawMaterials = useCallback(
		(materials: ProductRawMaterialOption[]) => {
			onAddRawMaterials(materials);
			setIngredientsError(null);
			setRawMaterialDialogOpen(false);
		},
		[onAddRawMaterials],
	);

	const handleProductImageChange = useCallback(
		(event: ChangeEvent<HTMLInputElement>) => {
			setValue("productImageName", event.currentTarget.files?.[0]?.name ?? "", {
				shouldDirty: true,
				shouldValidate: true,
			});
		},
		[setValue],
	);

	const submit = handleSubmit(() => {
		if (selectedRawMaterials.length === 0) {
			setIngredientsError("Add at least one ingredient before saving.");
			return;
		}

		onSave();
	});

	return {
		control,
		errors,
		handleProductImageChange,
		handleSelectRawMaterials,
		ingredientsError,
		productImageName,
		rawMaterialDialogOpen,
		register,
		setRawMaterialDialogOpen,
		submit,
	};
}
