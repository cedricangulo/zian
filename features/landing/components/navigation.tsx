"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { navigationItems } from "@/features/landing/data";
import { AuthLoading, Authenticated, Unauthenticated } from "convex/react";
import { useNavigationScrollBackground } from "../hooks";
import { cn } from "@/lib/utils";

export default function Navigation() {
	const isScrolled = useNavigationScrollBackground();

	return (
		<nav
			className={cn(
				"sticky top-0 z-50 w-full px-6 py-4 transition-all duration-300",
				isScrolled
					? "bg-background/80 shadow-sm backdrop-blur-md"
					: "bg-transparent",
			)}
		>
			<div className="flex items-center justify-between w-full">
				<Button variant="ghost" asChild>
					<Link href="#home">ZIAN</Link>
				</Button>
				<div className="hidden md:flex">
					{navigationItems.map((item) => (
						<Button key={item.name} variant="ghost" asChild>
							<Link href={item.href}>{item.name}</Link>
						</Button>
					))}
				</div>
				{/* login & register of not signed in. dashboard if signed in */}
				<div className="hidden gap-4 md:flex">
					<AuthLoading>
						<div className="w-44" aria-hidden />
					</AuthLoading>
					<Unauthenticated>
						<Button variant="ghost" asChild>
							<Link href="/sign-in">Login</Link>
						</Button>
						<Button asChild>
							<Link href="/sign-up">Register</Link>
						</Button>
					</Unauthenticated>
					<Authenticated>
						<Button asChild>
							<Link href="/dashboard">Dashboard</Link>
						</Button>
					</Authenticated>
				</div>
			</div>
		</nav>
	);
}
