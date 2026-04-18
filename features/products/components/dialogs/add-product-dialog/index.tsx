"use client";

import { useState } from "react";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

import { useAddProductDialogState } from "../../../hooks";

import { AddProductDialogContent } from "./add-product-dialog-content";

export function AddProductDialogButton({
	buttonVariant,
}: {
	buttonVariant?: "secondary" | "default";
}) {
	const [open, setOpen] = useState(false);
	const dialogState = useAddProductDialogState({
		onSave: () => {
			setOpen(false);
		},
	});

	const handleOpenChange = (nextOpen: boolean) => {
		if (nextOpen) {
			dialogState.resetDialogState();
		}

		setOpen(nextOpen);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogTrigger asChild>
				<Button variant={buttonVariant}>
					<Plus /> Add Product
				</Button>
			</DialogTrigger>
			<DialogContent
				className="w-full transition-[max-width] duration-300"
				style={{
					maxWidth:
						dialogState.stage === "choice"
							? "720px"
							: dialogState.stage === "recipe-builder-step-two"
								? "1200px"
								: "1200px",
				}}
			>
				<AddProductDialogContent {...dialogState} />
			</DialogContent>
		</Dialog>
	);
}
