import type { ReactNode } from "react";

export default function OnboardingLayout({
	children,
}: {
	children: ReactNode;
}) {
	return (
		<div className="p-16 space-y-6">
			<div className="flex items-center justify-between">
				<h1 className="type-lg">ZIAN</h1>
				{/* step indicator based on current route */}
				<div className="flex gap-4">
					<span className="w-16 h-2 rounded-full bg-primary" />
					<span className="w-4 h-2 rounded-full bg-muted" />
					<span className="w-4 h-2 rounded-full bg-muted" />
				</div>
				<div />
			</div>
			{children}
		</div>
	);
}
