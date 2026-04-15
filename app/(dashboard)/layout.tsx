import type { ReactNode } from "react";
import { AppSidebar } from "@/components/app-sidebar";

import {
	SidebarInset,
	SidebarProvider,
	// SidebarTrigger,
} from "@/components/ui/sidebar";
// import { Separator } from "@/components/ui/separator";
import Image from "next/image";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({ children }: { children: ReactNode }) {
	return (
		<SidebarProvider defaultOpen>
			<AppSidebar />
			<SidebarInset>
				<header className="flex justify-between items-center h-16 gap-2 shrink-0 p-6">
					{/* <SidebarTrigger /> */}
					{/* <Separator orientation="vertical" className="h-4" /> */}
					<div className="flex items-center gap-2">
						<Image
							src="/image-placeholder.png"
							alt="Business Logo"
							height={32}
							width={32}
							className="rounded-full size-8"
						/>
						<h1 className="type-2xl">Chin Cafe</h1>
					</div>
					<Button variant="outline" size="icon">
						<Bell />
					</Button>
				</header>
				<div className="flex flex-col flex-1">{children}</div>
			</SidebarInset>
		</SidebarProvider>
	);
}
