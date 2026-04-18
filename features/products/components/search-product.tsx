import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

import { formatCategoryLabel } from "../helpers";

type Props = {
	search: string;
	onSearchChange: (value: string) => void;
	category: string;
	categories: string[];
	onCategoryChange: (value: string) => void;
};

export function ProductsSearchSection({
	search,
	onSearchChange,
	category,
	categories,
	onCategoryChange,
}: Props) {
	return (
		<div className="flex w-1/2 gap-6">
			<div className="relative w-full">
				<Search className="absolute text-muted-foreground left-3 top-1/2 size-4 -translate-y-1/2" />
				<Input
					value={search}
					onChange={(event) => onSearchChange(event.target.value)}
					placeholder="Search"
					className="pl-9 max-w-prose"
				/>
			</div>
			<Select value={category} onValueChange={onCategoryChange}>
				<SelectTrigger className="w-fit">
					<SelectValue placeholder="All Categories" />
				</SelectTrigger>
				<SelectContent>
					{categories.map((itemCategory) => (
						<SelectItem key={itemCategory} value={itemCategory}>
							{itemCategory === "all"
								? "All Categories"
								: formatCategoryLabel(itemCategory)}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</div>
	);
}
