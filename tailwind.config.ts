import type { Config } from "tailwindcss";

const config: Config = {
	content: [
		"./app/**/*.{ts,tsx}",
		"./components/**/*.{ts,tsx}",
		"./lib/**/*.{ts,tsx}",
	],
	theme: {
		extend: {
			colors: {
				background: "#0f172a",
				surface: "#111827",
				card: "#0b1220",
				accent: "#8b5cf6",
				accentSecondary: "#22c55e",
				border: "rgba(148, 163, 184, 0.18)",
			},
			boxShadow: {
				glow: "0 0 0 1px rgba(139, 92, 246, 0.18), 0 12px 30px rgba(15, 23, 42, 0.45)",
			},
		},
	},
	plugins: [],
};

export default config;
