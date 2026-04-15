"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
	BarChart3,
	Boxes,
	FileClock,
	LayoutDashboard,
	Package,
	Truck,
} from "lucide-react";

import {
	Sidebar,
	SidebarContent,
	SidebarGroup,
	SidebarGroupContent,
	SidebarHeader,
	SidebarMenu,
	SidebarMenuButton,
	SidebarMenuItem,
	SidebarRail,
} from "@/components/ui/sidebar";

type NavItem = {
	title: string;
	href: string;
	icon: typeof LayoutDashboard;
};

const ownerNavItems: NavItem[] = [
	{ title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
	{ title: "Products", href: "/products", icon: Package },
	{ title: "Inventory", href: "/inventory", icon: Boxes },
	{ title: "Suppliers", href: "/suppliers", icon: Truck },
	{ title: "Reports", href: "/reports", icon: BarChart3 },
	{ title: "Audit Logs", href: "/audit-logs", icon: FileClock },
];

export function AppSidebar() {
	const pathname = usePathname();

	return (
		<Sidebar collapsible="icon">
			<SidebarHeader>
				<div className="flex flex-col gap-0.5 px-1 py-1">
					<p className="text-sm font-semibold leading-none">ZIAN</p>
				</div>
			</SidebarHeader>
			<SidebarContent>
				<SidebarGroup>
					<SidebarGroupContent>
						<SidebarMenu>
							{ownerNavItems.map((item) => {
								const isActive =
									pathname === item.href ||
									pathname.startsWith(`${item.href}/`);

								return (
									<SidebarMenuItem key={item.href}>
										<SidebarMenuButton
											asChild
											isActive={isActive}
											tooltip={item.title}
										>
											<Link href={item.href}>
												<item.icon />
												<span>{item.title}</span>
											</Link>
										</SidebarMenuButton>
									</SidebarMenuItem>
								);
							})}
						</SidebarMenu>
					</SidebarGroupContent>
				</SidebarGroup>
			</SidebarContent>
			<SidebarRail />
		</Sidebar>
	);
}
