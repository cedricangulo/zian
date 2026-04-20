"use client";

import { useAuth, useOrganizationList } from "@clerk/nextjs";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { type Resolver, useForm, useWatch } from "react-hook-form";

import { useOnboardingMutations } from "../api/use-onboarding-mutations";
import type { BusinessOnboardingInput } from "../types";
import { businessOnboardingSchema } from "../validation/business-onboarding.schema";

const businessResolver = zodResolver(
	businessOnboardingSchema as never,
) as unknown as Resolver<BusinessOnboardingInput>;

type UploadResult = {
	storageId?: string;
};

export function useBusinessOnboardingForm() {
	const router = useRouter();
	const { orgId } = useAuth();
	const { isLoaded: isOrgListLoaded, createOrganization, setActive } =
		useOrganizationList();
	const {
		updateBusinessDetails,
		generateBusinessLogoUploadUrl,
		relinkPersonalOrgToClerkOrg,
	} = useOnboardingMutations();
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const form = useForm<BusinessOnboardingInput>({
		// Work around a known type-level mismatch between resolver typings and Zod v4 minors.
		resolver: businessResolver,
		defaultValues: {
			business_name: "",
			business_type: "",
			business_address: "",
			business_logo_file_id: "",
		},
	});

	const logoFile = useWatch({ control: form.control, name: "logo_file" });
	const selectedLogoName = logoFile?.item(0)?.name ?? null;

	const onSubmit = form.handleSubmit(async (values) => {
		setSubmitError(null);
		setIsSubmitting(true);

		try {
			let logoFileId = values.business_logo_file_id?.trim() || undefined;
			const logoFile = values.logo_file?.item(0);

			if (logoFile) {
				const uploadUrl = await generateBusinessLogoUploadUrl({});
				const uploadResponse = await fetch(uploadUrl, {
					method: "POST",
					headers: {
						"Content-Type": logoFile.type || "application/octet-stream",
					},
					body: logoFile,
				});

				if (!uploadResponse.ok) {
					throw new Error("Unable to upload business logo.");
				}

				const uploadResult = (await uploadResponse.json()) as UploadResult;
				if (!uploadResult.storageId) {
					throw new Error("Business logo upload did not return a storage id.");
				}

				logoFileId = uploadResult.storageId;
				form.setValue("business_logo_file_id", logoFileId, {
					shouldDirty: true,
				});
			}

			await updateBusinessDetails({
				business_name: values.business_name,
				business_sector: values.business_sector,
				business_type: values.business_type,
				business_age_range: values.business_age_range,
				business_address: values.business_address,
				business_logo_file_id: logoFileId,
			});

			// If no Clerk org is active yet, create one and relink the fallback personal org id.
			if (!orgId && isOrgListLoaded) {
				const createdOrganization = await createOrganization?.({
					name: values.business_name.trim(),
				});

				if (createdOrganization?.id) {
					await relinkPersonalOrgToClerkOrg({
						clerk_org_id: createdOrganization.id,
					});
					await setActive?.({ organization: createdOrganization.id });
				}
			}
			router.push("/dashboard");
		} catch (error) {
			const message =
				error instanceof Error
					? error.message
					: "Unable to save business details right now.";
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
		selectedLogoName,
	};
}
