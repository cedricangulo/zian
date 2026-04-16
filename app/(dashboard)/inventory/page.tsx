import { DashboardShell as InventoryShell } from "@/features/dashboard";
import { AddStockDialogButton } from "@/features/inventory";

export default function InventoryPage() {
	return (
		<InventoryShell
			title={<h2 className="type-lg">Inventory Hub</h2>}
			action={<AddStockDialogButton />}
		>
			<div />
		</InventoryShell>
	);
}
