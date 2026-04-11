import { cn } from "@/lib/utils";

interface Props {
	className?: string;
	children: React.ReactNode;
	id?: string;
}

export default function Section({ className, children, id }: Props) {
	return (
		<section id={id} className={cn("py-16 gap-6 mx-auto max-w-4xl", className)}>
			{children}
		</section>
	);
}
