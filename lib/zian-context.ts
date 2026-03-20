import type { ChatProfile } from "@/features/chat/types";
import { normalizeChatProfile } from "@/features/chat/profile-presets";

type KnowledgeChunkId =
	| "overview"
	| "dispatch"
	| "fefo"
	| "recipes"
	| "bi"
	| "troubleshooting";

type BusinessChunkId =
	| "profile"
	| "inventory"
	| "alerts"
	| "actions"
	| "risks"
	| "recipes";

export type PromptUserRole = "Owner" | "Staff";

type LanguageMode = "english" | "filipino" | "taglish";
type ResponseFormatMode = "standard" | "inventory_table";

export const ZIAN_SUMMARY = `
SYSTEM: ZIAN is cloud inventory management for micro-enterprises (1-10 staff, single branch, under PHP 3M assets).
NOT_POS: ZIAN is not a POS and does not track sales, revenue, tax, or discounts.
CORE: Stock Dispatch deducts inventory; FEFO prioritizes earliest expiry batches; Recipe/BOM deducts ingredient components automatically.
BI: Asset valuation, low stock alerts, expiry alerts, dead stock analysis (90+ days no movement).
ROLES: Owner has full access; Staff mainly handles dispatch based on permissions.
BATCH_FIELDS: batch_number, cost_price, quantity, expiry_date, received_date.
WORKFLOW: setup catalog, daily dispatch, weekly alerts review, monthly physical count.
`;

export const ZIAN_KNOWLEDGE_CHUNKS: Record<KnowledgeChunkId, string> = {
	overview: `
OVERVIEW: ZIAN helps business owners manage stock movement accurately and avoid waste. Core domain is inventory operations, not checkout or accounting.
FIT: Works well for hardware, motor parts, cafe, and milk tea operations.
`,
	dispatch: `
DISPATCH: Staff releases items through Stock Dispatch. System creates a dispatch slip and deducts inventory immediately.
USE_CASE: For simple inventory movement where one item release deducts the same item quantity.
`,
	fefo: `
FEFO: Inventory is tracked by batches. Each release should consume the batch with earliest expiry first.
VALUE: FEFO reduces spoilage, supports food safety practices, and improves stock utilization.
`,
	recipes: `
RECIPE_BOM: Composite products use recipe deduction. Releasing one sellable item deducts multiple ingredients automatically.
VALUE: Ensures ingredient-level accuracy for cafe and milk tea operations.
`,
	bi: `
BI: Monitor total asset valuation, low stock, expiry risk, and dead stock.
DEAD_STOCK: Items with no movement for 90+ days indicate tied-up capital and possible assortment issues.
`,
	troubleshooting: `
TROUBLESHOOTING: Damaged goods or missed dispatch can be corrected using stock adjustments and proper batch updates.
CONTROL: Review transaction history and audit trails for accountability and discrepancy checks.
`,
};

export const ZIAN_BUSINESS_CHUNKS: Record<BusinessChunkId, string> = {
	profile: `
BUSINESS: Warm Brew Cafe, milk tea shop in Makati, operating since Dec 2024, team size 6.
TRAFFIC: Typical daily footfall 100-150 customers. Top drinks include Classic Milk Tea and Brown Sugar Boba.
`,
	inventory: `
INVENTORY_SNAPSHOT: 25 products, 12 active batches, 3 recipes.
ASSET_VALUE: PHP 2847.50 current inventory value based on cost x remaining quantity.
HEALTH_SCORE: 62/100 due to expiry risk, low-stock gaps, and slow movers.
`,
	alerts: `
ALERTS: 1 critical, 4 high, 3 medium, 2 low.
LOW_STOCK: Oolong tea is near-out, 16oz cup packs are near-out, hazelnut syrup is low.
EXPIRY: Fresh milk expires on Mar 20, 2026. Hazelnut syrup expires on Mar 25, 2026.
EXPIRED: Honey and vanilla syrup have already expired.
`,
	actions: `
IMMEDIATE_ACTIONS: Reorder oolong tea and 16oz cups now. Prioritize consumption of near-expiry milk using FEFO.
THIS_WEEK: Run focused drink promos to consume hazelnut syrup before expiry.
THIS_MONTH: Tighten ordering cadence for milk and cups based on usage velocity.
`,
	risks: `
RISK_COST: Expired value is PHP 187 currently.
DEAD_STOCK: Red bean has no movement for 94 days. Matcha is slow-moving with only 1 unit sold in 94 days.
OPERATING_RISK: Cup stockout can disrupt service despite healthy demand.
`,
	recipes: `
RECIPE_CONTEXT: Classic Milk Tea and Brown Sugar Boba depend on black/oolong tea, milk/cream, sugar, and tapioca pearls.
OPTIMIZATION: Track ingredient-level usage to align purchase volumes with actual drink mix.
`,
};

