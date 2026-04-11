"use client";

import { Measurer } from "mesurer";

export default function MeasurerWrapper() {
	if (process.env.NODE_ENV === "production") {
		return null;
	}

	return <Measurer />;
}
