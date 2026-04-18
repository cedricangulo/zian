"use client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	SheetTrigger,
} from "@/components/ui/sheet";
import { History, ReceiptTextIcon, Trash } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import Image from "next/image";

import { formatCategoryLabel } from "../helpers";
import type { DispatchSlipGroup, ProductCardItem } from "../types";

type Props = {
	groups: DispatchSlipGroup[];
	totalQuantity: number;
	onRemoveItem: (productId: ProductCardItem["id"]) => void;
	onClearAll: () => void;
	onSubmitDispatch: () => void;
	isSubmitting: boolean;
	lastTransactionId: string | null;
	submitError: string | null;
};

export function DispatchSlipSheet({
	groups,
	totalQuantity,
	onRemoveItem,
	onClearAll,
	onSubmitDispatch,
	isSubmitting,
	lastTransactionId,
	submitError,
}: Props) {
	const hasItems = groups.length > 0;

	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant="secondary">Dispatch Slip ({totalQuantity})</Button>
			</SheetTrigger>
			<SheetContent>
				<SheetHeader>
					<SheetTitle className="flex items-center gap-2">
						<ReceiptTextIcon className="size-4" /> Current Dispatch Slip
					</SheetTitle>
					<SheetDescription>
						{lastTransactionId ? (
							<Badge variant="outline">Slip #{lastTransactionId}</Badge>
						) : (
							<Badge variant="outline">Draft</Badge>
						)}
					</SheetDescription>
				</SheetHeader>
				<div className="grid flex-1 gap-6 px-4 auto-rows-min">
					<div className="flex gap-2">
						<Button variant="secondary">
							<History /> History
						</Button>
						<Button variant="destructive" onClick={onClearAll} disabled={!hasItems}>
							<Trash /> Clear All
						</Button>
					</div>
					{hasItems ? (
						groups.map((group) => (
							<div className="grid gap-2" key={group.category}>
								<Label>{formatCategoryLabel(group.category)}</Label>
								{group.items.map((item) => (
									<Card className="p-2" key={item.id}>
										<CardContent className="flex items-center gap-2 p-0">
											<Image
												src={item.imageSrc}
												alt={`${item.name} image`}
												sizes="36px"
												width={36}
												height={36}
												className="rounded-full object-fit size-9"
											/>
											<div className="flex items-center justify-between w-full">
												<div>
													<p className="type-sm">{item.name}</p>
													<span className="type-xs">
														{item.quantity}x {item.baseUnit}
													</span>
												</div>
												<Button
													size="icon"
													variant="destructive"
													onClick={() => onRemoveItem(item.id)}
												>
													<Trash />
												</Button>
											</div>
										</CardContent>
									</Card>
								))}
							</div>
						))
					) : (
						<p className="type-sm text-muted-foreground">
							No draft items yet. Increment from product cards to populate this slip.
						</p>
					)}
					{submitError ? (
						<p className="type-sm text-destructive">{submitError}</p>
					) : null}
				</div>
				<SheetFooter>
					<Button
						type="button"
						onClick={onSubmitDispatch}
						disabled={!hasItems || isSubmitting}
					>
						{isSubmitting ? "Submitting..." : "Submit Dispatch"}
					</Button>
				</SheetFooter>
			</SheetContent>
		</Sheet>
	);
}
