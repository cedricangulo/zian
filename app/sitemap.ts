import type { MetadataRoute } from "next";
import { getBaseUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
	const baseUrl = getBaseUrl();
	const now = new Date();

	return [
		{
			url: baseUrl,
			lastModified: now,
			changeFrequency: "weekly",
			priority: 1,
		},
		// Future routes to add when pages are created:
		// { url: `${baseUrl}/features`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
		// { url: `${baseUrl}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
		// { url: `${baseUrl}/about`, lastModified: now, changeFrequency: "yearly", priority: 0.6 },
	];
}
