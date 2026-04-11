"use client";

import { Marquee } from "@/components/ui/marquee";
import type { Testimonial } from "@/features/landing/types";
import TestimonialCard from "./testimonial-cards";

interface Props {
	testimonials: Testimonial[];
}

export default function TestimonialMarquee({ testimonials }: Props) {
	if (!testimonials.length) {
		return null;
	}

	return (
		<Marquee
			pauseOnHover
			repeat={4}
			className="w-full px-0 py-4 [--duration:60s] [--gap:1.5rem]"
		>
			{testimonials.map((testimonial, index) => (
				<TestimonialCard
					key={`testimonial-${testimonial.name}-${testimonial.shopName}-${index}`}
					{...testimonial}
				/>
			))}
		</Marquee>
	);
}
