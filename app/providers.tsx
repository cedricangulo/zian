"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import type { ReactNode } from "react";

import ConvexClientProvider from "@/components/convex-client-provider";
import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

type ProvidersProps = {
	children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
	return (
		<ClerkProvider>
			<NuqsAdapter>
				<ConvexClientProvider>
					<ThemeProvider
						attribute="class"
						defaultTheme="system"
						enableSystem
						disableTransitionOnChange
					>
						<TooltipProvider>{children}</TooltipProvider>
					</ThemeProvider>
				</ConvexClientProvider>
			</NuqsAdapter>
		</ClerkProvider>
	);
}
