export type StockAddMode = "existing" | "new";

export type ExistingStockDraft = {
	selectedItemId: string;
	itemName: string;
	search: string;
	category: string;
	batchCode: string;
	quantity: string;
	expiryDate: string;
	totalAssetValue: string;
};

export type NewStockDraft = {
	itemImageName: string;
	itemName: string;
	category: string;
	unit: string;
	supplier: string;
	sku: string;
	batchCode: string;
	quantity: string;
	hasExpiryDate: boolean;
	expiryDate: string;
	totalAssetValue: string;
};

export const initialExistingStockDraft: ExistingStockDraft = {
	selectedItemId: "",
	itemName: "",
	search: "",
	category: "all",
	batchCode: "",
	quantity: "",
	expiryDate: "",
	totalAssetValue: "",
};

export const initialNewStockDraft: NewStockDraft = {
	itemImageName: "",
	itemName: "",
	category: "",
	unit: "",
	supplier: "",
	sku: "",
	batchCode: "",
	quantity: "",
	hasExpiryDate: false,
	expiryDate: "",
	totalAssetValue: "",
};

export type ExistingStockItem = {
	id: string;
	name: string;
	category: string;
	inStockQty: number;
	imageSrc: string;
};
