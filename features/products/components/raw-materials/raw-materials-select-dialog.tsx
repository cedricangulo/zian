"use client";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Field,
	FieldContent,
	FieldDescription,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
	FieldTitle,
} from "@/components/ui/field";

import { rawMaterialOptions } from "../../data/mock-data";
import { useRawMaterialsSelection } from "../../hooks";
import type { ProductRawMaterialOption } from "../../hooks/use-add-product";

interface RawMaterialsSelectDialogProps {
	open: boolean;
	onOpenChange: (nextOpen: boolean) => void;
	onConfirm: (materials: ProductRawMaterialOption[]) => void;
}

export function RawMaterialsSelectDialog({
	open,
	onOpenChange,
	onConfirm,
}: RawMaterialsSelectDialogProps) {
	const {
		handleCancel,
		handleConfirm,
		handleOpenChange,
		selectedMaterialIds,
		toggleSelection,
	} = useRawMaterialsSelection({
		options: rawMaterialOptions,
		onConfirm,
		onOpenChange,
	});

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Select raw materials</DialogTitle>
					<DialogDescription>
						Choose one or more raw materials to add to this recipe.
					</DialogDescription>
				</DialogHeader>

				<FieldSet>
					<FieldLegend variant="label">Raw material list</FieldLegend>
					<FieldGroup className="gap-2">
						{rawMaterialOptions.map((material) => {
							const isChecked = selectedMaterialIds.includes(material.id);

							return (
								<FieldLabel
									className="block"
									htmlFor={material.id}
									key={material.id}
								>
									<Field
										className="items-center rounded-2xl border p-4"
										orientation="horizontal"
									>
										<Checkbox
											checked={isChecked}
											id={material.id}
											name={material.id}
											onCheckedChange={(nextChecked) => {
												toggleSelection(material.id, nextChecked === true);
											}}
										/>
										<FieldContent>
											<FieldTitle>{material.name}</FieldTitle>
											<FieldDescription>{material.unit}</FieldDescription>
										</FieldContent>
									</Field>
								</FieldLabel>
							);
						})}
					</FieldGroup>
				</FieldSet>

				<DialogFooter>
					<Button onClick={handleCancel} type="button" variant="outline">
						Cancel
					</Button>
					<Button
						disabled={selectedMaterialIds.length === 0}
						onClick={handleConfirm}
						type="button"
					>
						Add selected
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
