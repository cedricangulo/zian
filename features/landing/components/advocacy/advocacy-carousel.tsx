"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { AspectRatio } from "@/components/ui/aspect-ratio";

import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { advocacyImages } from "@/features/landing/data";
import {
	Carousel,
	CarouselContent,
	CarouselItem,
	type CarouselApi,
} from "@/components/ui/carousel";

interface Props {
	className?: string;
}

export function AdvocacyCarousel({ className }: Props) {
	const [api, setApi] = useState<CarouselApi>();
	const [current, setCurrent] = useState(0);

	useEffect(() => {
		if (!api) return;

		const handleSelect = () => {
			setCurrent(api.selectedScrollSnap());
		};

		handleSelect();
		api.on("select", handleSelect);

		return () => {
			api.off("select", handleSelect);
		};
	}, [api]);

	const count = api?.scrollSnapList().length ?? 0;

	return (
		<Carousel setApi={setApi} className={cn("w-full", className)}>
			<CarouselContent>
				{advocacyImages.map((src, index) => (
					<CarouselItem key={`slide-${index + 1}`}>
						<div>
							<Card className="group/card overflow-hidden border-0 p-0">
								<AspectRatio ratio={1}>
									<Image
										src={src}
										alt={`Slide ${index + 1}`}
										width={800}
										height={800}
										className="h-full w-full scale-100 object-cover transition-transform duration-500 ease-in-out group-hover/card:scale-105"
									/>
								</AspectRatio>
							</Card>
						</div>
					</CarouselItem>
				))}
			</CarouselContent>

			{/* Dots Navigation */}
			<div className="flex justify-center gap-2 py-3">
				{Array.from({ length: count }).map((_, index) => (
					<button
						type="button"
						key={`dot-${index + 1}`}
						className={cn(
							"rounded-full h-2 cursor-pointer transition-all duration-500 ease-in-out",
							index === current
								? "bg-primary w-4 opacity-100"
								: "bg-muted-foreground w-2 opacity-30 hover:opacity-50",
						)}
						onClick={() => api?.scrollTo(index)}
						aria-label={`Go to slide ${index + 1}`}
					/>
				))}
			</div>
		</Carousel>
	);
}
