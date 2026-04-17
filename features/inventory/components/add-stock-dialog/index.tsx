"use client";

import { useState } from "react";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogTrigger,
} from "@/components/ui/dialog";

import { AddStockDialogContent } from "./add-stock-dialog-content";
import { useAddStockDialogState } from "../../hooks";

export function AddStockDialogButton() {
	const [open, setOpen] = useState(false);
	const dialogState = useAddStockDialogState({
		onSave: () => setOpen(false),
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
				<Button>
					<Plus /> Add Stock
				</Button>
			</DialogTrigger>
			<DialogContent
				className="w-full transition-[max-width] duration-300"
				style={{
					maxWidth:
						dialogState.stage === "choice" ? "720px" : "1200px",
				}}
			>
				<AddStockDialogContent {...dialogState} />
			</DialogContent>
		</Dialog>
	);
}