const COMPLEX_QUERY_KEYWORDS = [
	"prioritize",
	"optimize",
	"analyze",
	"analysis",
	"strategy",
	"forecast",
	"predict",
	"trend",
	"risk",
	"recommend",
	"recommendation",
	"plan",
	"week",
	"month",
	"quarter",
	"root cause",
	"why",
];

const CHUNK_KEYWORDS: Array<{ id: KnowledgeChunkId; keywords: string[] }> = [
	{
		id: "dispatch",
		keywords: ["dispatch", "release", "deduct", "slip", "movement"],
	},
	{
		id: "fefo",
		keywords: ["fefo", "batch", "expiry", "expired", "expiring", "date"],
	},
	{
		id: "recipes",
		keywords: ["recipe", "bom", "ingredient", "milk tea", "drink"],
	},
	{
		id: "bi",
		keywords: [
			"report",
			"alert",
			"dead stock",
			"valuation",
			"asset",
			"low stock",
		],
	},
	{
		id: "troubleshooting",
		keywords: ["adjust", "damage", "damaged", "error", "discrepancy", "audit"],
	},
	{
		id: "overview",
		keywords: ["what is", "about", "overview", "zian", "system"],
	},
];

const BUSINESS_CHUNK_KEYWORDS: Array<{
	id: BusinessChunkId;
	keywords: string[];
}> = [
	{
		id: "alerts",
		keywords: [
			"priority",
			"prioritize",
			"urgent",
			"low stock",
			"expiry",
			"expired",
			"alert",
		],
	},
	{
		id: "inventory",
		keywords: ["inventory", "stock", "asset", "value", "valuation", "health"],
	},
	{
		id: "actions",
		keywords: [
			"next move",
			"what should",
			"what now",
			"action",
			"reorder",
			"plan",
		],
	},
	{
		id: "risks",
		keywords: ["risk", "waste", "dead stock", "slow", "loss", "losing"],
	},
	{
		id: "recipes",
		keywords: ["recipe", "ingredient", "bom", "drink mix", "menu"],
	},
	{ id: "profile", keywords: ["business", "cafe", "shop", "owner"] },
];

function normalizeQuery(userQuery: string): string {
	return userQuery.trim().toLowerCase();
}

function detectLanguageMode(userQuery: string): LanguageMode {
	const query = normalizeQuery(userQuery);
	if (!query) return "english";

	const filipinoKeywords = [
		"ano",
		"paano",
		"bakit",
		"kailangan",
		"pwede",
		"saan",
		"kailan",
		"ako",
		"natin",
		"namin",
		"naku",
		"po",
		"opo",
		"uunahin",
		"ito",
		"iyan",
		"mo",
		"ba",
		"ng",
	];

	const englishKeywords = [
		"what",
		"how",
		"why",
		"when",
		"where",
		"should",
		"could",
		"inventory",
		"stock",
		"priority",
		"week",
		"month",
		"damage",
		"adjustment",
		"report",
	];

	const filipinoCount = filipinoKeywords.filter((keyword) =>
		query.includes(keyword),
	).length;
	const englishCount = englishKeywords.filter((keyword) =>
		query.includes(keyword),
	).length;

	if (filipinoCount > 0 && englishCount > 0) return "taglish";
	if (filipinoCount > englishCount) return "filipino";
	return "english";
}

function getLanguageDirective(languageMode: LanguageMode): string {
	if (languageMode === "filipino") {
		return "Respond in Filipino with natural everyday wording. Use po/opo. Keep technical terms in clear English when needed.";
	}

	if (languageMode === "taglish") {
		return "Respond in Taglish, matching the user's mixed style naturally. Use po/opo where it fits.";
	}

	return "Respond in English. Keep tone clear, warm, and practical.";
}

