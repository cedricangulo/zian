"use client";

import { useAuth, useSignUp } from "@clerk/nextjs";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldGroup, FieldSet } from "@/components/ui/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
} from "@/components/ui/input-group";

function getClerkErrorMessage(error: unknown, fallback: string) {
	if (
		typeof error === "object" &&
		error !== null &&
		"message" in error &&
		typeof error.message === "string"
	) {
		return error.message;
	}

	if (
		typeof error === "object" &&
		error !== null &&
		"longMessage" in error &&
		typeof error.longMessage === "string"
	) {
		return error.longMessage;
	}

	if (error instanceof Error) {
		return error.message;
	}

	return fallback;
}

export default function SignUpPage() {
	const { isLoaded, isSignedIn } = useAuth();
	const { signUp, errors, fetchStatus } = useSignUp();
	const router = useRouter();
	const [emailAddress, setEmailAddress] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const isBusy = isSubmitting || fetchStatus === "fetching";

	useEffect(() => {
		if (isLoaded && isSignedIn) {
			router.replace("/post-auth");
		}
	}, [isLoaded, isSignedIn, router]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();

		if (isBusy) {
			return;
		}

		if (password !== confirmPassword) {
			setSubmitError("Passwords do not match.");
			return;
		}

		setSubmitError(null);
		setIsSubmitting(true);

		try {
			const { error } = await signUp.password({
				emailAddress: emailAddress.trim(),
				password,
			});

			if (error) {
				setSubmitError(
					getClerkErrorMessage(
						error,
						"Unable to create account. Please try again.",
					),
				);
				return;
			}

			if (signUp.status === "complete") {
				await signUp.finalize({
					navigate: ({ decorateUrl }) => {
						const url = decorateUrl("/post-auth");
						if (url.startsWith("http")) {
							window.location.href = url;
							return;
						}
						router.push(url);
					},
				});
				return;
			}

			const verificationResult = await signUp.verifications.sendEmailCode();
			if (verificationResult.error) {
				setSubmitError(
					getClerkErrorMessage(
						verificationResult.error,
						"Unable to send verification code. Please try again.",
					),
				);
				return;
			}

			router.push("/sign-up/verify");
		} catch (error) {
			setSubmitError(
				getClerkErrorMessage(
					error,
					"Unable to create account. Please try again.",
				),
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="grid gap-6 h-fit">
			<Button variant="ghost" size="icon" asChild>
				<Link href="/">
					<ArrowLeft />
				</Link>
			</Button>
			<div className="space-y-2">
				<h1 className="type-lg">ZIAN</h1>
				<p className="type-base">Start For Free</p>
			</div>
			<form id="sign-up-form" onSubmit={handleSubmit}>
				<FieldSet>
					<FieldGroup>
						<Field>
							<InputGroup>
								<InputGroupInput
									id="email"
									name="email"
									autoComplete="email"
									type="email"
									inputMode="email"
									placeholder="you@example.com"
									value={emailAddress}
									onChange={(event) => setEmailAddress(event.target.value)}
									required
								/>
								<InputGroupAddon align="inline-start">
									<Mail />
								</InputGroupAddon>
							</InputGroup>
							<FieldError
								errors={
									errors.fields.emailAddress
										? [errors.fields.emailAddress]
										: undefined
								}
							/>
						</Field>
						<Field>
							<InputGroup>
								<InputGroupInput
									id="password"
									name="password"
									autoComplete="new-password"
									type="password"
									inputMode="text"
									placeholder="••••••••"
									value={password}
									onChange={(event) => setPassword(event.target.value)}
									required
								/>
								<InputGroupAddon align="inline-start">
									<Lock />
								</InputGroupAddon>
							</InputGroup>
							<FieldError
								errors={
									errors.fields.password ? [errors.fields.password] : undefined
								}
							/>
						</Field>
						<Field>
							<InputGroup>
								<InputGroupInput
									id="confirm-password"
									name="confirm-password"
									autoComplete="new-password"
									type="password"
									inputMode="text"
									placeholder="confirm password"
									value={confirmPassword}
									onChange={(event) => setConfirmPassword(event.target.value)}
									required
								/>
								<InputGroupAddon align="inline-start">
									<Lock />
								</InputGroupAddon>
							</InputGroup>
							{confirmPassword.length > 0 && password !== confirmPassword ? (
								<FieldError>Passwords do not match.</FieldError>
							) : null}
						</Field>
						<FieldError
							errors={errors.global?.length ? [errors.global[0]] : undefined}
						>
							{submitError}
						</FieldError>
					</FieldGroup>
				</FieldSet>
			</form>
			<Button
				size="lg"
				className="w-full"
				type="submit"
				form="sign-up-form"
				disabled={isBusy}
			>
				Sign Up
			</Button>
			<div
				id="clerk-captcha"
				data-cl-theme="dark"
				data-cl-size="flexible"
				data-cl-language="es-ES"
			/>
			<p className="type-sm text-center">
				Already have an account? <Link href="/sign-in">Sign In</Link>
			</p>
		</div>
	);
}
