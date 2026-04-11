"use client";

import { motion } from "motion/react";
import Image from "next/image";
import { AspectRatio } from "@/components/ui/aspect-ratio";

export default function HeroImage() {
	return (
		<motion.div
			initial={{ opacity: 0, y: 80, filter: "blur(10px)" }}
			animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
			transition={{ delay: 1, type: "spring", damping: 12, stiffness: 100 }}
			exit={{ opacity: 0, y: 20 }}
			className="w-full max-w-150 overflow-hidden dark:mask-[linear-gradient(to_top,transparent,white_40px)]"
		>
			<AspectRatio ratio={3 / 2}>
				<Image
					className="-mb-60 h-full w-full select-none object-cover lg:-mb-40"
					src="/image-placeholder.png"
					priority
					alt="Hero Image"
					width={1920}
					height={1280}
					quality={85}
					draggable={false}
					fetchPriority="high"
				/>
			</AspectRatio>
		</motion.div>
	);
}
