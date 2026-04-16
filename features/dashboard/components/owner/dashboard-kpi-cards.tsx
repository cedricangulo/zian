import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

import { dashboardKpis } from "../../data/mock-data";

export function DashboardKpiCards() {
	return (
		<div className="grid gap-6 lg:grid-cols-3">
			{dashboardKpis.map((kpi) => (
				<Card key={kpi.label}>
					<CardHeader>
						<CardDescription>{kpi.label}</CardDescription>
					</CardHeader>
					<CardContent>
						<CardTitle className="type-lg">{kpi.value}</CardTitle>
					</CardContent>
					{kpi.description ? <CardFooter>{kpi.description}</CardFooter> : null}
				</Card>
			))}
		</div>
	);
}
