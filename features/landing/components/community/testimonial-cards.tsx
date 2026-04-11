import Image from "next/image";
import type { Testimonial } from "@/features/landing/types";

type Props = Testimonial;

export default function TestimonialCard({
	avatar,
	name,
	shopName,
	quote,
}: Props) {
	return (
		<div className="w-[min(18rem,80vw)] shrink-0 space-y-4 overflow-hidden rounded-3xl border-border bg-accent p-4 shadow-sm">
			<p className="type-base">{quote}</p>
			<div className="flex gap-2">
				<Image
					src={avatar}
					alt={name}
					width={32}
					height={32}
					className="rounded-full"
				/>
				<div>
					<p className="type-sm">{name}</p>
					<p className="type-xs text-muted-foreground">{shopName}</p>
				</div>
			</div>
		</div>
	);
}
