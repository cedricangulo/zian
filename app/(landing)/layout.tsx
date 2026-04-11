import type { Metadata } from "next";
import Script from "next/script";
import {
	generateOrganizationSchema,
	generateSoftwareApplicationSchema,
	generateWebsiteSchema,
	getBaseUrl,
	seoConfig,
} from "@/lib/seo";

export const metadata: Metadata = {
	title: seoConfig.en.title,
	description: seoConfig.en.description,
	alternates: {
		canonical: "/",
	},
};

interface Props {
	children: React.ReactNode;
}

export default function Layout({ children }: Props) {
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
		<main>
			{/* Essential JSON-LD schemas for SEO */}
			<Script id="organization-jsonld" type="application/ld+json">
				{organizationSchema}
			</Script>
			<Script id="software-application-jsonld" type="application/ld+json">
				{softwareAppSchema}
			</Script>
			<Script id="website-jsonld" type="application/ld+json">
				{websiteSchema}
			</Script>
			{children}
		</main>
	);
}
