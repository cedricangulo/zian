import { DashboardShell } from "@/features/dashboard";
import { AddProductDialogButton } from "@/features/products";

export default function ProductsPage() {
	return (
		<DashboardShell
			title={<h2 className="type-lg">Dispatch Products</h2>}
			action={<AddProductDialogButton />}
		>
			<div />
		</DashboardShell>
	);
}
