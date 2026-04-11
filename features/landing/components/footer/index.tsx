import Link from "next/link";
import { Button } from "@/components/ui/button";
import { footerLinks } from "../../data/footer";
import Section from "../section";

export default function Footer() {
	return (
		<>
			<Section id="cta" className="px-16 max-w-none">
				<div className="flex flex-col items-center w-full gap-8 p-16 text-center bg-primary rounded-3xl">
					<h2 className="type-2xl text-secondary">
						Ready to transform your business?
					</h2>
					<p className="type-base text-secondary max-w-prose">
						Lorem ipsum dolor sit amet consectetur, adipisicing elit. Vel
						voluptas tenetur at, aspernatur ducimus laboriosam iure quos odio
						voluptatum adipisci.
					</p>
					<Button variant="secondary">Use ZIAN For Free</Button>
				</div>
			</Section>
			<Section id="footer" className="p-4 max-w-none">
				<footer className="w-full p-6 border-border rounded-3xl">
					<div className="flex items-start justify-between mb-16">
						<div className="max-w-sm space-y-4">
							<Link href="/" className="type-lg">
								ZIAN
							</Link>
							<p>
								Because every local shop matters. We&apos;re here to help you
								stay organized, reduce waste and grow your dreams, one item at a
								time.
							</p>
						</div>
						<div className="flex gap-8">
							{footerLinks.map((link) => (
								<div key={link.title}>
									<h3 className="type-base font-semibold! p-2">{link.title}</h3>
									<ul>
										{link.links.map((item) => (
											<li key={item.name}>
												<Button variant="ghost" asChild>
													<Link
														href={item.href}
														target={
															link.title === "Social Media"
																? "_blank"
																: undefined
														}
													>
														{item.name}
													</Link>
												</Button>
											</li>
										))}
									</ul>
								</div>
							))}
						</div>
					</div>
					<div className="flex items-center justify-between w-full">
						<p>&copy; {new Date().getFullYear()} ZIAN. All rights reserved.</p>
						<div className="flex gap-4">
							<Button variant="ghost" asChild>
								<Link href="/terms">Terms of Service</Link>
							</Button>
							<Button variant="ghost" asChild>
								<Link href="/privacy">Privacy Policy</Link>
							</Button>
						</div>
					</div>
				</footer>
			</Section>
		</>
	);
}
