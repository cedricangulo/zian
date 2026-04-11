"use client";

import { useEffect, useState } from "react";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

export function useTestimonialAutoScroll() {
	const [prefersReducedMotion, setPrefersReducedMotion] = useState(() => {
		if (typeof window === "undefined") {
			return false;
		}

		return window.matchMedia(REDUCED_MOTION_QUERY).matches;
	});
	const [isPaused, setIsPaused] = useState(false);

	useEffect(() => {
		const mediaQuery = window.matchMedia(REDUCED_MOTION_QUERY);
		const handleChange = () => {
			setPrefersReducedMotion(mediaQuery.matches);
		};

		handleChange();
		mediaQuery.addEventListener("change", handleChange);

		return () => {
			mediaQuery.removeEventListener("change", handleChange);
		};
	}, []);

	const togglePause = () => {
		setIsPaused((current) => !current);
	};

	return {
		isPaused,
		prefersReducedMotion,
		togglePause,
	};
}