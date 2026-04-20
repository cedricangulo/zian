"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type Resolver, useForm } from "react-hook-form";

import { useOnboardingMutations } from "../api/use-onboarding-mutations";
import type { ProfileOnboardingInput } from "../types";
import { profileOnboardingSchema } from "../validation/profile-onboarding.schema";

const profileResolver = zodResolver(
	profileOnboardingSchema as never,
) as unknown as Resolver<ProfileOnboardingInput>;

export function useProfileOnboardingForm() {
	const router = useRouter();
	const { updateProfileSetup } = useOnboardingMutations();
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<ProfileOnboardingInput>({
		// Work around a known type-level mismatch between resolver typings and Zod v4 minors.
		resolver: profileResolver,
		defaultValues: {
			first_name: "",
			middle_name: "",
			last_name: "",
			contact_number: "",
		},
	});

	const onSubmit = form.handleSubmit(async (values) => {
		setSubmitError(null);
		setIsSubmitting(true);

		try {
			await updateProfileSetup({
				first_name: values.first_name,
				middle_name: values.middle_name?.trim() || undefined,
				last_name: values.last_name,
				contact_number: values.contact_number,
				sex: values.sex,
			});
			router.push("/onboarding/business");
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Unable to save your profile details right now.";
			setSubmitError(message);
		} finally {
			setIsSubmitting(false);
		}
	});

	return {
		form,
		onSubmit,
		isSubmitting,
		submitError,
	};
}
