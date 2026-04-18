"use client";

import Image from "next/image";
import { Controller, type Control, type FieldErrors, type UseFormRegister } from "react-hook-form";
import { SearchIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
	standardItemCategoryOptions,
	type StandardCatalogItem,
} from "../../data/mock-data";
import type { StandardItemFormValues } from "../../hooks/use-standard-item-form-state";
import { ProductOptionCombobox } from "../dialogs/add-product-dialog/product-option-combobox";

interface StandardItemFormProps {
	control: Control<StandardItemFormValues>;
	errors: FieldErrors<StandardItemFormValues>;
	filteredItems: StandardCatalogItem[];
	queuedItemSet: Set<string>;
	register: UseFormRegister<StandardItemFormValues>;
	onToggleQueuedItem: (itemId: string, checked: boolean) => void;
}

export function StandardItemForm({
	control,
	errors,
	filteredItems,
	queuedItemSet,
	register,
	onToggleQueuedItem,
}: StandardItemFormProps) {
	return (
		<FieldSet>
			<FieldGroup className="gap-4">
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-[2fr_1fr]">
					<Field>
						<FieldLabel htmlFor="standard-item-search" className="sr-only">
							Search item
						</FieldLabel>
						<InputGroup>
							<InputGroupInput
								id="standard-item-search"
								placeholder="Search by name or category"
								{...register("search")}
							/>
							<InputGroupAddon align="inline-start">
								<SearchIcon data-icon="inline-start" />
							</InputGroupAddon>
						</InputGroup>
					</Field>

					<Field data-invalid={Boolean(errors.category) || undefined}>
						<FieldLabel htmlFor="standard-item-category" className="sr-only">
							Category
						</FieldLabel>
						<Controller
							control={control}
							name="category"
							rules={{ required: "Category is required." }}
							render={({ field: categoryField }) => (
								<ProductOptionCombobox
									ariaInvalid={Boolean(errors.category) || undefined}
									id="standard-item-category"
									onValueChange={categoryField.onChange}
									options={standardItemCategoryOptions}
									placeholder="Category"
									value={categoryField.value}
								/>
							)}
						/>
						<FieldError
							errors={errors.category ? [errors.category] : undefined}
						/>
					</Field>
				</div>

				<ScrollArea className="h-72 rounded-2xl border p-3">
					<div className="flex flex-col gap-2">
						{filteredItems.map((item) => {
							const checkboxId = `standard-item-${item.id}`;
							const isChecked = queuedItemSet.has(item.id);

							return (
								<FieldLabel className="block" htmlFor={checkboxId} key={item.id}>
									<Field
										className="items-center rounded-2xl border p-3"
										orientation="horizontal"
									>
										<Checkbox
											checked={isChecked}
											id={checkboxId}
											name={checkboxId}
											onCheckedChange={(nextChecked) => {
												onToggleQueuedItem(item.id, nextChecked === true);
											}}
										/>
										<div className="relative size-10 overflow-hidden rounded-md">
											<Image
												alt={item.name}
												fill
												sizes="40px"
												src={item.imageSrc}
											/>
										</div>
										<FieldContent>
											<FieldTitle className="type-sm">{item.name}</FieldTitle>
											<FieldDescription className="type-xs">
												{item.category}
											</FieldDescription>
										</FieldContent>
										<Badge variant="secondary">
											{item.inStockQty} {item.unit} in stock
										</Badge>
									</Field>
								</FieldLabel>
							);
						})}
					</div>
				</ScrollArea>
			</FieldGroup>
		</FieldSet>
	);
}
