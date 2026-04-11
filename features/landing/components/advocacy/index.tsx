import Section from "../section";
import { AdvocacyCarousel } from "./advocacy-carousel";

export default function Advocacy() {
	return (
		<Section id="our-advocacy" className="grid grid-cols-2">
			<div className="space-y-4">
				<h2 className="type-2xl">
					Empowering local shops to grow beyond their notebooks.
				</h2>
				<p className="type-base">
					We believe that every small business owner deserves access to
					professional tools that make their daily work easier. Our platform
					bridges the digital gap by giving micro-enterprises the same powerful
					technology used by large retail chains. By moving away from manual
					tracking, you can focus your energy on serving your customers and
					building your legacy.
				</p>
			</div>
			<AdvocacyCarousel className="w-full" />
		</Section>
	);
}
