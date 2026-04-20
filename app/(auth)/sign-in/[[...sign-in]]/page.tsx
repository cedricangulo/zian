"use client";

import { useAuth, useSignIn } from "@clerk/nextjs";
import { ArrowLeft, Lock, Mail } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
	Field,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldSeparator,
	FieldSet,
} from "@/components/ui/field";
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

export default function SignInPage() {
	const { isLoaded, isSignedIn } = useAuth();
	const { signIn, errors, fetchStatus } = useSignIn();
	const router = useRouter();
	const [emailAddress, setEmailAddress] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
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

		setSubmitError(null);
		setIsSubmitting(true);

		try {
			const { error } = await signIn.password({
				identifier: emailAddress.trim(),
				password,
			});

			if (error) {
				setSubmitError(
					getClerkErrorMessage(error, "Unable to sign in. Please try again."),
				);
				return;
			}

			if (signIn.status !== "complete") {
				setSubmitError("Sign in is not complete yet. Please try again.");
				return;
			}

			await signIn.finalize({
				navigate: ({ decorateUrl }) => {
					const url = decorateUrl("/post-auth");
					if (url.startsWith("http")) {
						window.location.href = url;
						return;
					}
					router.push(url);
				},
			});
		} catch (error) {
			setSubmitError(
				getClerkErrorMessage(error, "Unable to sign in. Please try again."),
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleSocialSignIn = async (
		strategy: "oauth_google" | "oauth_facebook",
	) => {
		if (isBusy) {
			return;
		}

		setSubmitError(null);
		setIsSubmitting(true);

		try {
			const { error } = await signIn.sso({
				strategy,
				redirectUrl: "/post-auth",
				redirectCallbackUrl: "/sso-callback",
			});

			if (error) {
				setSubmitError(
					getClerkErrorMessage(
						error,
						"Unable to continue with social sign in. Please try again.",
					),
				);
			}
		} catch (error) {
			setSubmitError(
				getClerkErrorMessage(
					error,
					"Unable to continue with social sign in. Please try again.",
				),
			);
		} finally {
			setIsSubmitting(false);
		}
	};

	return (
		<div className="grid gap-6 p-16 max-w-2xl mx-auto">
			<Button variant="ghost" size="icon" asChild>
				<Link href="/">
					<ArrowLeft />
				</Link>
			</Button>
			<div className="space-y-2">
				<h1 className="type-lg">ZIAN</h1>
				<p className="type-base">Sign in to your account</p>
			</div>
			<form id="sign-in-form" onSubmit={handleSubmit}>
				<FieldSet>
					<FieldGroup>
						<div className="grid grid-cols-2 gap-6">
							<Button
								variant="outline"
								type="button"
								onClick={() => void handleSocialSignIn("oauth_google")}
								disabled={isBusy}
							>
								Login with Google
							</Button>
							<Button
								variant="outline"
								type="button"
								onClick={() => void handleSocialSignIn("oauth_facebook")}
								disabled={isBusy}
							>
								Login with Facebook
							</Button>
						</div>
						<FieldSeparator>Or continue with</FieldSeparator>
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
									errors.fields.identifier
										? [errors.fields.identifier]
										: undefined
								}
							/>
						</Field>
						<Field>
							<InputGroup>
								<InputGroupInput
									id="password"
									name="password"
									autoComplete="current-password"
									type={showPassword ? "text" : "password"}
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
						<Field orientation="horizontal">
							<Checkbox
								id="show-password"
								checked={showPassword}
								onCheckedChange={(checked) => setShowPassword(checked === true)}
							/>
							<FieldLabel htmlFor="show-password" className="type-xs">
								Show Password
							</FieldLabel>
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
				form="sign-in-form"
				disabled={isBusy}
			>
				Sign In
			</Button>
			<p className="type-sm text-center">
				Don&apos;t have an account? <Link href="/sign-up">Sign Up</Link>
			</p>
		</div>
	);
}
