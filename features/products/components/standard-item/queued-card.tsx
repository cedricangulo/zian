"use client";

import Image from "next/image";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import type { QueuedCatalogItem } from "../../hooks/use-standard-item-form-state";

interface StandardItemQueuedCardProps {
	queuedItems: QueuedCatalogItem[];
	onClearQueuedItems: () => void;
	onRemoveQueuedItem: (itemId: string) => void;
}

export function StandardItemQueuedCard({
	queuedItems,
	onClearQueuedItems,
	onRemoveQueuedItem,
}: StandardItemQueuedCardProps) {
	return (
		<Card className="h-fit w-full">
			<CardContent className="flex flex-col gap-3">
				<div className="flex items-center justify-between gap-3">
					<p className="font-medium type-sm">Queued for catalog</p>
					<Button
						disabled={queuedItems.length === 0}
						onClick={onClearQueuedItems}
						type="button"
						variant="destructive"
					>
						Clear all
					</Button>
				</div>

				{queuedItems.length === 0 ? (
					<p className="text-muted-foreground type-sm">No items queued yet.</p>
				) : (
					<div className="flex flex-col gap-2">
						{queuedItems.map((item) => (
							<div
								className="flex items-center gap-3 rounded-2xl border p-3"
								key={item.id}
							>
								<div className="relative size-10 overflow-hidden rounded-md">
									<Image
										alt={item.name}
										fill
										sizes="40px"
										src={item.imageSrc}
									/>
								</div>
								<div className="min-w-0 flex-1">
									<p className="truncate font-medium type-sm">{item.name}</p>
									<p className="text-muted-foreground type-xs">
										{item.inStockQty} {item.unit} in stock
									</p>
								</div>
								<Button
									aria-label={`Remove ${item.name}`}
									onClick={() => onRemoveQueuedItem(item.id)}
									size="icon-xs"
									type="button"
									variant="ghost"
								>
									<X />
								</Button>
							</div>
						))}
					</div>
				)}
			</CardContent>
		</Card>
	);
}
