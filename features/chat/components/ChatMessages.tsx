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
import { CopyIcon, MessageCircleIcon } from "lucide-react";
import type { ChatMessage } from "../types";
import { MessageAction } from "@/components/ai-elements/message";

interface ChatMessagesProps {
	messages: ChatMessage[];
	messagesEndRef?: React.RefObject<HTMLDivElement | null>;
}

export function ChatMessages({ messages, messagesEndRef }: ChatMessagesProps) {
	return (
		<Conversation className="flex-1">
			{messages.length === 0 ? (
				<ConversationEmptyState
					icon={<MessageCircleIcon className="size-6" />}
					title="No messages yet"
					description="Start a conversation by typing a message below"
				/>
			) : (
				<ConversationContent className="max-w-3xl mx-auto w-full">
					{messages.map((message) => (
						<Message key={message.id} from={message.role}>
							{message.role === "assistant" ? (
								<MessageResponse plugins={streamdownPlugins}>
									{message.content}
								</MessageResponse>
							) : (
								<MessageContent>{message.content}</MessageContent>
							)}
							{message.role === "assistant" && (
								<MessageAction
									onClick={() => navigator.clipboard.writeText(message.content)}
									label="Copy"
								>
									<CopyIcon className="size-3" />
								</MessageAction>
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
