import type { Id } from "@/convex/_generated/dataModel";

export type ProductAvailability = "available" | "out_of_stock";

export type ProductCardItem = {
	id: Id<"products">;
	name: string;
	category: string;
	availability: ProductAvailability;
	imageSrc: string;
	baseUnit: string;
};

export type DispatchSlipItem = {
	id: Id<"products">;
	name: string;
	quantity: number;
	category: string;
	imageSrc: string;
	baseUnit: string;
};

export type DispatchSlipGroup = {
	category: string;
	items: DispatchSlipItem[];
};
