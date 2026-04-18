"use client";

import { Controller } from "react-hook-form";

import { Info, Plus, X } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

import { recipeBuilderCategoryOptions } from "../../../data/mock-data";
import { getInitials } from "../../../helpers";
import { useRecipeBuilderFormState } from "../../../hooks";
import type {
	ProductRawMaterialOption,
	SelectedProductRawMaterial,
} from "../../../hooks/use-add-product";
import { RawMaterialsSelectDialog } from "../../raw-materials";

import { ProductOptionCombobox } from "./product-option-combobox";

interface RecipeBuilderStepTwoDialogProps {
	onBack: () => void;
	onSave: () => void;
	selectedRawMaterials: SelectedProductRawMaterial[];
	onAddRawMaterials: (materials: ProductRawMaterialOption[]) => void;
	onRemoveRawMaterial: (materialId: string) => void;
}

export function RecipeBuilderStepTwoDialog({
	onBack,
	onSave,
	selectedRawMaterials,
	onAddRawMaterials,
	onRemoveRawMaterial,
}: RecipeBuilderStepTwoDialogProps) {
	const {
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
	} = useRecipeBuilderFormState({
		onAddRawMaterials,
		onSave,
		selectedRawMaterials,
	});

	return (
		<form className="flex w-full flex-col gap-6" onSubmit={submit}>
			<input
				type="hidden"
				{...register("productImageName", {
					required: "Product image is required.",
				})}
			/>

			<div className="grid w-full gap-6 lg:grid-cols-2">
				<FieldSet>
					<FieldGroup className="gap-4">
						<Field data-invalid={Boolean(errors.productName) || undefined}>
							<FieldLabel htmlFor="recipe-product-name">Product name</FieldLabel>
							<Input
								id="recipe-product-name"
								placeholder="House Milk Tea"
								aria-invalid={Boolean(errors.productName) || undefined}
								{...register("productName", {
									required: "Product name is required.",
								})}
							/>
							<FieldError
								errors={errors.productName ? [errors.productName] : undefined}
							/>
						</Field>

						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<Field data-invalid={Boolean(errors.category) || undefined}>
								<FieldLabel htmlFor="recipe-product-category">Category</FieldLabel>
								<Controller
									control={control}
									name="category"
									rules={{ required: "Category is required." }}
									render={({ field }) => (
										<ProductOptionCombobox
											ariaInvalid={Boolean(errors.category) || undefined}
											id="recipe-product-category"
											onValueChange={field.onChange}
											options={recipeBuilderCategoryOptions}
											placeholder="Select category"
											value={field.value}
										/>
									)}
								/>
								<FieldError
									errors={errors.category ? [errors.category] : undefined}
								/>
							</Field>

							<Field data-invalid={Boolean(errors.skuCode) || undefined}>
								<FieldLabel htmlFor="recipe-product-sku">SKU Code</FieldLabel>
								<Input
									id="recipe-product-sku"
									placeholder="RCP-001"
									aria-invalid={Boolean(errors.skuCode) || undefined}
									{...register("skuCode", {
										required: "SKU Code is required.",
									})}
								/>
								<FieldError
									errors={errors.skuCode ? [errors.skuCode] : undefined}
								/>
							</Field>
						</div>

						<Field data-invalid={Boolean(errors.productImageName) || undefined}>
							<FieldLabel htmlFor="recipe-product-image">Product image</FieldLabel>
							<Input
								id="recipe-product-image"
								type="file"
								accept="image/*"
								aria-invalid={Boolean(errors.productImageName) || undefined}
								onChange={handleProductImageChange}
							/>
							<FieldDescription>
								{productImageName
									? `Selected file: ${productImageName}`
									: "Upload an image for this recipe product."}
							</FieldDescription>
							<FieldError
								errors={
									errors.productImageName
										? [errors.productImageName]
										: undefined
								}
							/>
						</Field>
					</FieldGroup>
				</FieldSet>

				<Card>
					<CardContent className="flex flex-col gap-4">
						<div className="flex items-center justify-between gap-3">
							<div>
								<p className="font-medium type-sm">Ingredients</p>
								<p className="text-muted-foreground type-xs">
									Build your recipe with raw materials.
								</p>
							</div>
							<Button
								onClick={() => setRawMaterialDialogOpen(true)}
								type="button"
								variant="outline"
							>
								<Plus data-icon="inline-start" /> Add ingredient
							</Button>
						</div>

						{selectedRawMaterials.length === 0 ? (
							<p className="text-muted-foreground type-sm">
								No raw materials selected yet.
							</p>
						) : (
							<div className="flex flex-col gap-2">
								{selectedRawMaterials.map((material) => (
									<div
										className="flex items-center gap-3 rounded-2xl border p-3"
										key={material.id}
									>
										<Avatar size="sm">
											<AvatarFallback>
												{getInitials(material.name)}
											</AvatarFallback>
										</Avatar>
										<div className="min-w-0 flex-1">
											<p className="truncate font-medium type-sm">
												{material.name}
											</p>
											<p className="text-muted-foreground type-xs">
												Qty: {material.quantity} {material.unit}
											</p>
										</div>
										<Button
											aria-label={`Remove ${material.name}`}
											onClick={() => onRemoveRawMaterial(material.id)}
											size="icon-xs"
											type="button"
											variant="ghost"
										>
											<X />
										</Button>
									</div>
								))}
							</div>
						)}

						<RawMaterialsSelectDialog
							open={rawMaterialDialogOpen}
							onConfirm={handleSelectRawMaterials}
							onOpenChange={setRawMaterialDialogOpen}
						/>

						{ingredientsError ? (
							<p className="text-destructive type-xs">{ingredientsError}</p>
						) : null}

						<Alert className="max-w-md">
							<Info />
							<AlertTitle>Inventory Update</AlertTitle>
							<AlertDescription>
								This composite product will automatically deduct items from
								inventory upon every transaction confirmed in the system.
							</AlertDescription>
						</Alert>
					</CardContent>
				</Card>
			</div>

			<div className="flex justify-end gap-6">
				<Button onClick={onBack} type="button" variant="ghost">
					Back
				</Button>
				<Button type="submit">Save</Button>
			</div>
		</form>
	);
}
