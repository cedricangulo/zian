import { MODEL_NAME, ollama } from "@/lib/ollama";
import { getZianSystemPromptForQuery } from "@/lib/zian-context";
import type { ChatRequestPayload } from "@/features/chat/types";
import {
	normalizeChatProfile,
} from "@/features/chat/profile-presets";
import { auth } from "@clerk/nextjs/server";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
	const { userId } = await auth();
	if (!userId) {
		return Response.json({ error: "Unauthorized" }, { status: 401 });
	}

	const { messages, chatProfile } = (await req.json()) as ChatRequestPayload;
	const safeProfile = normalizeChatProfile(chatProfile);
	const latestUserMessage = [...messages]
		.reverse()
		.find(
			(msg: { role: string; content: string }) =>
				msg.role === "user" && typeof msg.content === "string",
		);

	// Prepare messages with system prompt
	const systemPrompt = getZianSystemPromptForQuery(
		latestUserMessage?.content ?? "",
		safeProfile,
	);
	const allMessages = [
		{ role: "system" as const, content: systemPrompt },
		...messages,
	];

	// Convert to format expected by Ollama
	const ollamaMessages = allMessages.map(
		(msg: { role: string; content: string }) => ({
			role: msg.role,
			content: msg.content,
		}),
	);

	// Get streaming response from Ollama
	const response = await ollama.chat({
		model: MODEL_NAME,
		messages: ollamaMessages,
		stream: true,
	});

	// Create a ReadableStream from the Ollama response
	const encoder = new TextEncoder();
	const readableStream = new ReadableStream({
		async start(controller) {
			try {
				for await (const chunk of response) {
					const content = chunk.message.content;
					if (content) {
						controller.enqueue(encoder.encode(content));
					}
				}
				controller.close();
			} catch (error) {
				controller.error(error);
			}
		},
	});

	return new Response(readableStream, {
		headers: {
			"Content-Type": "text/plain; charset=utf-8",
		},
	});
}
