import Image from "next/image";
import type { LandingFeatureItem } from "@/features/landing/types";
import { AspectRatio } from "@/components/ui/aspect-ratio";

type Props = LandingFeatureItem;

export default function SubFeatureCard({ header, description }: Props) {
	return (
		<div className="grid overflow-hidden rounded-3xl border-border shadow-sm">
			<AspectRatio ratio={4 / 3}>
				<Image
					src="/image-placeholder.png"
					alt="Feature illustration"
					width={400}
					height={300}
					className="h-full w-full select-none object-cover"
				/>
			</AspectRatio>
			<div className="space-y-2 bg-secondary p-4 text-center">
				<h4 className="font-semibold! type-base">{header}</h4>
				<p className="type-base">{description}</p>
			</div>
		</div>
	);
}
