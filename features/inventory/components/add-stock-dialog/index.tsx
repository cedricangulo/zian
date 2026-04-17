"use client";

import { useCallback, useRef, useState } from "react";

import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogTrigger,
} from "@/components/ui/dialog";

import { AddStockDialogContent } from "./add-stock-dialog-content";
import { DiscardChangesDialog } from "./discard-changes-dialog";
import { useAddStockDialogState } from "../../hooks";

export function AddStockDialogButton() {
	const [open, setOpen] = useState(false);
	const [discardDialogOpen, setDiscardDialogOpen] = useState(false);
	const closeBypassRef = useRef(false);
	const dialogState = useAddStockDialogState({
		onSave: () => {
			closeBypassRef.current = true;
			setDiscardDialogOpen(false);
			setOpen(false);
		},
	});

	const closeDialog = useCallback(() => {
		closeBypassRef.current = true;
		setDiscardDialogOpen(false);
		setOpen(false);
	}, []);

	const handleOpenChange = (nextOpen: boolean) => {
		if (nextOpen) {
			dialogState.resetDialogState();
			setDiscardDialogOpen(false);
		}

		if (!nextOpen && closeBypassRef.current) {
			closeBypassRef.current = false;
			setDiscardDialogOpen(false);
			setOpen(false);
			return;
		}

		if (!nextOpen && dialogState.hasUnsavedChanges) {
			setDiscardDialogOpen(true);
			return;
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
			<DiscardChangesDialog
				open={discardDialogOpen}
				onOpenChange={(nextOpen) => {
					setDiscardDialogOpen(nextOpen);
				}}
				onDiscard={closeDialog}
			/>
		</Dialog>
	);
}
