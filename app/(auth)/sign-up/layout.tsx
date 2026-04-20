import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { AdvocacyCarousel } from "@/features/landing/components/advocacy/advocacy-carousel";

interface Props {
	children: React.ReactNode;
}

export default function SignUpLayout({ children }: Props) {
	return (
		<div className="grid grid-cols-2 max-w-6xl mx-auto gap-6 p-16">
			{children}
			<Card>
				<CardHeader>
					<CardTitle className="type-lg">Join the ZIAN Community</CardTitle>
					<CardDescription className="type-base">
						Modernize your storefront with our intelligent inventory ecosystem.
						Manage, track and grow anywhere.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<AdvocacyCarousel />
				</CardContent>
			</Card>
		</div>
	);
}
