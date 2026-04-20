"use client";

import { ArrowRight } from "lucide-react";
import { Controller } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { PROFILE_SEX_OPTIONS } from "../data/options";
import { useProfileOnboardingForm } from "../hooks";

function errorToArray(errorMessage: string | undefined) {
	return errorMessage ? [{ message: errorMessage }] : undefined;
}

export function ProfileOnboardingForm() {
	const { form, onSubmit, isSubmitting, submitError } =
		useProfileOnboardingForm();
	const {
		register,
		control,
		formState: { errors },
	} = form;

	return (
		<main className="space-y-6">
			<div className="max-w-prose mx-auto text-center">
				<h2 className="type-lg">Set up your Profile Details</h2>
				<p className="type-base text-muted-foreground">
					Tell us a bit about your business so we can tailor your dashboard. It
					only takes a minute to move your inventory from your notebook to the
					cloud.
				</p>
			</div>
			<form id="onboarding-profile-form" onSubmit={onSubmit}>
				<Card>
					<CardContent>
						<FieldGroup className="grid grid-cols-3 gap-6">
							<Field data-invalid={Boolean(errors.first_name) || undefined}>
								<FieldLabel htmlFor="first-name">First Name</FieldLabel>
								<Input
									id="first-name"
									placeholder="John"
									aria-invalid={Boolean(errors.first_name)}
									{...register("first_name")}
								/>
								<FieldError errors={errorToArray(errors.first_name?.message)} />
							</Field>

							<Field>
								<FieldLabel htmlFor="middle-name">Middle Name</FieldLabel>
								<Input
									id="middle-name"
									placeholder="M"
									{...register("middle_name")}
								/>
							</Field>

							<Field data-invalid={Boolean(errors.last_name) || undefined}>
								<FieldLabel htmlFor="last-name">Last Name</FieldLabel>
								<Input
									id="last-name"
									placeholder="Doe"
									aria-invalid={Boolean(errors.last_name)}
									{...register("last_name")}
								/>
								<FieldError errors={errorToArray(errors.last_name?.message)} />
							</Field>

							<Field data-invalid={Boolean(errors.sex) || undefined}>
								<FieldLabel htmlFor="sex">Sex</FieldLabel>
								<Controller
									name="sex"
									control={control}
									render={({ field }) => (
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger
												id="sex"
												aria-invalid={Boolean(errors.sex)}
											>
												<SelectValue placeholder="Select sex" />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{PROFILE_SEX_OPTIONS.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															{option.label}
														</SelectItem>
													))}
												</SelectGroup>
											</SelectContent>
										</Select>
									)}
								/>
								<FieldError errors={errorToArray(errors.sex?.message)} />
							</Field>

							<Field data-invalid={Boolean(errors.contact_number) || undefined}>
								<FieldLabel htmlFor="contact-number">Contact Number</FieldLabel>
								<Input
									id="contact-number"
									placeholder="09171234567"
									aria-invalid={Boolean(errors.contact_number)}
									{...register("contact_number")}
								/>
								<FieldError
									errors={errorToArray(errors.contact_number?.message)}
								/>
							</Field>
						</FieldGroup>
						<FieldError
							errors={submitError ? [{ message: submitError }] : undefined}
						/>
					</CardContent>
					<CardFooter>
						<Button className="ml-auto" type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Saving..." : "Next Step"}
							<ArrowRight data-icon="inline-end" />
						</Button>
					</CardFooter>
				</Card>
			</form>
		</main>
	);
}
