import { ImageResponse } from "next/og";
// import { seoConfig } from "@/lib/seo";

export const runtime = "edge";
export const size = {
	width: 1200,
	height: 630,
};
export const contentType = "image/png";

export default async function Image() {
	return new ImageResponse(
		<div
			style={{
				width: "100%",
				height: "100%",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				background: "#f3f9ff",
				position: "relative",
				overflow: "hidden",
			}}
		>
			{/* Subtle accent shapes */}
			<div
				style={{
					position: "absolute",
					top: "-100px",
					right: "-100px",
					width: "300px",
					height: "300px",
					background: "rgba(102, 126, 234, 0.08)",
					borderRadius: "50%",
				}}
			/>
			<div
				style={{
					position: "absolute",
					bottom: "-80px",
					left: "-80px",
					width: "250px",
					height: "250px",
					background: "rgba(102, 126, 234, 0.06)",
					borderRadius: "50%",
				}}
			/>

			{/* Brand mark */}
			<div
				style={{
					position: "absolute",
					top: "40px",
					left: "40px",
					width: "60px",
					height: "60px",
					background: "linear-gradient(135deg, #1447e6 0%, #667eea 100%)",
					borderRadius: "12px",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					fontSize: "28px",
					fontWeight: "900",
					color: "white",
					fontFamily: "system-ui, -apple-system",
				}}
			>
				Z
			</div>

			{/* Content */}
			<div
				style={{
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: "24px",
					textAlign: "center",
					maxWidth: "900px",
					paddingBottom: "40px",
					position: "relative",
					zIndex: 1,
				}}
			>
				{/* Main title */}
				<h1
					style={{
						fontSize: "72px",
						fontWeight: "900",
						margin: 0,
						color: "#1f2937",
						lineHeight: "1.2",
						fontFamily: "system-ui, -apple-system",
						letterSpacing: "-2px",
					}}
				>
					ZIAN
				</h1>

				{/* Subtitle */}
				<div
					style={{
						fontSize: "36px",
						fontWeight: "600",
						color: "#1447e6",
						margin: "16px 0 0 0",
						fontFamily: "system-ui, -apple-system",
					}}
				>
					Inventory Management
				</div>

				{/* Description */}
				<p
					style={{
						fontSize: "28px",
						color: "#6b7280",
						margin: "12px 0 0 0",
						lineHeight: "1.5",
						fontFamily: "system-ui, -apple-system",
						fontWeight: "400",
					}}
				>
					For Philippine Micro-Enterprises
				</p>

				{/* Accent line */}
				<div
					style={{
						width: "120px",
						height: "4px",
						background: "linear-gradient(90deg, #1447e6 0%, #667eea 100%)",
						borderRadius: "2px",
						marginTop: "16px",
					}}
				/>

				{/* Tagline */}
				<p
					style={{
						fontSize: "18px",
						color: "#9ca3af",
						margin: "12px 0 0 0",
						fontFamily: "system-ui, -apple-system",
						fontWeight: "500",
						letterSpacing: "0.5px",
					}}
				>
					Track. Analyze. Optimize.
				</p>
			</div>
		</div>,
		{ ...size },
	);
}