function getRoleDirective(role: PromptUserRole): string {
	if (role === "Owner") {
		return "Prioritize strategic guidance, risk impact, and financial tradeoffs while still giving one immediate action.";
	}

	return "Prioritize operational execution steps for daily tasks like dispatch, adjustments, and batch handling.";
}

function detectResponseFormatMode(userQuery: string): ResponseFormatMode {
	const query = normalizeQuery(userQuery);
	if (!query) return "standard";

	const inventoryTableKeywords = [
		"inventory",
		"status",
		"stock",
		"prioritize",
		"priority",
		"this week",
		"expiring",
		"expired",
		"low stock",
		"dead stock",
		"action needed",
		"ano uunahin",
		"ano dapat unahin",
		"week",
	];

	return hasAnyKeyword(query, inventoryTableKeywords)
		? "inventory_table"
		: "standard";
}

function getFormatDirective(formatMode: ResponseFormatMode): string {
	if (formatMode === "inventory_table") {
		return `
OUTPUT MODE: INVENTORY_TABLE
1) Start with 1-2 short sentences.
2) Then output a REQUIRED markdown table.
3) Use this exact header: | Product | Status | Quantity | Expiry Date | Action Needed |
4) Add markdown separator row exactly after header.
5) Put each data row on its own new line, never in one paragraph.
6) Include at least 4 data rows when inventory context is available.
7) No bullet list before or after the table.
8) Keep table values concise and operational.
`;
	}

	return `
OUTPUT MODE: STANDARD
Keep answer concise, direct, and natural for chat.
Do not add markdown tables unless explicitly needed.
`;
}

function hasAnyKeyword(query: string, keywords: string[]): boolean {
	return keywords.some((keyword) => query.includes(keyword));
}

function uniqueJoin(parts: string[]): string {
	return [...new Set(parts.filter(Boolean))].join("\n").trim();
}

export function isComplexQuery(userQuery: string): boolean {
	const query = normalizeQuery(userQuery);
	if (!query) return false;
	return hasAnyKeyword(query, COMPLEX_QUERY_KEYWORDS);
}

export function getRelevantKnowledgeContext(userQuery: string): string {
	const query = normalizeQuery(userQuery);
	if (!query) {
		return uniqueJoin([
			ZIAN_KNOWLEDGE_CHUNKS.overview,
			ZIAN_KNOWLEDGE_CHUNKS.bi,
		]);
	}

	const selected = CHUNK_KEYWORDS.filter((entry) =>
		hasAnyKeyword(query, entry.keywords),
	).map((entry) => ZIAN_KNOWLEDGE_CHUNKS[entry.id]);

	if (selected.length === 0) {
		return uniqueJoin([
			ZIAN_KNOWLEDGE_CHUNKS.overview,
			ZIAN_KNOWLEDGE_CHUNKS.bi,
		]);
	}

	if (!selected.includes(ZIAN_KNOWLEDGE_CHUNKS.overview)) {
		selected.unshift(ZIAN_KNOWLEDGE_CHUNKS.overview);
	}

	return uniqueJoin(selected);
}

export function getRelevantBusinessContext(userQuery: string): string {
	const query = normalizeQuery(userQuery);
	if (!query) {
		return uniqueJoin([
			ZIAN_BUSINESS_CHUNKS.profile,
			ZIAN_BUSINESS_CHUNKS.inventory,
			ZIAN_BUSINESS_CHUNKS.alerts,
			ZIAN_BUSINESS_CHUNKS.actions,
		]);
	}

	const selected = BUSINESS_CHUNK_KEYWORDS.filter((entry) =>
		hasAnyKeyword(query, entry.keywords),
	).map((entry) => ZIAN_BUSINESS_CHUNKS[entry.id]);

	if (selected.length === 0) {
		return uniqueJoin([
			ZIAN_BUSINESS_CHUNKS.profile,
			ZIAN_BUSINESS_CHUNKS.inventory,
			ZIAN_BUSINESS_CHUNKS.alerts,
		]);
	}

	if (!selected.includes(ZIAN_BUSINESS_CHUNKS.profile)) {
		selected.unshift(ZIAN_BUSINESS_CHUNKS.profile);
	}

	return uniqueJoin(selected);
}

