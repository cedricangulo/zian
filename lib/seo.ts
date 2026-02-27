export const getBaseUrl = () => {
	return (
		process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ??
		"http://localhost:3000"
	);
};

export const seoConfig = {
	// Brand & Site Identity
	siteName: "ZIAN",
	shortName: "ZIAN",
	appName: "ZIAN: Inventory Management & Analytics",

	// English Configuration
	en: {
		title: "ZIAN | Inventory Management & Analytics for MSMEs",
		description:
			"Cloud-based inventory management system for Philippine micro-enterprises. Track stock, manage suppliers, analyze asset health with ZIAN.",
		shortDescription:
			"Inventory management & analytics for small businesses in the Philippines",
		locale: "en_PH",
		keywords: [
			"inventory management system Philippines",
			"inventory management for small business",
			"cloud inventory system",
			"inventory tracking software",
			"inventory analytics for MSMEs",
			"dead stock analysis",
			"low stock alerts",
			"supplier management software",
			"FEFO batch tracking",
			"inventory forecasting",
			"business intelligence for MSMEs",
			"free inventory management tool",
			"inventory management without POS",
			"asset optimization software",
		],
		features: [
			{
				title: "Inventory Tracking",
				description:
					"Real-time stock monitoring across multiple products and locations with instant balance visibility.",
			},
			{
				title: "Smart Deduction Logic",
				description:
					"Automated inventory deduction with support for recipe-based (Bill of Materials) deduction for composite products.",
			},
			{
				title: "FEFO Batch Tracking",
				description:
					"First-Expired-First-Out batch management for perishable items with automatic expiry tracking and alerts.",
			},
			{
				title: "Low Stock & Expiry Alerts",
				description:
					"Proactive notifications when inventory falls below thresholds or items approach expiration dates.",
			},
			{
				title: "Supplier Management",
				description:
					"Centralized supplier records with contact information and restocking workflow optimization.",
			},
			{
				title: "Asset Valuation & Analytics",
				description:
					"Comprehensive inventory analytics including total asset value, dead stock identification, and inventory health metrics.",
			},
			{
				title: "Dead Stock Analysis",
				description:
					"Identify slow-moving and non-moving items over 90 days to optimize inventory investment.",
			},
			{
				title: "Sales Forecasting",
				description:
					"Demand estimation based on historical sales data to support purchasing and inventory planning decisions.",
			},
		],
		faqs: [
			{
				question: "What is inventory management software?",
				answer:
					"Inventory management software tracks stock levels, product movement, and asset values. ZIAN helps small businesses maintain accurate inventory records, receive low-stock alerts, and make data-driven purchasing decisions.",
			},
			{
				question: "Do I need a POS system with inventory software?",
				answer:
					"No. ZIAN is a standalone inventory management system designed for small businesses that don't need complex POS features. It focuses purely on inventory tracking, supplier management, and asset optimization.",
			},
			{
				question: "Can ZIAN track perishable items like food and drinks?",
				answer:
					"Yes. ZIAN includes FEFO (First-Expired-First-Out) batch tracking and automatic expiry alerts, making it ideal for cafes, milk tea shops, and food retailers.",
			},
			{
				question: "How does Bill of Materials (BOM) deduction work?",
				answer:
					"For composite items like prepared drinks or assembled products, you define ingredient recipes. When one unit is sold, ZIAN automatically deducts all required ingredients from inventory.",
			},
			{
				question: "What is dead stock analysis?",
				answer:
					"Dead stock analysis identifies products with no movement for 90 days or more. This helps you identify slow-moving inventory that may be tying up capital unnecessarily.",
			},
			{
				question: "Is my data safe in cloud inventory software?",
				answer:
					"Yes. ZIAN uses enterprise-grade cloud infrastructure with encryption, regular backups, and multi-tenant security. Your data is protected with role-based access control for owner and staff roles.",
			},
			{
				question: "Can inventory software help me with business taxes?",
				answer:
					"ZIAN provides inventory asset valuations that help with financial reporting and tax preparation. However, ZIAN is not a tax or accounting software and doesn't compute revenue or VAT.",
			},
			{
				question: "Is ZIAN suitable for my micro-enterprise?",
				answer:
					"ZIAN is specifically designed for micro-enterprises with 1-10 employees and asset values under ₱3M. It's ideal for hardware stores, motor parts shops, and cafes in the Philippines.",
			},
		],
	},

	// Filipino Configuration (for future i18n)
	fil: {
		title: "ZIAN | Inventory Management at Analytics para sa MSMEs",
		description:
			"Cloud-based inventory management system para sa maliit na negosyo sa Pilipinas. Subaybayan ang stock, pamahalaan ang suppliers, at suriin ang asset health gamit ang ZIAN.",
		shortDescription:
			"Inventory management at analytics para sa maliliit na negosyo sa Pilipinas",
		locale: "fil_PH",
		keywords: [
			"inventory management Philippines",
			"inventory management system Pilipinas",
			"stock tracking software",
			"inventory management para sa maliit na negosyo",
			"free inventory management",
			"FEFO batch tracking",
		],
	},

	// Organization Details
	organization: {
		name: "ZIAN",
		tagline: "Inventory Management & Analytics for Philippine MSMEs",
		description:
			"Cloud-based inventory management system with business intelligence built for micro-enterprises in the Philippines.",
		url: getBaseUrl(),
		email: "hello@zian.com", // Placeholder
		phone: "+63-2-XXXX-XXXX", // Placeholder
		foundedYear: 2024,
		foundedBy: "NEUST Innovation Management Office",
		country: "Philippines",
		areaServed: ["PH"],
		serviceTypes: [
			"Inventory Management",
			"Business Intelligence",
			"Asset Optimization",
			"Analytics",
		],
	},

	// Software Application Details
	softwareApplication: {
		applicationCategory: "BusinessApplication",
		operatingSystem: "Web",
		browserRequirements: "Modern browsers with JavaScript enabled",
		mobileOptimized: true,
		offers: {
			price: "0",
			priceCurrency: "PHP",
			priceValidUntil: "2026-12-31",
		},
		targetAudience: "Small business owners, store managers, inventory staff",
		audienceDescription:
			"Micro-enterprises with 1-10 employees, asset values under ₱3M, including hardware stores, motor parts shops, and cafes.",
	},

	// Default to English
	locale: "en_PH",
};

