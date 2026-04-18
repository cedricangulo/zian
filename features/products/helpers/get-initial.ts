export const getInitials = (value: string) => {
	const segments = value.trim().split(" ").filter(Boolean);

	if (segments.length === 0) {
		return "RM";
	}

	return segments
		.slice(0, 2)
		.map((segment) => segment[0]?.toUpperCase() ?? "")
		.join("");
};
