import Section from "../section";
import { testimonials } from "@/features/landing/data";
import TestimonialMarquee from "./testimonial-marquee";

export default function Community() {
	return (
		<Section id="community" className="grid gap-8 max-w-none">
			<h2 className="type-2xl mx-auto text-center">
				Trusted by local entrepreneurs like you
			</h2>
			<TestimonialMarquee testimonials={testimonials} />
		</Section>
	);
}
