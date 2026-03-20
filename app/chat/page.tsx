"use client";

import {
	ChatForm,
	ChatHeader,
	ChatMessages,
	useChat,
	useChatProfile,
} from "@/features/chat";

export default function ChatPage() {
	const { profile, setTemplate } = useChatProfile();
	const { messages, input, setInput, isLoading, handleSubmit, messagesEndRef } =
		useChat(profile);

	return (
		<div className="relative flex flex-col h-dvh bg-background">
			<ChatHeader profile={profile} onSelectTemplate={setTemplate} />
			<ChatMessages messages={messages} messagesEndRef={messagesEndRef} />
			<div className="absolute left-0 right-0 z-20 w-full h-12 max-w-3xl mx-auto bottom-31 bg-linear-to-t from-background to-transparent" />
			<ChatForm
				input={input}
				onInputChange={setInput}
				onSubmit={handleSubmit}
				isLoading={isLoading}
			/>
		</div>
	);
}
