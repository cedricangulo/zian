import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export default function MainFeatureCard() {
	return (
		<div className="grid grid-cols-2 gap-6 mt-16 overflow-hidden shadow-sm rounded-3xl border-border">
			<div className="p-6 pr-0 mt-auto space-y-4">
				<Badge variant="secondary">Inventory Control</Badge>
				<h3 className="type-xl">Master your stock with zero effort.</h3>
				<p>
					Take total control of your shop with real-time tracking that replaces
					messy notebooks.
				</p>
			</div>
			<AspectRatio ratio={4 / 3}>
				<Image
					src="/image-placeholder.png"
					alt="Feature illustration"
					width={400}
					height={300}
					className="h-full w-full select-none object-cover"
				/>
			</AspectRatio>
		</div>
	);
}
