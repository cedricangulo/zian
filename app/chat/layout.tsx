import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "Chat with ZIAN",
	description:
		"Engage in a conversation with ZIAN, your intelligent assistant for inventory management and business insights.",
};

export default function ChatLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	return <>{children}</>;
}
