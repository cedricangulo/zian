export async function sendChatMessage(
	messages: Array<{ role: string; content: string }>
): Promise<ReadableStream<Uint8Array>> {
	const response = await fetch("/api/chat", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify({ messages }),
	});

	if (!response.ok) {
		throw new Error(`HTTP error! status: ${response.status}`);
	}

	const reader = response.body;
	if (!reader) {
		throw new Error("No response body");
	}

	return reader;
}
