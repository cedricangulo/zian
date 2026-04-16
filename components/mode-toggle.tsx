"use client";

import * as React from "react";
import { MoonIcon, SunIcon } from "lucide-react";
import { useTheme } from "next-themes";

import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { Kbd } from "./ui/kbd";

export function ThemeMenuItem() {
	const { setTheme, resolvedTheme } = useTheme();

	const toggleTheme = React.useCallback(() => {
		setTheme(resolvedTheme === "dark" ? "light" : "dark");
	}, [resolvedTheme, setTheme]);

	return (
		<DropdownMenuItem onClick={toggleTheme}>
			<SunIcon className="dark:hidden" />
			<MoonIcon className="hidden dark:block" />
			Theme
		</DropdownMenuItem>
	);
}

export function ModeToggle() {
	const { setTheme, resolvedTheme } = useTheme();

	const toggleTheme = React.useCallback(() => {
		setTheme(resolvedTheme === "dark" ? "light" : "dark");
	}, [resolvedTheme, setTheme]);

	React.useEffect(() => {
		const onKeyDown = (event: KeyboardEvent) => {
			if (event.defaultPrevented || event.repeat) {
				return;
			}

			if (event.key.toLowerCase() !== "d") {
				return;
			}

			if (event.metaKey || event.ctrlKey || event.altKey || event.shiftKey) {
				return;
			}

			const target = event.target as HTMLElement | null;
			if (!target) {
				return;
			}

			const tagName = target.tagName.toLowerCase();
			if (
				tagName === "input" ||
				tagName === "textarea" ||
				tagName === "select" ||
				target.isContentEditable
			) {
				return;
			}

			event.preventDefault();
			toggleTheme();
		};

		window.addEventListener("keydown", onKeyDown);
		return () => window.removeEventListener("keydown", onKeyDown);
	}, [toggleTheme]);

	return (
		<DropdownMenu>
			<Tooltip>
				<TooltipTrigger asChild>
					<DropdownMenuTrigger asChild>
						<Button variant="outline" size="icon">
							<SunIcon className="rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
							<MoonIcon className="absolute rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
							<span className="sr-only">Toggle theme</span>
						</Button>
					</DropdownMenuTrigger>
				</TooltipTrigger>
				<TooltipContent>
					Toggle theme
					<Kbd>D</Kbd>
				</TooltipContent>
			</Tooltip>
			<DropdownMenuContent align="end">
				<DropdownMenuGroup>
					<DropdownMenuItem onClick={() => setTheme("light")}>
						Light
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => setTheme("dark")}>
						Dark
					</DropdownMenuItem>
					<DropdownMenuItem onClick={() => setTheme("system")}>
						System
					</DropdownMenuItem>
				</DropdownMenuGroup>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
