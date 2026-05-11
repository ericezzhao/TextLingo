import type { Metadata } from "next";

import "@/app/globals.css";

export const metadata: Metadata = {
	title: "TextLingo",
	description:
		"Generate AI-powered courses with lessons, quizzes, and progress tracking.",
};

export default function RootLayout({
	children,
}: Readonly<{ children: React.ReactNode }>) {
	return (
		<html lang="en">
			<body>{children}</body>
		</html>
	);
}
