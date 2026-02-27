import type { Metadata } from "next";
import Script from "next/script";
import {
	Accordion,
	AccordionItem,
	AccordionTrigger,
	AccordionContent,
} from "@/components/ui/accordion";
import {
	getBaseUrl,
	seoConfig,
	generateOrganizationSchema,
	generateSoftwareApplicationSchema,
	generateWebsiteSchema,
} from "@/lib/seo";

export const metadata: Metadata = {
	title: seoConfig.en.title,
	description: seoConfig.en.description,
	alternates: {
		canonical: "/",
	},
};

export default function Page() {
	const baseUrl = getBaseUrl();

	// Generate schemas
	const organizationSchema = JSON.stringify(
		generateOrganizationSchema(baseUrl),
	);
	const softwareAppSchema = JSON.stringify(
		generateSoftwareApplicationSchema(baseUrl),
	);
	const websiteSchema = JSON.stringify(generateWebsiteSchema(baseUrl));

	return (
		<main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-8 px-6 py-16">
			{/* Essential JSON-LD schemas for SEO */}
			<Script
				id="organization-jsonld"
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: organizationSchema }}
			/>
			<Script
				id="software-application-jsonld"
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: softwareAppSchema }}
			/>
			<Script
				id="website-jsonld"
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: websiteSchema }}
			/>

			<header className="space-y-4">
				<h1 className="text-4xl font-semibold tracking-tight">
					Inventory Management Software for Philippine Micro-Enterprises
				</h1>
				<p className="text-muted-foreground max-w-2xl text-lg">
					{seoConfig.en.description}
				</p>
			</header>

			<section className="space-y-6" aria-labelledby="features-heading">
				<h2 id="features-heading" className="text-2xl font-semibold">
					Core Features for Small Business Inventory Control
				</h2>
				<div className="grid gap-4 md:grid-cols-2">
					{seoConfig.en.features.slice(0, 6).map((feature) => (
						<article key={feature.title} className="rounded-lg border p-4">
							<h3 className="text-lg font-medium">{feature.title}</h3>
							<p className="text-muted-foreground mt-2 text-sm">
								{feature.description}
							</p>
						</article>
					))}
				</div>
			</section>

			<section
				className="rounded-lg border bg-muted/40 p-6 space-y-4 text-muted-foreground"
				aria-labelledby="target-heading"
			>
				<h2
					id="target-heading"
					className="text-2xl font-semibold text-foreground"
				>
					Built for Philippine Micro-Enterprises
				</h2>
				<p>
					ZIAN is specifically designed for small businesses in the Philippines
					with 1-10 employees and asset values under ₱3M. Whether you run a
					hardware store, motor parts shop, or cafe, ZIAN helps you manage
					inventory with confidence.
				</p>
				<p>
					Track stock levels in real-time, manage suppliers, identify
					slow-moving inventory, and make data-driven decisions with built-in
					business intelligence—all without complex POS features you don&apos;t
					need.
				</p>
			</section>

			{/* FAQs */}
			<section className="space-y-6" aria-labelledby="faqs-heading">
				<h2 id="faqs-heading" className="text-2xl font-semibold">
					Frequently Asked Questions
				</h2>
				<Accordion defaultValue={["faq-0"]} className="w-full">
					{seoConfig.en.faqs.map((faq, index) => (
						<AccordionItem key={`faq-${index}`} value={`faq-${index}`}>
							<AccordionTrigger>{faq.question}</AccordionTrigger>
							<AccordionContent>{faq.answer}</AccordionContent>
						</AccordionItem>
					))}
				</Accordion>
			</section>
		</main>
	);
}
