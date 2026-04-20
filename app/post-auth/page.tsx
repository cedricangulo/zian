"use client";

import { useAuth } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useState } from "react";

import { api } from "@/convex/_generated/api";

function wait(ms: number) {
	return new Promise((resolve) => {
		window.setTimeout(resolve, ms);
	});
}

export default function PostAuthPage() {
	const { isLoaded, isSignedIn } = useAuth();
	const syncCurrentClerkOrg = useMutation(api.bootstrap.syncCurrentClerkOrg);
	const [isBootstrapped, setIsBootstrapped] = useState(false);
	const onboardingStatus = useQuery(
		api.onboarding.getOnboardingStatus,
		isBootstrapped ? {} : "skip",
	);
	const router = useRouter();
	const hasStarted = useRef(false);

	useEffect(() => {
		if (!isLoaded || hasStarted.current) {
			return;
		}

		hasStarted.current = true;

		if (!isSignedIn) {
			router.replace("/sign-in");
			return;
		}

		void (async () => {
			let lastError: unknown = null;

			for (let attempt = 1; attempt <= 5; attempt += 1) {
				try {
					await syncCurrentClerkOrg({});
					setIsBootstrapped(true);
					return;
				} catch (error) {
					lastError = error;
					if (attempt < 5) {
						await wait(attempt * 250);
					}
				}
			}

			console.error("post-auth bootstrap failed", lastError);
			router.replace("/sign-in");
		})();
	}, [isLoaded, isSignedIn, router, syncCurrentClerkOrg]);

	useEffect(() => {
		if (!isBootstrapped || onboardingStatus === undefined) {
			return;
		}

		if (onboardingStatus.is_complete) {
			router.replace("/dashboard");
			return;
		}

		if (onboardingStatus.status === "business_pending") {
			router.replace("/onboarding/business");
			return;
		}

		router.replace("/onboarding/profile");
	}, [isBootstrapped, onboardingStatus, router]);

	return <main className="p-8">Completing sign-in...</main>;
}
