import Section from "../section";
import MainFeatureCard from "./main-feature-card";
import SubFeatureCard from "./sub-feature-card";
import { featuresList } from "@/features/landing/data";

export default function Features() {
	return (
		<Section id="features">
			<h2 className="type-2xl text-center max-w-[20ch] mx-auto">
				Everything you need to run a smarter business.
			</h2>
			<div className="mx-auto max-w-4xl">
				<MainFeatureCard />
				<div className="grid grid-cols-2 gap-6 mt-6">
					{featuresList.map((feature, index) => (
						<SubFeatureCard
							key={`feature-${index + 1}`}
							header={feature.header}
							description={feature.description}
						/>
					))}
				</div>
			</div>
		</Section>
	);
}
