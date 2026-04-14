"use client";

import { ClerkProvider } from "@clerk/nextjs";
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
		</ClerkProvider>
	);
}