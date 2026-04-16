export type DashboardKpi = {
	label: string;
	value: string;
	description?: string;
};

export type StockEfficiencyDatum = {
	category:
		| "fefo_batches_used"
		| "batches_near_expiry"
		| "low_stock_items"
		| "stable_stock"
		| "dead_stock";
	label: string;
	value: number;
	fill: string;
};

export type DispatchHistoryDatum = {
	month: string;
	dispatches: number;
};

export const stockEfficiencyChartConfig = {
	fefo_batches_used: {
		label: "FEFO batches used",
		color: "var(--chart-1)",
	},
	batches_near_expiry: {
		label: "Batches near expiry",
		color: "var(--chart-2)",
	},
	low_stock_items: {
		label: "Low stock items",
		color: "var(--chart-3)",
	},
	stable_stock: {
		label: "Stable stock",
		color: "var(--chart-4)",
	},
	dead_stock: {
		label: "Dead stock",
		color: "var(--chart-5)",
	},
} as const;

export const dispatchHistoryChartConfig = {
	dispatches: {
		label: "Dispatches",
		color: "var(--chart-3)",
	},
} as const;

export const dashboardKpis: DashboardKpi[] = [
	{
		label: "Total asset value",
		value: "₱128,400",
	},
	{
		label: "Total dispatch value",
		value: "₱34,800",
	},
	{
		label: "Manual adjustments",
		value: "7 logs",
	},
];

export const stockEfficiencyData: StockEfficiencyDatum[] = [
	{
		category: "fefo_batches_used",
		label: "FEFO batches used",
		value: 74,
		fill: "var(--chart-1)",
	},
	{
		category: "batches_near_expiry",
		label: "Batches near expiry",
		value: 18,
		fill: "var(--chart-2)",
	},
	{
		category: "low_stock_items",
		label: "Low stock items",
		value: 8,
		fill: "var(--chart-3)",
	},
	{
		category: "stable_stock",
		label: "Stable stock",
		value: 54,
		fill: "var(--chart-4)",
	},
	{
		category: "dead_stock",
		label: "Dead stock",
		value: 12,
		fill: "var(--chart-5)",
	},
];

export const dispatchHistoryData: DispatchHistoryDatum[] = [
	{ month: "Jan", dispatches: 186 },
	{ month: "Feb", dispatches: 305 },
	{ month: "Mar", dispatches: 237 },
	{ month: "Apr", dispatches: 73 },
	{ month: "May", dispatches: 209 },
	{ month: "Jun", dispatches: 214 },
];

export const dispatchActivity = [
	{
		date: "2026-04-16",
		movementType: "dispatch",
		productName: "Tea Base 1L",
		quantity: 12,
		batchCode: "BATCH-TEA-042",
		reason: "recipe_consumption",
	},
	{
		date: "2026-04-16",
		movementType: "adjustment",
		productName: "Milk Powder 500g",
		quantity: -2,
		batchCode: "BATCH-MILK-019",
		reason: "spoilage",
	},
	{
		date: "2026-04-15",
		movementType: "inbound",
		productName: "Cup Lids 12oz",
		quantity: 240,
		batchCode: "BATCH-LID-113",
		reason: "purchase",
	},
	{
		date: "2026-04-15",
		movementType: "dispatch",
		productName: "Burger Bun",
		quantity: 48,
		batchCode: "BATCH-BUN-087",
		reason: "sale",
	},
];

export const activeBatches = [
	{
		productName: "Tea Base 1L",
		batchCode: "BATCH-TEA-042",
		remainingQty: 36,
		expiryDate: "2026-04-20",
		status: "expiring",
	},
	{
		productName: "Milk Powder 500g",
		batchCode: "BATCH-MILK-019",
		remainingQty: 18,
		expiryDate: "2026-05-02",
		status: "good",
	},
	{
		productName: "Burger Bun",
		batchCode: "BATCH-BUN-087",
		remainingQty: 64,
		expiryDate: "2026-04-18",
		status: "expiring",
	},
];