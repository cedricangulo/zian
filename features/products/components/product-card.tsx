"use client";

import Image from "next/image";
import { Box, MinusIcon, PlusIcon, SearchX } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
	Empty,
	EmptyContent,
	EmptyDescription,
	EmptyHeader,
	EmptyMedia,
	EmptyTitle,
} from "@/components/ui/empty";

import { formatCategoryLabel } from "../helpers";
import type { ProductCardItem } from "../types";

import { AddProductDialogButton } from "./dialogs/add-product-dialog";

type Props = {
	products: ProductCardItem[];
	hasCatalogProducts: boolean;
	hasActiveFilters: boolean;
	isLoading: boolean;
	getQuantityByProductId: (productId: ProductCardItem["id"]) => number;
	onIncrement: (product: ProductCardItem) => void;
	onDecrement: (product: ProductCardItem) => void;
};

export function ProductsCardGrid({
	products,
	hasCatalogProducts,
	hasActiveFilters,
	isLoading,
	getQuantityByProductId,
	onIncrement,
	onDecrement,
}: Props) {
	if (isLoading) {
		return <p className="type-sm text-muted-foreground">Loading products...</p>;
	}

	if (products.length === 0) {
		if (hasCatalogProducts || hasActiveFilters) {
			return (
				<Empty>
					<EmptyHeader>
						<EmptyMedia variant="icon">
							<SearchX />
						</EmptyMedia>
						<EmptyTitle>No matching products found</EmptyTitle>
						<EmptyDescription>
							Try changing your search or category filter.
						</EmptyDescription>
					</EmptyHeader>
				</Empty>
			);
		}

		return (
			<Empty>
				<EmptyHeader>
					<EmptyMedia variant="icon">
						<Box />
					</EmptyMedia>
					<EmptyTitle>Your catalog is empty</EmptyTitle>
					<EmptyDescription>
						Get started by adding your first product
					</EmptyDescription>
				</EmptyHeader>
				<EmptyContent>
					<AddProductDialogButton buttonVariant="secondary" />
				</EmptyContent>
			</Empty>
		);
	}

	return (
		<div className="grid gap-6 md:grid-cols-3 xl:grid-cols-4">
			{products.map((product) => {
				const quantity = getQuantityByProductId(product.id);
				const isUnavailable = product.availability !== "available";

				return (
					<Card key={product.id} className="gap-0 py-0 overflow-hidden">
						<div className="relative h-36 bg-muted/40">
							<Image
								alt={product.name}
								className="object-cover select-none"
								draggable={false}
								fill
								sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw"
								src={product.imageSrc}
							/>
						</div>
						<CardContent className="p-4 space-y-2">
							<div>
								<p className="type-sm text-muted-foreground">
									{formatCategoryLabel(product.category)}
								</p>
								<h4 className="font-semibold type-base">{product.name}</h4>
							</div>
							<Badge variant={isUnavailable ? "destructive" : "secondary"}>
								{isUnavailable ? "Out of stock" : "Available"}
							</Badge>
						</CardContent>
						<CardFooter className="p-4 pt-0">
							<div className="flex items-center justify-between w-full gap-2">
								<Button
									type="button"
									variant="outline"
									size="icon"
									onClick={() => onDecrement(product)}
									disabled={isUnavailable || quantity <= 0}
									aria-label={`Decrease quantity for ${product.name}`}
								>
									<MinusIcon aria-hidden="true" />
								</Button>
								<p className="type-sm tabular-nums min-w-8 text-center">{quantity}</p>
								<Button
									type="button"
									variant="outline"
									size="icon"
									onClick={() => onIncrement(product)}
									disabled={isUnavailable}
									aria-label={`Increase quantity for ${product.name}`}
								>
									<PlusIcon aria-hidden="true" />
								</Button>
							</div>
						</CardFooter>
					</Card>
				);
			})}
		</div>
	);
}