/**
 * Generate JSON-LD schemas for SEO
 */

export const generateOrganizationSchema = (baseUrl: string) => ({
	"@context": "https://schema.org",
	"@type": "Organization",
	name: seoConfig.organization.name,
	alternateName: ["ZIAN Inventory Management", "ZIAN Analytics"],
	url: baseUrl,
	logo: `${baseUrl}/logo.png`,
	description: seoConfig.organization.description,
	tagline: seoConfig.organization.tagline,
	email: seoConfig.organization.email,
	telephone: seoConfig.organization.phone,
	foundingDate: "2024",
	founder: {
		"@type": "Organization",
		name: seoConfig.organization.foundedBy,
	},
	areaServed: {
		"@type": "Country",
		name: "PH",
	},
	serviceType: seoConfig.organization.serviceTypes,
	knowsAbout: [
		"Inventory Management",
		"Business Intelligence",
		"Asset Optimization",
		"Analytics",
		"FEFO Batch Tracking",
		"Dead Stock Analysis",
		"Inventory Forecasting",
	],
	sameAs: ["https://facebook.com/zian", "https://twitter.com/ZIANInventory"],
});

export const generateSoftwareApplicationSchema = (baseUrl: string) => ({
	"@context": "https://schema.org",
	"@type": "SoftwareApplication",
	name: seoConfig.siteName,
	alternateName: "ZIAN",
	description: seoConfig.organization.description,
	url: baseUrl,
	applicationCategory: seoConfig.softwareApplication.applicationCategory,
	operatingSystem: seoConfig.softwareApplication.operatingSystem,
	browserRequirements: seoConfig.softwareApplication.browserRequirements,
	softwareVersion: "1.0",
	releaseNotes: "Initial release - inventory management with BI analytics",
	offers: {
		"@type": "Offer",
		price: seoConfig.softwareApplication.offers.price,
		priceCurrency: seoConfig.softwareApplication.offers.priceCurrency,
		priceValidUntil: seoConfig.softwareApplication.offers.priceValidUntil,
	},
	featureList: seoConfig.en.features.map((f) => `${f.title}: ${f.description}`),
	author: {
		"@type": "Organization",
		name: seoConfig.organization.foundedBy,
	},
	publisher: {
		"@type": "Organization",
		name: seoConfig.organization.name,
	},
	audience: {
		"@type": "Audience",
		audienceType: seoConfig.softwareApplication.targetAudience,
	},
});

export const generateWebsiteSchema = (baseUrl: string) => ({
	"@context": "https://schema.org",
	"@type": "WebSite",
	name: seoConfig.siteName,
	description: seoConfig.en.shortDescription,
	url: baseUrl,
	inLanguage: ["en", "fil"],
	potentialAction: {
		"@type": "SearchAction",
		target: {
			"@type": "EntryPoint",
			urlTemplate: `${baseUrl}?q={search_term_string}`,
		},
		"query-input": "required name=search_term_string",
	},
});
