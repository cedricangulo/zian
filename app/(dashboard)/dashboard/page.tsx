import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";

export default function Dashboard() {
	return (
		<>
			<header className="px-6">
				<h2 className="type-lg">Good Day Xian Lee</h2>
			</header>
			<div className="grid gap-6 p-6 lg:grid-cols-3">
				<Card>
					<CardHeader>
						<CardDescription>Total asset value</CardDescription>
					</CardHeader>
					<CardContent>
						<CardTitle className="type-lg">100,000 pesos</CardTitle>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardDescription>Total dispatch value</CardDescription>
					</CardHeader>
					<CardContent>
						<CardTitle className="type-lg">24,000</CardTitle>
					</CardContent>
				</Card>
				<Card>
					<CardHeader>
						<CardDescription>Manual adjustments</CardDescription>
					</CardHeader>
					<CardContent>
						<CardTitle className="type-lg">2 logs today</CardTitle>
					</CardContent>
					<CardFooter>Daily operations note</CardFooter>
				</Card>
				<Card className="lg:col-span-3">
					<CardHeader>
						<CardTitle>Stock efficiency rate</CardTitle>
						<CardDescription>Donut with interactive legend</CardDescription>
					</CardHeader>
					<CardContent>
						
					</CardContent>
				</Card>
			</div>
		</>
	);
}
