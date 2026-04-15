"use client";

import { useAuth } from "@clerk/nextjs";
import { ConvexReactClient } from "convex/react";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import type { ReactNode } from "react";

if (!process.env.NEXT_PUBLIC_CONVEX_URL) {
	throw new Error(
		"Missing NEXT_PUBLIC_CONVEX_URL in your environment variables.",
	);
}

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL);

type ConvexClientProviderProps = {
	children: ReactNode;
};

export default function ConvexClientProvider({
	children,
}: ConvexClientProviderProps) {
	return (
		<ConvexProviderWithClerk client={convex} useAuth={useAuth}>
			{children}
		</ConvexProviderWithClerk>
	);
}
