import type { Metadata, Viewport } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { getBaseUrl, seoConfig } from "@/lib/seo";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

// Viewport configuration (separate export required in Next.js 14+)
export const viewport: Viewport = {
	width: "device-width",
	initialScale: 1,
	maximumScale: 5,
	userScalable: true,
	colorScheme: "light dark",
	themeColor: [
		{ media: "(prefers-color-scheme: light)", color: "#ffffff" },
		{ media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
	],
};

export const metadata: Metadata = {
	metadataBase: new URL(getBaseUrl()),

	// Title Configuration
	title: {
		default: seoConfig.en.title,
		template: "%s | ZIAN",
	},

	// Description and Keywords
	description: seoConfig.en.description,
	keywords: seoConfig.en.keywords,

	// Application Metadata
	applicationName: seoConfig.appName,
	authors: [
		{
			name: seoConfig.organization.foundedBy,
			url: getBaseUrl(),
		},
	],
	creator: seoConfig.organization.foundedBy,
	publisher: seoConfig.organization.name,
	category: "business",
	classification: "Business Software, Inventory Management",

	// Robots & Indexing
	robots: {
		index: true,
		follow: true,
		"max-snippet": -1,
		"max-image-preview": "large",
		"max-video-preview": -1,
	},

	// Canonical & Alternates
	alternates: {
		canonical: "/",
		languages: {
			en: `${getBaseUrl()}/en`,
			"fil-PH": `${getBaseUrl()}/fil`,
			"x-default": getBaseUrl(),
		},
	},

	// Open Graph (Social Media Sharing)
	openGraph: {
		type: "website",
		locale: seoConfig.en.locale,
		alternateLocale: [seoConfig.fil.locale],
		url: getBaseUrl(),
		siteName: seoConfig.siteName,
		title: seoConfig.en.title,
		description: seoConfig.en.description,
		images: [
			{
				url: `${getBaseUrl()}/opengraph-image`,
				width: 1200,
				height: 630,
				alt: seoConfig.en.title,
				type: "image/png",
			},
		],
	},

	// Twitter Card
	twitter: {
		card: "summary_large_image",
		site: "@ZIANInventory",
		creator: "@ZIANInventory",
		title: seoConfig.en.title,
		description: seoConfig.en.shortDescription,
		images: [`${getBaseUrl()}/opengraph-image`],
	},

	// Format Detection
	formatDetection: {
		email: true,
		telephone: true,
		address: true,
	},

	// Additional Meta Tags
	other: {
		"Content-Type": "text/html; charset=UTF-8",
		"X-UA-Compatible": "IE=edge",
		"google-site-verification": process.env.GOOGLE_SITE_VERIFICATION || "",
		// Resource hints for performance
		"dns-prefetch": "//fonts.googleapis.com",
		preconnect: "https://fonts.googleapis.com",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" className={outfit.variable} suppressHydrationWarning>
			<body className="antialiased">{children}</body>
		</html>
	);
}
