import type { ReactNode } from "react";

interface Props {
	title: ReactNode | string;
	description?: ReactNode;
	action?: ReactNode;
	children: ReactNode;
}

export function DashboardShell({
	title,
	description,
	action,
	children,
}: Props) {
	return (
		<>
			<header className="flex items-start justify-between gap-4">
				<div className="flex-1 min-w-0">
					{typeof title === "string" ? (
						<h1 className="type-lg">{title}</h1>
					) : (
						title
					)}
					{description ? (
						<p className="max-w-2xl mt-2 type-base text-muted-foreground">
							{description}
						</p>
					) : null}
				</div>
				{action ? (
					<div className="shrink-0 flex items-center gap-2">{action}</div>
				) : null}
			</header>
			<div className="flex flex-col gap-6 pt-0">{children}</div>
		</>
	);
}
