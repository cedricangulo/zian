"use client";

import { Plus } from "lucide-react";
import { Controller, useForm } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldSet,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "@/components/ui/input-group";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

import type { NewStockDraft } from "../../types";
import { normalizeNewStockDraft, useNewStockFormState } from "../../hooks";
interface NewStockFormProps {
	value: NewStockDraft;
	onBack: () => void;
	onChange: (nextValue: NewStockDraft) => void;
	onSave: () => void;
}

export function NewStockForm({
	value,
	onBack,
	onChange,
	onSave,
}: NewStockFormProps) {
	const {
		control,
		formState: { errors },
		handleSubmit,
		register,
		setValue,
	} = useForm<NewStockDraft>({
		defaultValues: normalizeNewStockDraft(value),
	});

	const {
		categoryOptions,
		unitOptions,
		supplierOptions,
		hasExpiryDate,
		itemImageName,
		selectedUnit,
	} = useNewStockFormState({
		control,
		onChange,
	});

	return (
		<form
			className="flex w-full flex-col gap-6"
			onSubmit={handleSubmit(() => {
				onSave();
			})}
		>
			<input
				type="hidden"
				{...register("itemImageName", {
					required: "Item image is required.",
				})}
			/>

			<div className="grid w-full gap-6 lg:grid-cols-2">
				<FieldSet>
					<FieldGroup className="gap-4">
						<Field data-invalid={Boolean(errors.itemImageName) || undefined}>
							<FieldLabel htmlFor="new-item-image">Item image</FieldLabel>
							<Input
								id="new-item-image"
								type="file"
								accept="image/*"
								aria-invalid={Boolean(errors.itemImageName) || undefined}
								onChange={(event) => {
									setValue(
										"itemImageName",
										event.currentTarget.files?.[0]?.name ?? "",
										{
											shouldDirty: true,
											shouldValidate: true,
										},
									);
								}}
							/>
							<FieldDescription>
								{itemImageName
									? `Selected file: ${itemImageName}`
									: "Upload an image for this inventory item."}
							</FieldDescription>
							<FieldError
								errors={
									errors.itemImageName ? [errors.itemImageName] : undefined
								}
							/>
						</Field>

						<Field data-invalid={Boolean(errors.itemName) || undefined}>
							<FieldLabel htmlFor="new-item-name">Item name</FieldLabel>
							<Input
								id="new-item-name"
								placeholder="Cup Lid 12oz"
								aria-invalid={Boolean(errors.itemName) || undefined}
								{...register("itemName", {
									required: "Item name is required.",
								})}
							/>
							<FieldError
								errors={errors.itemName ? [errors.itemName] : undefined}
							/>
						</Field>

						<div className="grid grid-cols-2 gap-6">
							<Field data-invalid={Boolean(errors.category) || undefined}>
								<FieldLabel htmlFor="new-item-category">Category</FieldLabel>
								<Controller
									control={control}
									name="category"
									rules={{ required: "Category is required." }}
									render={({ field }) => (
										<Select onValueChange={field.onChange} value={field.value}>
											<SelectTrigger
												id="new-item-category"
												className="w-full"
												aria-invalid={Boolean(errors.category) || undefined}
											>
												<SelectValue placeholder="Select category" />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{categoryOptions.map((option) => (
														<SelectItem key={option} value={option}>
															{option}
														</SelectItem>
													))}
												</SelectGroup>
											</SelectContent>
										</Select>
									)}
								/>
								<FieldError
									errors={errors.category ? [errors.category] : undefined}
								/>
							</Field>

							<Field data-invalid={Boolean(errors.unit) || undefined}>
								<FieldLabel htmlFor="new-item-unit">Unit</FieldLabel>
								<Controller
									control={control}
									name="unit"
									rules={{ required: "Unit is required." }}
									render={({ field }) => (
										<Select onValueChange={field.onChange} value={field.value}>
											<SelectTrigger
												id="new-item-unit"
												className="w-full"
												aria-invalid={Boolean(errors.unit) || undefined}
											>
												<SelectValue placeholder="Select unit" />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{unitOptions.map((option) => (
														<SelectItem key={option} value={option}>
															{option}
														</SelectItem>
													))}
												</SelectGroup>
											</SelectContent>
										</Select>
									)}
								/>
								<FieldError errors={errors.unit ? [errors.unit] : undefined} />
							</Field>
						</div>

						<Field data-invalid={Boolean(errors.supplier) || undefined}>
							<FieldLabel htmlFor="new-item-supplier">Supplier</FieldLabel>
							<Controller
								control={control}
								name="supplier"
								rules={{ required: "Supplier is required." }}
								render={({ field }) => (
									<Select onValueChange={field.onChange} value={field.value}>
										<SelectTrigger
											id="new-item-supplier"
											className="w-full"
											aria-invalid={Boolean(errors.supplier) || undefined}
										>
											<SelectValue placeholder="Select supplier" />
										</SelectTrigger>
										<SelectContent>
											<SelectGroup>
												{supplierOptions.map((option) => (
													<SelectItem key={option} value={option}>
														{option}
													</SelectItem>
												))}
											</SelectGroup>
										</SelectContent>
									</Select>
								)}
							/>
							<FieldError
								errors={errors.supplier ? [errors.supplier] : undefined}
							/>
						</Field>
					</FieldGroup>
				</FieldSet>

				<Card>
					<CardContent>
						<FieldSet>
							<FieldGroup className="gap-4">
								<div className="grid grid-cols-2 gap-6">
									<Field data-invalid={Boolean(errors.sku) || undefined}>
										<FieldLabel htmlFor="new-item-sku">SKU</FieldLabel>
										<Input
											id="new-item-sku"
											placeholder="LID-012"
											aria-invalid={Boolean(errors.sku) || undefined}
											{...register("sku", {
												required: "SKU is required.",
											})}
										/>
										<FieldError
											errors={errors.sku ? [errors.sku] : undefined}
										/>
									</Field>

									<Field data-invalid={Boolean(errors.batchCode) || undefined}>
										<FieldLabel htmlFor="new-item-batch-id">
											Batch ID
										</FieldLabel>
										<Input
											id="new-item-batch-id"
											placeholder="BATCH-2026-04-01"
											aria-invalid={Boolean(errors.batchCode) || undefined}
											{...register("batchCode", {
												required: "Batch ID is required.",
											})}
										/>
										<FieldError
											errors={errors.batchCode ? [errors.batchCode] : undefined}
										/>
									</Field>
								</div>

								<Field data-invalid={Boolean(errors.quantity) || undefined}>
									<FieldLabel htmlFor="new-item-quantity">Qty</FieldLabel>
									<InputGroup>
										<InputGroupInput
											id="new-item-quantity"
											inputMode="numeric"
											placeholder="48"
											aria-invalid={Boolean(errors.quantity) || undefined}
											{...register("quantity", {
												required: "Quantity is required.",
												pattern: {
													value: /^\d+$/,
													message: "Quantity must be a whole number.",
												},
											})}
										/>
										<InputGroupAddon align="inline-end">
											<InputGroupText>{selectedUnit || "unit"}</InputGroupText>
										</InputGroupAddon>
									</InputGroup>
									<FieldError
										errors={errors.quantity ? [errors.quantity] : undefined}
									/>
								</Field>

								<Field orientation="horizontal">
									<FieldContent>
										<FieldLabel htmlFor="new-item-has-expiry">
											Has expiry date
										</FieldLabel>
									</FieldContent>
									<Controller
										control={control}
										name="hasExpiryDate"
										render={({ field }) => (
											<Switch
												id="new-item-has-expiry"
												checked={field.value}
												onCheckedChange={(checked) => {
													field.onChange(checked);
													if (!checked) {
														setValue("expiryDate", "", {
															shouldDirty: true,
															shouldValidate: true,
														});
													}
												}}
											/>
										)}
									/>
								</Field>

								<Field
									data-disabled={!hasExpiryDate || undefined}
									data-invalid={
										(hasExpiryDate && Boolean(errors.expiryDate)) || undefined
									}
								>
									<FieldLabel htmlFor="new-item-expiry-date">
										Expiry date
									</FieldLabel>
									<Input
										id="new-item-expiry-date"
										type="date"
										disabled={!hasExpiryDate}
										aria-invalid={
											(hasExpiryDate && Boolean(errors.expiryDate)) || undefined
										}
										{...register("expiryDate", {
											validate: (inputValue) => {
												if (!hasExpiryDate) {
													return true;
												}
												return inputValue
													? true
													: "Expiry date is required when enabled.";
											},
										})}
									/>
									<FieldError
										errors={errors.expiryDate ? [errors.expiryDate] : undefined}
									/>
								</Field>

								<Field
									data-invalid={Boolean(errors.totalAssetValue) || undefined}
								>
									<FieldLabel htmlFor="new-item-asset-value">
										Total asset value
									</FieldLabel>
									<InputGroup>
										<InputGroupInput
											id="new-item-asset-value"
											inputMode="decimal"
											placeholder="0.00"
											aria-invalid={
												Boolean(errors.totalAssetValue) || undefined
											}
											{...register("totalAssetValue", {
												required: "Total asset value is required.",
												pattern: {
													value: /^\d+(?:\.\d{1,2})?$/,
													message:
														"Use a valid amount with up to 2 decimal places.",
												},
											})}
										/>
										<InputGroupAddon>
											<InputGroupText>₱</InputGroupText>
										</InputGroupAddon>
									</InputGroup>
									<FieldError
										errors={
											errors.totalAssetValue
												? [errors.totalAssetValue]
												: undefined
										}
									/>
								</Field>
							</FieldGroup>
						</FieldSet>
					</CardContent>
				</Card>
			</div>

			<div className="flex items-center justify-end gap-6">
				<Button onClick={onBack} type="button" variant="ghost">
					Back
				</Button>
				<Button type="submit">
					<Plus data-icon="inline-start" /> Add to Inventory
				</Button>
			</div>
		</form>
	);
}
