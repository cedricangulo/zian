import { useRef, useState } from "react";
import type { ChatMessage } from "../types";
import { sendChatMessage } from "../api/chat-service";

export function useChat() {
	const [messages, setMessages] = useState<ChatMessage[]>([]);
	const [input, setInput] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
		e.preventDefault();

		if (!input.trim() || isLoading) return;

		// Add user message
		const userMessage: ChatMessage = {
			id: Date.now().toString(),
			role: "user",
			content: input,
		};

		setMessages((prev) => [...prev, userMessage]);
		setInput("");
		setIsLoading(true);

		try {
			// Get streaming response
			const reader = await sendChatMessage(
				[...messages, userMessage].map((msg) => ({
					role: msg.role,
					content: msg.content,
				}))
			).then((stream) => stream.getReader());

			const decoder = new TextDecoder();
			const assistantMessage: ChatMessage = {
				id: (Date.now() + 1).toString(),
				role: "assistant",
				content: "",
			};

			setMessages((prev) => [...prev, assistantMessage]);

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value, { stream: true });
				assistantMessage.content += chunk;

				setMessages((prev) => {
					const updatedMessages = [...prev];
					updatedMessages[updatedMessages.length - 1] = assistantMessage;
					return updatedMessages;
				});
			}
		} catch (error) {
			console.error("Error:", error);
			const errorMessage: ChatMessage = {
				id: (Date.now() + 2).toString(),
				role: "assistant",
				content:
					"Sorry, there was an error processing your request. Please try again.",
			};
			setMessages((prev) => [...prev, errorMessage]);
		} finally {
			setIsLoading(false);
		}
	};

	return {
		messages,
		input,
		setInput,
		isLoading,
		handleSubmit,
		messagesEndRef,
	};
}
