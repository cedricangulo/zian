"use client";

import { ChatHeader, ChatMessages, ChatForm, useChat } from "@/features/chat";

export default function ChatPage() {
	const { messages, input, setInput, isLoading, handleSubmit, messagesEndRef } =
		useChat();

	return (
		<div className="flex h-dvh flex-col bg-background">
			<ChatHeader />
			<ChatMessages messages={messages} messagesEndRef={messagesEndRef} />
			<ChatForm
				input={input}
				onInputChange={setInput}
				onSubmit={handleSubmit}
				isLoading={isLoading}
			/>
		</div>
	);
}
