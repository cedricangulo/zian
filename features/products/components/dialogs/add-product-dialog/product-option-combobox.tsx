"use client";

import { useState } from "react";

import {
	Combobox,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
} from "@/components/ui/combobox";

interface ProductOptionComboboxProps {
	id: string;
	placeholder: string;
	value: string;
	options: string[];
	ariaInvalid?: boolean;
	onValueChange: (nextValue: string) => void;
}

export function ProductOptionCombobox({
	ariaInvalid,
	id,
	onValueChange,
	options,
	placeholder,
	value,
}: ProductOptionComboboxProps) {
	const [portalContainer, setPortalContainer] = useState<HTMLDivElement | null>(
		null,
	);

	return (
		<div ref={setPortalContainer} className="w-full">
			<Combobox
				items={options}
				onValueChange={(nextValue) => {
					onValueChange(nextValue ?? "");
				}}
				value={value || null}
			>
				<ComboboxInput
					aria-invalid={ariaInvalid}
					className="w-full"
					id={id}
					placeholder={placeholder}
				/>
				<ComboboxContent portalContainer={portalContainer ?? undefined}>
					<ComboboxEmpty className="px-3 py-2 text-sm text-muted-foreground">
						No options found.
					</ComboboxEmpty>
					<ComboboxList>
						{(option) => (
							<ComboboxItem key={option} value={option}>
								{option}
							</ComboboxItem>
						)}
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
		</div>
	);
}
