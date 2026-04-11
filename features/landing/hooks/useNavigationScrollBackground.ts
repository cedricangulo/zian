"use client";

import { useEffect, useState } from "react";

const SCROLL_THRESHOLD = 12;

export function useNavigationScrollBackground() {
	const [isScrolled, setIsScrolled] = useState(false);

	useEffect(() => {
		const updateScrollState = () => {
			setIsScrolled(window.scrollY > SCROLL_THRESHOLD);
		};

		updateScrollState();
		window.addEventListener("scroll", updateScrollState, { passive: true });
		window.addEventListener("resize", updateScrollState);

		return () => {
			window.removeEventListener("scroll", updateScrollState);
			window.removeEventListener("resize", updateScrollState);
		};
	}, []);

	return isScrolled;
}