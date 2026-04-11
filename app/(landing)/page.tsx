import {
	Advocacy,
	Community,
	Features,
	Footer,
	Hero,
	Navigation,
} from "@/features/landing";

export default function Page() {
	return (
		<>
			<Navigation />
			<Hero />
			<Features />
			<Advocacy />
			<Community />
			<Footer />
		</>
	);
}
