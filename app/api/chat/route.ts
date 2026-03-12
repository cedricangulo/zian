import { MODEL_NAME, ollama } from "@/lib/ollama";
import { getZianSystemPrompt } from "@/lib/zian-context";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
	const { messages } = await req.json();

	// Prepare messages with system prompt
	const systemPrompt = getZianSystemPrompt();
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
