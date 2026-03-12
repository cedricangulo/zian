"use client";

import {
	Conversation,
	ConversationContent,
	ConversationEmptyState,
	ConversationScrollButton,
	Message,
	MessageContent,
	MessageResponse,
	streamdownPlugins,
} from "@/components/ai-elements";
import { MessageCircleIcon } from "lucide-react";
import type { ChatMessage } from "../types";
import { useEffect } from "react";

interface ChatMessagesProps {
	messages: ChatMessage[];
	messagesEndRef?: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessages({ messages, messagesEndRef }: ChatMessagesProps) {
	useEffect(() => {
		messagesEndRef?.current?.scrollIntoView({ behavior: "smooth" });
	}, [messages]);

	return (
		<Conversation className="flex-1 max-w-3xl mx-auto w-full">
			{messages.length === 0 ? (
				<ConversationEmptyState
					icon={<MessageCircleIcon className="size-6" />}
					title="No messages yet"
					description="Start a conversation by typing a message below"
				/>
			) : (
				<ConversationContent>
					{messages.map((message) => (
						<Message key={message.id} from={message.role}>
							{message.role === "assistant" ? (
								<MessageResponse plugins={streamdownPlugins}>
									{message.content}
								</MessageResponse>
							) : (
								<MessageContent className="bg-accent">{message.content}</MessageContent>
							)}
						</Message>
					))}
					<div ref={messagesEndRef} />
				</ConversationContent>
			)}

			<ConversationScrollButton />
		</Conversation>
	);
}
