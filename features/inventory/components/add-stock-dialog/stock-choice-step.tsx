"use client";

import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldLabel,
	FieldTitle,
} from "@/components/ui/field";

export type StockAddMode = "existing" | "new";

interface StockChoiceStepProps {
	value: StockAddMode;
	onValueChange: (value: StockAddMode) => void;
	onNext: () => void;
}

export function StockChoiceStep({
	value,
	onValueChange,
	onNext,
}: StockChoiceStepProps) {
	return (
		<div className="grid gap-6">
			<RadioGroup
				className="grid grid-cols-1 gap-4 sm:grid-cols-2"
				onValueChange={(nextValue) => onValueChange(nextValue as StockAddMode)}
				value={value}
			>
				<FieldLabel htmlFor="existing-item">
					<Field orientation="horizontal">
						<FieldContent>
							<FieldTitle>Add Existing Item</FieldTitle>
							<FieldDescription>
								Add stock to an item already in the catalog.
							</FieldDescription>
						</FieldContent>
						<RadioGroupItem value="existing" id="existing-item" />
					</Field>
				</FieldLabel>

				<FieldLabel htmlFor="new-item">
					<Field orientation="horizontal">
						<FieldContent>
							<FieldTitle>New Item</FieldTitle>
							<FieldDescription>
								Create a new inventory item, then add the first stock.
							</FieldDescription>
						</FieldContent>
						<RadioGroupItem value="new" id="new-item" />
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
