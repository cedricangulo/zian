"use client";

import { Bar, BarChart, CartesianGrid, Pie, PieChart, XAxis } from "recharts";

import {
	ChartContainer,
	ChartLegend,
	ChartLegendContent,
	ChartTooltip,
	ChartTooltipContent,
} from "@/components/ui/chart";
import {
	Card,
	CardAction,
	CardContent,
	CardDescription,
	CardHeader,
} from "@/components/ui/card";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import {
	dispatchHistoryChartConfig,
	dispatchHistoryData,
	stockEfficiencyChartConfig,
	stockEfficiencyData,
} from "../../data/mock-data";

export function DashboardCharts() {
	return (
		<div className="grid gap-6 lg:grid-cols-2">
			<Card>
				<CardHeader>
					<CardDescription>Stock efficiency rate</CardDescription>
				</CardHeader>
				<CardContent>
					<ChartContainer
						config={stockEfficiencyChartConfig}
						className="mx-auto aspect-square max-h-87.5"
					>
						<PieChart>
							<ChartTooltip
								cursor={false}
								content={<ChartTooltipContent hideLabel />}
							/>
							<Pie
								data={stockEfficiencyData}
								dataKey="value"
								nameKey="category"
								stroke="0"
							/>
							<ChartLegend
								content={<ChartLegendContent nameKey="category" />}
								className="-translate-y-2 flex-wrap gap-2 *:basis-1/4 *:justify-center"
							/>
						</PieChart>
					</ChartContainer>
				</CardContent>
			</Card>
			<Card>
				<CardHeader>
					<CardDescription>Product Dispatch History</CardDescription>
					<CardAction>
						<Select>
							<SelectTrigger>
								<SelectValue placeholder="Today" />
							</SelectTrigger>
							<SelectContent>
								<SelectGroup>
									<SelectItem value="today">Today</SelectItem>
									<SelectItem value="week">This Week</SelectItem>
									<SelectItem value="month">This Month</SelectItem>
								</SelectGroup>
							</SelectContent>
						</Select>
					</CardAction>
				</CardHeader>
				<CardContent>
					<ChartContainer config={dispatchHistoryChartConfig}>
						<BarChart accessibilityLayer data={dispatchHistoryData}>
							<CartesianGrid vertical={false} />
							<XAxis
								dataKey="month"
								tickLine={false}
								tickMargin={10}
								axisLine={false}
								tickFormatter={(value) => value.slice(0, 3)}
							/>
							<ChartTooltip
								cursor={false}
								content={<ChartTooltipContent hideLabel />}
							/>
							<Bar dataKey="dispatches" fill="var(--color-dispatches)" radius={8} />
						</BarChart>
					</ChartContainer>
				</CardContent>
			</Card>
		</div>
	);
}