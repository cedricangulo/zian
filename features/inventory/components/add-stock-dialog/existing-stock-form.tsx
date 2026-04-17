"use client";

import Image from "next/image";
import { useForm, Controller } from "react-hook-form";
import { Plus, SearchIcon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

import { Button } from "@/components/ui/button";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldSet,
	FieldTitle,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "@/components/ui/input-group";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import type { ExistingStockDraft } from "../../types";
import { existingStockItems } from "../../data/mock-data";
import {
	normalizeExistingStockDraft,
	useExistingStockFormState,
} from "../../hooks";
import { Card, CardContent } from "@/components/ui/card";

interface ExistingStockFormProps {
	value: ExistingStockDraft;
	onBack: () => void;
	onChange: (nextValue: ExistingStockDraft) => void;
	onSave: () => void;
}

export function ExistingStockForm({
	value,
	onBack,
	onChange,
	onSave,
}: ExistingStockFormProps) {
	const {
		control,
		formState: { errors },
		handleSubmit,
		register,
		setValue,
	} = useForm<ExistingStockDraft>({
		defaultValues: normalizeExistingStockDraft(value),
	});

	const { categoryOptions, filteredItems, selectedItemId } =
		useExistingStockFormState({
			control,
			onChange,
			items: existingStockItems,
		});

	return (
		<form
			className="flex w-full flex-col gap-6"
			onSubmit={handleSubmit(() => {
				onSave();
			})}
		>
			<input type="hidden" {...register("itemName")} />
			<input
				type="hidden"
				{...register("selectedItemId", {
					required: "Select an item from the list.",
				})}
			/>

			<div className="grid w-full gap-6 lg:grid-cols-2">
				<FieldSet>
					<FieldGroup className="gap-6">
						<div className="flex gap-6">
							<Field>
								<FieldLabel htmlFor="existing-item-search" className="sr-only">
									Search item
								</FieldLabel>
								<InputGroup>
									<InputGroupInput
										id="existing-item-search"
										placeholder="Search by name or category"
										{...register("search")}
									/>
									<InputGroupAddon align="inline-start">
										<SearchIcon />
									</InputGroupAddon>
								</InputGroup>
							</Field>

							<Field>
								<FieldLabel
									htmlFor="existing-item-category"
									className="sr-only"
								>
									Category
								</FieldLabel>
								<Controller
									control={control}
									name="category"
									render={({ field }) => (
										<Select onValueChange={field.onChange} value={field.value}>
											<SelectTrigger
												id="existing-item-category"
												className="w-fit"
											>
												<SelectValue placeholder="All categories" />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{categoryOptions.map((category) => (
														<SelectItem key={category} value={category}>
															{category === "all" ? "All categories" : category}
														</SelectItem>
													))}
												</SelectGroup>
											</SelectContent>
										</Select>
									)}
								/>
							</Field>
						</div>

						<Field data-invalid={Boolean(errors.selectedItemId) || undefined}>
							<FieldLabel className="sr-only">Items</FieldLabel>
							<RadioGroup
								className="gap-2"
								onValueChange={(nextItemId) => {
									const nextItem = filteredItems.find(
										(item) => item.id === nextItemId,
									);

									setValue("selectedItemId", nextItemId, {
										shouldDirty: true,
										shouldValidate: true,
									});
									setValue("itemName", nextItem?.name ?? "", {
										shouldDirty: true,
									});
								}}
								value={selectedItemId}
							>
								<ScrollArea className="h-72">
									<div className="flex flex-col gap-3">
										{filteredItems.map((item) => {
											return (
												<div key={item.id} className="rounded-2xl border">
													<FieldLabel htmlFor={item.id}>
														<Field orientation="horizontal">
															<RadioGroupItem id={item.id} value={item.id} />
															<div className="relative size-10 shrink-0 overflow-hidden rounded-md">
																<Image
																	alt={item.name}
																	fill
																	sizes="40px"
																	src={item.imageSrc}
																/>
															</div>
															<FieldContent>
																<FieldTitle className="type-sm">
																	{item.name}
																</FieldTitle>
																<FieldDescription className="type-xs">
																	{item.category}
																</FieldDescription>
															</FieldContent>
															<Badge variant="secondary">
																In stock: {item.inStockQty}
															</Badge>
														</Field>
													</FieldLabel>
												</div>
											);
										})}

										{filteredItems.length === 0 ? (
											<Alert>
												<AlertDescription>
													No items match your current search and category
													filter.
												</AlertDescription>
											</Alert>
										) : null}
									</div>
								</ScrollArea>
							</RadioGroup>
							<FieldError
								errors={
									errors.selectedItemId ? [errors.selectedItemId] : undefined
								}
							/>
						</Field>
					</FieldGroup>
				</FieldSet>

				<Card>
					<CardContent>
						<FieldSet>
							<FieldGroup className="gap-4">
								<div className="grid grid-cols-2 gap-6">
									<Field data-invalid={Boolean(errors.batchCode) || undefined}>
										<FieldLabel htmlFor="existing-item-batch-id">
											Batch ID
										</FieldLabel>
										<Input
											id="existing-item-batch-id"
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

									<Field data-invalid={Boolean(errors.quantity) || undefined}>
										<FieldLabel htmlFor="existing-item-quantity">
											Qty
										</FieldLabel>
										<InputGroup>
											<InputGroupInput
												id="existing-item-quantity"
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
											{/* depends on the item's unit */}
											<InputGroupAddon align="inline-end">
												<InputGroupText>pcs</InputGroupText>
											</InputGroupAddon>
										</InputGroup>
										<FieldError
											errors={errors.quantity ? [errors.quantity] : undefined}
										/>
									</Field>
								</div>

								<Field data-invalid={Boolean(errors.expiryDate) || undefined}>
									<FieldLabel htmlFor="existing-item-expiry-date">
										Expiry date
									</FieldLabel>
									<Input
										id="existing-item-expiry-date"
										type="date"
										aria-invalid={Boolean(errors.expiryDate) || undefined}
										{...register("expiryDate", {
											required: "Expiry date is required.",
										})}
									/>
									<FieldError
										errors={errors.expiryDate ? [errors.expiryDate] : undefined}
									/>
								</Field>

								<Field
									data-invalid={Boolean(errors.totalAssetValue) || undefined}
								>
									<FieldLabel htmlFor="existing-item-asset-value">
										Total asset value
									</FieldLabel>
									<InputGroup>
										<InputGroupInput
											id="existing-item-asset-value"
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
					<Plus /> Add to Inventory
				</Button>
			</div>
		</form>
	);
}
