import { navigationItems } from "./navigation-items";

export const footerLinks = [
	{
		title: "Menu",
		links: navigationItems.map((item) => ({
			name: item.name,
			href: item.href,
		})),
	},
	{
    title: "Support",
    links: [
      { name: "Help Center", href: "/help" },
      { name: "Contact Us", href: "/contact" },
      { name: "FAQs", href: "/faqs" },
    ],
	},
	{
    title: "Social Media",
    links: [
      { name: "Facebook", href: "#" },
      { name: "Instagram", href: "#" },
      { name: "X (Twitter)", href: "#" },
    ],
	},
];
