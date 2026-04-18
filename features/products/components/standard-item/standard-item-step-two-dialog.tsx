"use client";

import { Controller } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/ui/field";

import {
	getQueuedCatalogItems,
	removeQueuedCatalogItem,
	toggleQueuedCatalogItem,
	useStandardItemFormState,
} from "../../hooks/use-standard-item-form-state";

import { StandardItemForm } from "./form";
import { StandardItemQueuedCard } from "./queued-card";

interface StandardItemStepTwoDialogProps {
	onBack: () => void;
	onSave: () => void;
}

export function StandardItemStepTwoDialog({
	onBack,
	onSave,
}: StandardItemStepTwoDialogProps) {
	const { control, errors, filteredItems, register, submit } =
		useStandardItemFormState({ onSave });

	return (
		<form className="grid gap-6" onSubmit={submit}>
			<Controller
				control={control}
				name="queuedItemIds"
				rules={{
					validate: (value) =>
						value.length > 0 ||
						"Select at least one item to queue for catalog.",
				}}
				render={({ field, fieldState }) => {
					const queuedItemIds = field.value;
					const queuedItemSet = new Set(queuedItemIds);
					const queuedItems = getQueuedCatalogItems(queuedItemIds);

					return (
						<>
							<div className="grid w-full gap-6 lg:grid-cols-2">
								<StandardItemForm
									control={control}
									errors={errors}
									filteredItems={filteredItems}
									queuedItemSet={queuedItemSet}
									register={register}
									onToggleQueuedItem={(itemId, checked) => {
										field.onChange(
											toggleQueuedCatalogItem(
												queuedItemIds,
												itemId,
												checked,
											),
										);
									}}
								/>

								<StandardItemQueuedCard
									queuedItems={queuedItems}
									onClearQueuedItems={() => {
										field.onChange([]);
									}}
									onRemoveQueuedItem={(itemId) => {
										field.onChange(removeQueuedCatalogItem(queuedItemIds, itemId));
									}}
								/>
							</div>

							<FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
						</>
					);
				}}
			/>

			<div className="flex justify-between gap-3">
				<Button onClick={onBack} type="button" variant="outline">
					Back
				</Button>
				<Button type="submit">Save</Button>
			</div>
		</form>
	);
}
