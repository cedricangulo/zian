import { DashboardShell } from "@/features/dashboard";
import { AddSupplierDialogButton } from "@/features/suppliers";

export default function SuppliersPage() {
	return (
		<DashboardShell
			title={<h2 className="type-lg">Suppliers</h2>}
			action={<AddSupplierDialogButton />}
		>
			<div />
		</DashboardShell>
	);
}
