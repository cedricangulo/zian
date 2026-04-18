export function formatCategoryLabel(value: string) {
	return value
		.split(/[_\s]+/)
		.filter(Boolean)
		.map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
		.join(" ");
}