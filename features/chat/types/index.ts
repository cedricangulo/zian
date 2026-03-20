export interface ChatMessage {
	id: string;
	role: "user" | "assistant";
	content: string;
}

export type ChatUserRole = "Owner" | "Staff";

export type ChatTemplateId = "cafe" | "motor-parts" | "hardware" | "milk-tea";

export interface ChatProfile {
	templateId: ChatTemplateId;
	name: string;
	role: ChatUserRole;
	businessName: string;
	businessType: string;
	location: string;
	businessContext: string;
}

export interface ChatRequestMessage {
	role: string;
	content: string;
}

export interface ChatRequestPayload {
	messages: ChatRequestMessage[];
	chatProfile?: Partial<ChatProfile>;
}
