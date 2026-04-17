"use client";

import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";

interface DiscardChangesDialogProps {
	open: boolean;
	onOpenChange: (nextOpen: boolean) => void;
	onDiscard: () => void;
}

export function DiscardChangesDialog({
	open,
	onDiscard,
	onOpenChange,
}: DiscardChangesDialogProps) {
	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent showCloseButton={false} className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Discard unsaved changes?</DialogTitle>
					<DialogDescription>
						You have an in-progress stock entry. If you close now, your current
						changes will be lost.
					</DialogDescription>
				</DialogHeader>
				<DialogFooter>
					<Button onClick={() => onOpenChange(false)}>
						Keep editing
					</Button>
					<Button onClick={onDiscard} variant="destructive">
						Discard changes
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}