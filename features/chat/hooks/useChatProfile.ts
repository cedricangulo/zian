"use client";

import { useEffect, useState } from "react";
import {
	CHAT_PROFILE_STORAGE_KEY,
	createChatProfile,
	normalizeChatProfile,
} from "../profile-presets";
import type { ChatProfile, ChatTemplateId } from "../types";

function readStoredProfile(): ChatProfile | null {
	if (typeof window === "undefined") {
		return null;
	}

	try {
		const storedValue = window.localStorage.getItem(CHAT_PROFILE_STORAGE_KEY);
		if (!storedValue) {
			return null;
		}

		const parsedValue = JSON.parse(storedValue) as Partial<ChatProfile>;
		return normalizeChatProfile(parsedValue);
	} catch {
		return null;
	}
}

export function useChatProfile() {
	const [profile, setProfile] = useState<ChatProfile>(createChatProfile());
	const [isReady, setIsReady] = useState(false);

	useEffect(() => {
		const storedProfile = readStoredProfile();
		if (storedProfile) {
			setProfile(storedProfile);
		}

		setIsReady(true);
	}, []);

	useEffect(() => {
		if (!isReady || typeof window === "undefined") {
			return;
		}

		window.localStorage.setItem(
			CHAT_PROFILE_STORAGE_KEY,
			JSON.stringify(profile),
		);
	}, [isReady, profile]);

	const setTemplate = (templateId: ChatTemplateId) => {
		setProfile(createChatProfile(templateId));
	};

	return {
		profile,
		setTemplate,
	};
}