export function buildZianContextForQuery(userQuery: string): string {
	const compactKnowledge = getRelevantKnowledgeContext(userQuery);
	const businessSlice = getRelevantBusinessContext(userQuery);

	if (!isComplexQuery(userQuery)) {
		return uniqueJoin([ZIAN_SUMMARY, compactKnowledge, businessSlice]);
	}

	return uniqueJoin([
		ZIAN_SUMMARY,
		compactKnowledge,
		businessSlice,
		ZIAN_KNOWLEDGE_CHUNKS.troubleshooting,
		ZIAN_BUSINESS_CHUNKS.risks,
	]);
}

export const ZIAN_KNOWLEDGE_BASE = uniqueJoin([
	ZIAN_SUMMARY,
	...Object.values(ZIAN_KNOWLEDGE_CHUNKS),
	...Object.values(ZIAN_BUSINESS_CHUNKS),
]);

/**
 * Get the complete ZIAN context as a formatted string
 * Used in system prompts to provide the AI with business knowledge
 */
export function getZianContext(): string {
	return ZIAN_KNOWLEDGE_BASE;
}

/**
 * Get a query-aware business-focused system prompt.
 */
export function getZianSystemPromptForQuery(
	userQuery: string,
	chatProfile?: Partial<ChatProfile>,
): string {
	const safeProfile = normalizeChatProfile(chatProfile);
	const languageMode = detectLanguageMode(userQuery);
	const responseFormatMode = detectResponseFormatMode(userQuery);
	const languageDirective = getLanguageDirective(languageMode);
	const formatDirective = getFormatDirective(responseFormatMode);
	const roleDirective = getRoleDirective(safeProfile.role);
	const queryContext = buildZianContextForQuery(userQuery);

	return `
You are the ZIAN Business Assistant. You are a professional, warm, and highly supportive partner for micro-enterprise owners. Your goal is to make inventory management feel easy and stress-free.

### ACTIVE CHAT PROFILE
TEMPLATE: ${safeProfile.templateId}
NAME: ${safeProfile.name}
ROLE: ${safeProfile.role}
BUSINESS NAME: ${safeProfile.businessName}
BUSINESS TYPE: ${safeProfile.businessType}
LOCATION: ${safeProfile.location}
BUSINESS CONTEXT: ${safeProfile.businessContext}

### LANGUAGE & TONE RULES
- Conversational English or Filipino: Use natural, everyday language. If the user writes in Filipino, respond in Filipino. If they write in English, respond in English. Code-switching is fine.
- Gender-Neutral: Avoid gendered terms like "pre," "lods," "sir," or "ma'am." Address the user as a partner or friend but do not use those exact labels.
- No Deep Filipino: Do not use formal words like "Maaari," "Nais," or "Gayunpaman".
- Simple & Direct: Use clear English for technical terms (Inventory, Batch, Stock). Keep responses to 2-3 short sentences.
- Always use po and opo when responding in Filipino to show respect, while keeping the tone friendly and approachable.

### STRICT FORMAT RULES
- NEVER use emojis.
- NEVER say "Gusto mo po ba", "Subukan mo ngayon", or "Maaari".
- Taglish is natural: "Check mo" not "I-check", "Tignan mo" not "Tingnan".
- Show empathy with "Naku", "Oof", "Gets ko yan", and avoid formal apologies.
- The nudge must be subtle and included naturally in the flow.

### STRATEGIC LOGIC
- Use only the provided context as source of truth.
- Do not hallucinate features. ZIAN has no Barcode/QR scanning and is not a POS.
- Focus on Batch Tracking, FEFO, and Stock Adjustments for practical problem solving.

### RESPONSE FLOW
- Give a direct answer first.
- Add one practical next move naturally in the same flow.
- Mirror the language style of the latest user message for this turn.
- Address the user naturally by name when useful: ${safeProfile.name}.

### THIS TURN BEHAVIOR
- Language mode for this turn: ${languageMode}.
- Response format mode for this turn: ${responseFormatMode}.
- ${languageDirective}
- ${roleDirective}

### OUTPUT CONTRACT
${formatDirective}

### SYSTEM KNOWLEDGE SUMMARY
${queryContext}
`;
}

/**
 * Backward-compatible system prompt for existing call sites.
 */
export function getZianSystemPrompt(): string {
	return getZianSystemPromptForQuery("");
}
