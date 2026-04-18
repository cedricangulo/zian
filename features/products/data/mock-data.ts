import type { ProductRawMaterialOption } from "../hooks/use-add-product";

export type StandardCatalogItem = {
	id: string;
	name: string;
	category: string;
	inStockQty: number;
	unit: string;
	imageSrc: string;
};

export const recipeBuilderCategoryOptions = [
	"Milk Tea",
	"Fruit Tea",
	"Coffee",
	"Frappe",
	"Snacks",
];

export const standardItemCategoryOptions = [
	"all",
	"Food",
	"Beverages",
	"Supplies",
];

export const standardCatalogItems: StandardCatalogItem[] = [
	{
		id: "catalog-black-forest-cake",
		name: "Black Forest Cake",
		category: "Food",
		inStockQty: 14,
		unit: "pcs",
		imageSrc: "/image-placeholder.png",
	},
	{
		id: "catalog-signature-milk-tea",
		name: "Signature Milk Tea",
		category: "Beverages",
		inStockQty: 32,
		unit: "cups",
		imageSrc: "/image-placeholder.png",
	},
	{
		id: "catalog-lemon-fruit-tea",
		name: "Lemon Fruit Tea",
		category: "Beverages",
		inStockQty: 19,
		unit: "cups",
		imageSrc: "/image-placeholder.png",
	},
	{
		id: "catalog-paper-cup-16oz",
		name: "Paper Cup 16oz",
		category: "Supplies",
		inStockQty: 120,
		unit: "pcs",
		imageSrc: "/image-placeholder.png",
	},
	{
		id: "catalog-cheesecake-slice",
		name: "Cheesecake Slice",
		category: "Food",
		inStockQty: 8,
		unit: "pcs",
		imageSrc: "/image-placeholder.png",
	},
];

export const rawMaterialOptions: ProductRawMaterialOption[] = [
	{
		id: "rm-black-tea-leaves",
		name: "Black Tea Leaves",
		unit: "g",
	},
	{
		id: "rm-tapioca-pearls",
		name: "Tapioca Pearls",
		unit: "g",
	},
	{
		id: "rm-fresh-milk",
		name: "Fresh Milk",
		unit: "ml",
	},
	{
		id: "rm-brown-sugar-syrup",
		name: "Brown Sugar Syrup",
		unit: "ml",
	},
	{
		id: "rm-ice-cubes",
		name: "Ice Cubes",
		unit: "g",
	},
];
