import { Suspense } from "react";
import { ProductsDispatchWorkspace } from "@/features/products/components/products-dispatch-workspace";

export default function ProductsPage() {
	return (
		<Suspense
			fallback={
				<p className="type-sm text-muted-foreground">Loading products...</p>
			}
		>
			<ProductsDispatchWorkspace />
		</Suspense>
	);
}
