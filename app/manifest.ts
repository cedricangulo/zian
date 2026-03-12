import type { MetadataRoute } from "next";
import { getBaseUrl, seoConfig } from "@/lib/seo";

export default function manifest(): MetadataRoute.Manifest {
	const _baseUrl = getBaseUrl();

	return {
		name: seoConfig.appName,
		short_name: seoConfig.shortName,
		description: seoConfig.en.description,
		start_url: "/",
		scope: "/",
		display: "standalone",
		orientation: "portrait-primary",
		theme_color: "#ffffff",
		background_color: "#ffffff",
		categories: ["business", "productivity"],
		screenshots: [
			{
				src: "/screenshots/dashboard-mobile.png",
				sizes: "540x720",
				type: "image/png",
				form_factor: "narrow",
			},
			{
				src: "/screenshots/dashboard-desktop.png",
				sizes: "1280x720",
				type: "image/png",
				form_factor: "wide",
			},
		],
		icons: [
			{
				src: "/favicon.ico",
				sizes: "16x16 32x32 48x48",
				type: "image/x-icon",
			},
			{
				src: "/icon-192.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/icon-512.png",
				sizes: "512x512",
				type: "image/png",
				purpose: "any",
			},
			{
				src: "/icon-maskable-192.png",
				sizes: "192x192",
				type: "image/png",
				purpose: "maskable",
			},
		],
		shortcuts: [
			{
				name: "Dashboard",
				short_name: "Dashboard",
				description: "View your inventory dashboard",
				url: "/dashboard",
				icons: [
					{
						src: "/icon-96.png",
						sizes: "96x96",
						type: "image/png",
					},
				],
			},
		],
		prefer_related_applications: false,
	};
}
