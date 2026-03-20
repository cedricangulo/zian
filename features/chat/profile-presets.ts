import type { ChatProfile, ChatTemplateId } from "./types";

export interface ChatProfileTemplate extends ChatProfile {
	label: string;
}

export const CHAT_PROFILE_STORAGE_KEY = "zian.chat.profile";
export const DEFAULT_CHAT_TEMPLATE_ID: ChatTemplateId = "cafe";

export const CHAT_PROFILE_TEMPLATES: Record<ChatTemplateId, ChatProfileTemplate> = {
	cafe: {
		label: "Cafe",
		templateId: "cafe",
		name: "Cedric",
		role: "Staff",
		businessName: "Warm Brew Cafe",
		businessType: "Cafe",
		location: "Makati",
		businessContext:
			"Cafe context. Focus on drinks, milk, syrups, cups, ingredients, expiry control, and FEFO for perishables.",
	},
	"motor-parts": {
		label: "Motor Parts",
		templateId: "motor-parts",
		name: "Cedric",
		role: "Staff",
		businessName: "RiderPro Motor Parts",
		businessType: "Motor Parts Shop",
		location: "Quezon City",
		businessContext:
			"Motor parts context. Focus on fast-moving SKUs, batteries, oils, filters, reorder timing, and dead stock control.",
	},
	hardware: {
		label: "Hardware",
		templateId: "hardware",
		name: "Cedric",
		role: "Staff",
		businessName: "Steel & Fix Hardware",
		businessType: "Hardware Store",
		location: "Pasig",
		businessContext:
			"Hardware context. Focus on tools, nails, screws, fittings, bulky stock, reorder gaps, and stock accuracy.",
	},
	"milk-tea": {
		label: "Milk Tea",
		templateId: "milk-tea",
		name: "Cedric",
		role: "Staff",
		businessName: "Boba Lane Milk Tea",
		businessType: "Milk Tea Shop",
		location: "Makati",
		businessContext:
			"Milk tea context. Focus on tea bases, milk, syrups, toppings, cups, recipe deductions, and FEFO for perishables.",
	},
};

function sanitizeText(value: unknown): string | undefined {
	if (typeof value !== "string") {
		return undefined;
	}

	const trimmed = value.trim();
	return trimmed.length > 0 ? trimmed : undefined;
}

export function isChatTemplateId(value: unknown): value is ChatTemplateId {
	return value === "cafe" || value === "motor-parts" || value === "hardware" || value === "milk-tea";
}

export function getChatProfileTemplate(templateId?: unknown): ChatProfileTemplate {
	const safeTemplateId = isChatTemplateId(templateId) ? templateId : DEFAULT_CHAT_TEMPLATE_ID;
	return CHAT_PROFILE_TEMPLATES[safeTemplateId];
}

export function createChatProfile(templateId: ChatTemplateId = DEFAULT_CHAT_TEMPLATE_ID): ChatProfile {
	const template = CHAT_PROFILE_TEMPLATES[templateId];

	return {
		templateId: template.templateId,
		name: template.name,
		role: template.role,
		businessName: template.businessName,
		businessType: template.businessType,
		location: template.location,
		businessContext: template.businessContext,
	};
}

export function normalizeChatProfile(profile?: Partial<ChatProfile>): ChatProfile {
	const template = getChatProfileTemplate(profile?.templateId);

	return {
		templateId: template.templateId,
		name: sanitizeText(profile?.name) ?? template.name,
		role: profile?.role === "Owner" || profile?.role === "Staff" ? profile.role : template.role,
		businessName: sanitizeText(profile?.businessName) ?? template.businessName,
		businessType: sanitizeText(profile?.businessType) ?? template.businessType,
		location: sanitizeText(profile?.location) ?? template.location,
		businessContext: sanitizeText(profile?.businessContext) ?? template.businessContext,
	};
}
