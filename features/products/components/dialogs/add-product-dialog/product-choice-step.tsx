"use client";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldLabel,
	FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import type { ProductAddMode } from "../../../hooks/use-add-product";

interface ProductChoiceStepProps {
	value: ProductAddMode;
	onValueChange: (value: ProductAddMode) => void;
	onNext: () => void;
}

export function ProductChoiceStep({
	value,
	onValueChange,
	onNext,
}: ProductChoiceStepProps) {
	return (
		<div className="grid gap-6">
			<RadioGroup
				className="grid grid-cols-1 gap-4 sm:grid-cols-2"
				onValueChange={(nextValue) =>
					onValueChange(nextValue as ProductAddMode)
				}
				value={value}
			>
				<FieldLabel htmlFor="standard-item-product">
					<Field orientation="horizontal">
						<FieldContent>
							<FieldTitle>Standard Item</FieldTitle>
							<FieldDescription>
								Items sold or dispatched exactly as they are stocked.
							</FieldDescription>
						</FieldContent>
						<RadioGroupItem id="standard-item-product" value="standard-item" />
					</Field>
				</FieldLabel>

				<FieldLabel htmlFor="recipe-builder-product">
					<Field orientation="horizontal">
						<FieldContent>
							<FieldTitle>Recipe Builder</FieldTitle>
							<FieldDescription>
								Build composite product using items from inventory.
							</FieldDescription>
						</FieldContent>
						<RadioGroupItem
							id="recipe-builder-product"
							value="recipe-builder"
						/>
					</Field>
				</FieldLabel>
			</RadioGroup>

			<div className="flex justify-end">
				<Button onClick={onNext} type="button">
					Next <ArrowRight data-icon="inline-end" />
				</Button>
			</div>
		</div>
	);
}
