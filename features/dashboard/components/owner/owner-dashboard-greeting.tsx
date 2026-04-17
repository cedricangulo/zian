"use client";

import { useUser } from "@clerk/nextjs";

import { Skeleton } from "@/components/ui/skeleton";

export function OwnerDashboardGreeting() {
	const { isLoaded, user } = useUser();
	const userName = user?.fullName ?? user?.username ?? "Account";

	if (!isLoaded) {
		return <Skeleton className="h-7 w-64" />;
	}

	return <h2 className="type-lg">Good Day {userName}</h2>;
}
