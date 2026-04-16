import { DashboardCharts } from "./dashboard-charts";
import { DashboardKpiCards } from "./dashboard-kpi-cards";
import { OwnerDashboardGreeting } from "./owner-dashboard-greeting";
import { DashboardShell } from "../dashboard-shell";

export function OwnerDashboard() {
	return (
		<DashboardShell title={<OwnerDashboardGreeting />}>
			<DashboardKpiCards />
			<DashboardCharts />
		</DashboardShell>
	);
}
