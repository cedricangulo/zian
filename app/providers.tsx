"use client";

import { ClerkProvider } from "@clerk/nextjs";
import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/theme-provider";
import { TooltipProvider } from "@/components/ui/tooltip";

type ProvidersProps = {
	children: ReactNode;
};

export function Providers({ children }: ProvidersProps) {
	return (
		<ClerkProvider>
			<ThemeProvider
				attribute="class"
				defaultTheme="system"
				enableSystem
				disableTransitionOnChange
			>
				<TooltipProvider>{children}</TooltipProvider>
			</ThemeProvider>
		</ClerkProvider>
	);
}