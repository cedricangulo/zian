import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	return (
		<main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col items-center justify-center gap-8 px-6 py-16">
			<div className="text-center space-y-4">
				<h1 className="text-6xl font-bold tracking-tight">404</h1>
				<h2 className="text-2xl font-semibold">Page Not Found</h2>
				<p className="text-muted-foreground max-w-md text-lg">
					Sorry, the page you&apos;re looking for doesn&apos;t exist or has been
					moved. Let&apos;s get you back on track.
				</p>
			</div>

			<div className="flex gap-4">
				<Button asChild>
					<Link href="/">Return Home</Link>
				</Button>
				<Button variant="outline" asChild>
					<Link href="/#features">View Features</Link>
				</Button>
			</div>

			<div className="text-center text-sm text-muted-foreground mt-8">
				<p>Error Code: 404 - Page Not Found</p>
			</div>
		</main>
	);
}
