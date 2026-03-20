import {
	PromptInput,
	PromptInputBody,
	PromptInputFooter,
	type PromptInputMessage,
	PromptInputSubmit,
	PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";

interface ChatFormProps {
	input: string;
	onInputChange: (value: string) => void;
	onSubmit: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
	isLoading: boolean;
}

export function ChatForm({
	input,
	onInputChange,
	onSubmit,
	isLoading,
}: ChatFormProps) {
	const handlePromptSubmit = (
		_message: PromptInputMessage,
		event: React.FormEvent<HTMLFormElement>,
	) => {
		onSubmit(event);
	};

	return (
		<PromptInput
			onSubmit={handlePromptSubmit}
			className="max-w-3xl mx-auto mb-4 z-30"
			globalDrop
			multiple
		>
			<PromptInputBody>
				<PromptInputTextarea
					onChange={(e) => onInputChange(e.target.value)}
					value={input}
					placeholder="Ask anything about your data..."
				/>
			</PromptInputBody>
			<PromptInputFooter>
				<PromptInputSubmit
					className="ml-auto"
					disabled={!input.trim() || isLoading}
				/>
			</PromptInputFooter>
		</PromptInput>
	);
}
