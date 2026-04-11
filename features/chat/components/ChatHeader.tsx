"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { ChatProfile, ChatTemplateId } from "../types";
import { CHAT_PROFILE_TEMPLATES } from "../profile-presets";
import {
  Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@/components/ui/field";
import { ModeToggle } from "@/components/mode-toggle";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useState } from "react";

interface ChatHeaderProps {
	profile: ChatProfile;
	onSelectTemplate: (templateId: ChatTemplateId) => void;
}

export function ChatHeader({ profile, onSelectTemplate }: ChatHeaderProps) {
	const [open, setOpen] = useState(false);
	const activeTemplate = CHAT_PROFILE_TEMPLATES[profile.templateId];

	return (
		<div className="border-b border-border bg-card px-4 py-4">
			<div className="flex items-start justify-between gap-3">
				<div className="min-w-0 flex flex-col gap-1">
					<h1 className="type-lg">Business Intelligence Chat</h1>
					<p className="type-sm text-muted-foreground">
						Ask questions and get insights powered by AI
					</p>
					<div className="mt-1 flex flex-wrap items-center gap-2">
						<Badge variant="secondary">{activeTemplate.label}</Badge>
						<span className="type-xs text-muted-foreground">
							{profile.businessName}
						</span>
					</div>
				</div>
				<div className="flex shrink-0 items-center gap-2">
					<Button variant="outline" onClick={() => setOpen(true)}>
						Change context
					</Button>
					<ModeToggle />
				</div>
			</div>

			<Dialog open={open} onOpenChange={setOpen}>
				<DialogContent className="sm:max-w-2xl">
					<DialogHeader>
						<DialogTitle>Choose a business template</DialogTitle>
						<DialogDescription>
							Pick a preset. The choice saves immediately and updates the chat
							profile.
						</DialogDescription>
					</DialogHeader>

					<RadioGroup
						className="grid gap-3 sm:grid-cols-2"
						value={profile.templateId}
						onValueChange={(value) => {
							onSelectTemplate(value as ChatTemplateId);
							setOpen(false);
						}}
					>
						{Object.values(CHAT_PROFILE_TEMPLATES).map((template) => {
							const fieldId = `${template.templateId}-plan`;

							return (
								<FieldLabel key={template.templateId} htmlFor={fieldId}>
									<Field orientation="horizontal">
										<FieldContent>
											<FieldTitle>{template.label}</FieldTitle>
											<FieldDescription>
												{template.businessName}
											</FieldDescription>
											<FieldDescription>
												{template.businessType} - {template.location}
											</FieldDescription>
											<FieldDescription>
												{template.businessContext}
											</FieldDescription>
										</FieldContent>
										<RadioGroupItem value={template.templateId} id={fieldId} />
									</Field>
								</FieldLabel>
							);
						})}
					</RadioGroup>
				</DialogContent>
			</Dialog>
		</div>
	);
}
