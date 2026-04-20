"use client";

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

import { BUSINESS_AGE_RANGE_OPTIONS } from "../data/options";
import { useBusinessOnboardingForm } from "../hooks";
import { BusinessSectorCombobox } from "./business-sector-combobox";

function errorToArray(errorMessage: string | undefined) {
	return errorMessage ? [{ message: errorMessage }] : undefined;
}

export function BusinessOnboardingForm() {
	const { form, onSubmit, isSubmitting, submitError, selectedLogoName } =
		useBusinessOnboardingForm();
	const {
		register,
		control,
		formState: { errors },
	} = form;

	return (
		<main className="space-y-6">
			<div className="max-w-prose mx-auto text-center">
				<h2 className="type-lg">Set up your Business Profile</h2>
				<p className="type-base text-muted-foreground">
					Tell us a bit about your business so we can tailor your dashboard. It
					only takes a minute to move your inventory from your notebook to the
					cloud.
				</p>
			</div>
			<form id="onboarding-business-form" onSubmit={onSubmit}>
				<Card>
					<CardContent>
						<FieldGroup className="grid grid-cols-3 gap-6">
							<Field data-invalid={Boolean(errors.business_name) || undefined}>
								<FieldLabel htmlFor="business-name">Business Name</FieldLabel>
								<Input
									id="business-name"
									placeholder="Zian Mini Mart"
									aria-invalid={Boolean(errors.business_name)}
									{...register("business_name")}
								/>
								<FieldError
									errors={errorToArray(errors.business_name?.message)}
								/>
							</Field>

							<Field
								data-invalid={Boolean(errors.business_sector) || undefined}
							>
								<FieldLabel htmlFor="business-sector">
									Business Sector
								</FieldLabel>
								<Controller
									name="business_sector"
									control={control}
									render={({ field }) => (
										<BusinessSectorCombobox
											id="business-sector"
											value={field.value}
											onValueChange={field.onChange}
											disabled={isSubmitting}
											invalid={Boolean(errors.business_sector)}
										/>
									)}
								/>
								<FieldError
									errors={errorToArray(errors.business_sector?.message)}
								/>
							</Field>

							<Field data-invalid={Boolean(errors.business_type) || undefined}>
								<FieldLabel htmlFor="business-type">Business Type</FieldLabel>
								<Input
									id="business-type"
									placeholder="Cafe"
									aria-invalid={Boolean(errors.business_type)}
									{...register("business_type")}
								/>
								<FieldError
									errors={errorToArray(errors.business_type?.message)}
								/>
							</Field>

							<Field
								data-invalid={Boolean(errors.business_age_range) || undefined}
							>
								<FieldLabel htmlFor="business-age">Business Age</FieldLabel>
								<Controller
									name="business_age_range"
									control={control}
									render={({ field }) => (
										<Select value={field.value} onValueChange={field.onChange}>
											<SelectTrigger
												id="business-age"
												aria-invalid={Boolean(errors.business_age_range)}
											>
												<SelectValue placeholder="Select business age" />
											</SelectTrigger>
											<SelectContent>
												<SelectGroup>
													{BUSINESS_AGE_RANGE_OPTIONS.map((option) => (
														<SelectItem key={option.value} value={option.value}>
															{option.label}
														</SelectItem>
													))}
												</SelectGroup>
											</SelectContent>
										</Select>
									)}
								/>
								<FieldError
									errors={errorToArray(errors.business_age_range?.message)}
								/>
							</Field>

							<Field>
								<FieldLabel htmlFor="logo">Logo</FieldLabel>
								<Input
									id="logo"
									type="file"
									accept="image/*"
									{...register("logo_file")}
								/>
								{selectedLogoName ? (
									<p className="text-xs text-muted-foreground">
										Selected: {selectedLogoName}
									</p>
								) : null}
							</Field>

							<Field
								data-invalid={Boolean(errors.business_address) || undefined}
							>
								<FieldLabel htmlFor="business-address">
									Business Address
								</FieldLabel>
								<Input
									id="business-address"
									placeholder="123 Main St, City"
									aria-invalid={Boolean(errors.business_address)}
									{...register("business_address")}
								/>
								<FieldError
									errors={errorToArray(errors.business_address?.message)}
								/>
							</Field>
						</FieldGroup>
						<FieldError
							errors={submitError ? [{ message: submitError }] : undefined}
						/>
					</CardContent>
					<CardFooter>
						<Button className="ml-auto" type="submit" disabled={isSubmitting}>
							{isSubmitting ? "Saving..." : "Complete Setup"}
						</Button>
					</CardFooter>
				</Card>
			</form>
		</main>
	);
}
