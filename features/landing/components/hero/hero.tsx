import { Button } from "@/components/ui/button";
import Section from "../section";
import HeroImage from "./hero-image";

export default function Hero() {
	return (
		<Section
			id="home"
			className="flex flex-col items-center max-w-none! space-y-8 text-center bg-secondary pb-0"
		>
			<div className="mt-16 space-y-4">
				<h1 className="type-3xl">
					Stop guessing your stock.
					<br /> Start growing your profit.
				</h1>
				<h4 className="type-base">
					The easy way to track items and dispatch for local shops. <br /> No
					more paper logbooks or messy records.
				</h4>
			</div>
			<Button>Start For Free</Button>
			<HeroImage />
		</Section>
	);
}
