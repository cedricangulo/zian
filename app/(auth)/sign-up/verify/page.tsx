"use client";

import { useAuth, useSignUp } from "@clerk/nextjs";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { type FormEvent, useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Field, FieldError } from "@/components/ui/field";
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSeparator,
	InputOTPSlot,
} from "@/components/ui/input-otp";

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

export default function SignUpVerifyPage() {
	const { isLoaded, isSignedIn } = useAuth();
	const { signUp, errors, fetchStatus } = useSignUp();
	const router = useRouter();
	const [code, setCode] = useState("");
	const [submitError, setSubmitError] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [isResending, setIsResending] = useState(false);
	const [resendCooldown, setResendCooldown] = useState(0);
	const lastAutoSubmittedCode = useRef<string | null>(null);

	const isBusy = isSubmitting || fetchStatus === "fetching";

	useEffect(() => {
		if (isLoaded && isSignedIn) {
			router.replace("/post-auth");
		}
	}, [isLoaded, isSignedIn, router]);

	useEffect(() => {
		if (resendCooldown <= 0) {
			return;
		}

		const timer = window.setInterval(() => {
			setResendCooldown((current) => (current > 0 ? current - 1 : 0));
		}, 1000);

		return () => window.clearInterval(timer);
	}, [resendCooldown]);

	const verifyCode = useCallback(async (otpCode: string) => {
		if (isBusy) {
			return;
		}

		if (otpCode.trim().length !== 6) {
			setSubmitError("Enter the 6-digit verification code.");
			return;
		}

		setSubmitError(null);
		setIsSubmitting(true);

		try {
			const { error } = await signUp.verifications.verifyEmailCode({
				code: otpCode.trim(),
			});

			if (error) {
				setSubmitError(
					getClerkErrorMessage(
						error,
						"Unable to verify code. Please try again.",
					),
				);
				return;
			}

			if (signUp.status !== "complete") {
				setSubmitError("Verification is not complete yet. Please try again.");
				return;
			}

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
		} catch (error) {
			setSubmitError(
				getClerkErrorMessage(error, "Unable to verify code. Please try again."),
			);
		} finally {
			setIsSubmitting(false);
		}
	}, [isBusy, router, signUp]);

	const handleVerify = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		await verifyCode(code);
	};

	useEffect(() => {
		const normalizedCode = code.trim();
		if (normalizedCode.length !== 6) {
			lastAutoSubmittedCode.current = null;
			return;
		}

		if (isBusy || lastAutoSubmittedCode.current === normalizedCode) {
			return;
		}

		lastAutoSubmittedCode.current = normalizedCode;
		void verifyCode(normalizedCode);
	}, [code, isBusy, verifyCode]);

	const handleResend = async () => {
		if (isBusy || isResending || resendCooldown > 0) {
			return;
		}

		setSubmitError(null);
		setIsResending(true);

		try {
			const { error } = await signUp.verifications.sendEmailCode();
			if (error) {
				setSubmitError(
					getClerkErrorMessage(
						error,
						"Unable to resend code right now. Please try again.",
					),
				);
				return;
			}

			setResendCooldown(300);
		} catch (error) {
			setSubmitError(
				getClerkErrorMessage(
					error,
					"Unable to resend code right now. Please try again.",
				),
			);
		} finally {
			setIsResending(false);
		}
	};

	const resendMinutes = Math.floor(resendCooldown / 60);
	const resendSeconds = resendCooldown % 60;

	return (
		<div className="grid gap-6 h-fit">
			<Button variant="ghost" size="icon" asChild>
				<Link href="/sign-up">
					<ArrowLeft />
				</Link>
			</Button>
			<div className="space-y-2">
				<h1 className="type-lg">ZIAN</h1>
				<p className="type-base">OTP Verification</p>
			</div>
			<form id="sign-up-verify-form" onSubmit={handleVerify}>
				<Field>
					<InputOTP maxLength={6} value={code} onChange={setCode}>
						<InputOTPGroup>
							<InputOTPSlot index={0} />
							<InputOTPSlot index={1} />
							<InputOTPSlot index={2} />
						</InputOTPGroup>
						<InputOTPSeparator />
						<InputOTPGroup>
							<InputOTPSlot index={3} />
							<InputOTPSlot index={4} />
							<InputOTPSlot index={5} />
						</InputOTPGroup>
					</InputOTP>
					<FieldError
						errors={errors.fields.code ? [errors.fields.code] : undefined}
					>
						{submitError}
					</FieldError>
				</Field>
			</form>
			<div className="space-y-2">
				<Button
					size="lg"
					className="w-full"
					type="submit"
					form="sign-up-verify-form"
					disabled={isBusy || code.trim().length !== 6}
				>
					Verify
				</Button>
				<Button
					size="lg"
					className="w-full"
					variant="secondary"
					type="button"
					onClick={() => void handleResend()}
					disabled={isBusy || isResending || resendCooldown > 0}
				>
					{resendCooldown > 0
						? `Resend in ${String(resendMinutes).padStart(2, "0")}:${String(resendSeconds).padStart(2, "0")}`
						: "Resend code"}
				</Button>
			</div>
		</div>
	);
}
