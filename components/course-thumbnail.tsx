import type { Course } from "@/lib/types";

function hashText(value: string) {
	let hash = 0;
	for (let index = 0; index < value.length; index += 1) {
		hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
	}
	return hash;
}

function getThumbnailKind(course: Course) {
	const text =
		`${course.title} ${course.topic} ${course.description}`.toLowerCase();
	if (/minecraft|mod|code|program|javascript|python|java|software/.test(text)) {
		return "code";
	}
	if (
		/attention|transformer|neural|ai|model|machine learning|network/.test(text)
	) {
		return "network";
	}
	if (/math|equation|calculus|algebra|physics|statistics/.test(text)) {
		return "math";
	}
	if (/language|write|reading|history|story|literature/.test(text)) {
		return "book";
	}
	return "map";
}

export function CourseThumbnail({ course }: { course: Course }) {
	const hash = hashText(`${course.title}-${course.topic}`);
	const palettes = [
		{ bg: "#FAF7FF", a: "#D8C7FF", b: "#B8D9FF", c: "#5ABDAC" },
		{ bg: "#F8FBFF", a: "#B8D9FF", b: "#D8C7FF", c: "#DFB431" },
		{ bg: "#FBFFF8", a: "#5ABDAC", b: "#D8C7FF", c: "#879A39" },
	];
	const palette = palettes[hash % palettes.length];
	const kind = getThumbnailKind(course);
	const titleSeed = course.title.slice(0, 2).toUpperCase();

	return (
		<div className="flex size-16 items-center justify-center overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-secondary))] shadow-sm">
			<svg
				viewBox="0 0 160 160"
				className="h-full w-full"
				role="img"
				aria-label={`${course.title} notebook image`}
			>
				<rect width="160" height="160" rx="28" fill={palette.bg} />
				<circle cx="132" cy="28" r="34" fill={palette.a} opacity="0.65" />
				<circle cx="24" cy="132" r="38" fill={palette.b} opacity="0.55" />
				{kind === "code" ? (
					<>
						<rect
							x="32"
							y="36"
							width="96"
							height="88"
							rx="16"
							fill="#FFFFFF"
							stroke="#2B2438"
							strokeWidth="6"
						/>
						<rect
							x="32"
							y="36"
							width="96"
							height="22"
							rx="16"
							fill={palette.c}
							stroke="#2B2438"
							strokeWidth="6"
						/>
						<path
							d="M63 76 L48 91 L63 106"
							fill="none"
							stroke="#2B2438"
							strokeWidth="8"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<path
							d="M97 76 L112 91 L97 106"
							fill="none"
							stroke="#2B2438"
							strokeWidth="8"
							strokeLinecap="round"
							strokeLinejoin="round"
						/>
						<path
							d="M86 72 L74 110"
							fill="none"
							stroke="#2B2438"
							strokeWidth="7"
							strokeLinecap="round"
						/>
					</>
				) : null}
				{kind === "network" ? (
					<>
						<path
							d="M45 105 C70 52 95 52 119 105"
							fill="none"
							stroke="#2B2438"
							strokeWidth="7"
							strokeLinecap="round"
						/>
						<path
							d="M43 57 C70 110 93 110 118 57"
							fill="none"
							stroke="#2B2438"
							strokeWidth="7"
							strokeLinecap="round"
						/>
						{[
							[43, 57],
							[80, 80],
							[118, 57],
							[45, 105],
							[119, 105],
						].map(([x, y], index) => (
							<circle
								key={`${x}-${y}`}
								cx={x}
								cy={y}
								r="13"
								fill={index === 1 ? palette.c : palette.a}
								stroke="#2B2438"
								strokeWidth="5"
							/>
						))}
					</>
				) : null}
				{kind === "math" ? (
					<>
						<path
							d="M28 105 C50 78 55 50 78 78 C98 102 111 84 132 55"
							fill="none"
							stroke="#2B2438"
							strokeWidth="7"
							strokeLinecap="round"
						/>
						<line
							x1="32"
							y1="120"
							x2="128"
							y2="120"
							stroke="#2B2438"
							strokeWidth="6"
							strokeLinecap="round"
						/>
						<line
							x1="40"
							y1="35"
							x2="40"
							y2="122"
							stroke="#2B2438"
							strokeWidth="6"
							strokeLinecap="round"
						/>
						<circle
							cx="78"
							cy="78"
							r="12"
							fill={palette.c}
							stroke="#2B2438"
							strokeWidth="5"
						/>
					</>
				) : null}
				{kind === "book" ? (
					<>
						<path
							d="M35 45 H78 C88 45 94 51 94 61 V119 C88 113 81 111 72 111 H35 Z"
							fill={palette.a}
							stroke="#2B2438"
							strokeWidth="6"
							strokeLinejoin="round"
						/>
						<path
							d="M125 45 H82 C72 45 66 51 66 61 V119 C72 113 79 111 88 111 H125 Z"
							fill={palette.b}
							stroke="#2B2438"
							strokeWidth="6"
							strokeLinejoin="round"
						/>
						<line
							x1="80"
							y1="50"
							x2="80"
							y2="116"
							stroke="#2B2438"
							strokeWidth="5"
						/>
					</>
				) : null}
				{kind === "map" ? (
					<>
						<rect
							x="35"
							y="39"
							width="90"
							height="82"
							rx="18"
							fill="#FFFFFF"
							stroke="#2B2438"
							strokeWidth="6"
						/>
						<circle
							cx="59"
							cy="67"
							r="12"
							fill={palette.a}
							stroke="#2B2438"
							strokeWidth="5"
						/>
						<circle
							cx="101"
							cy="91"
							r="12"
							fill={palette.c}
							stroke="#2B2438"
							strokeWidth="5"
						/>
						<path
							d="M68 72 C78 76 83 83 92 88"
							fill="none"
							stroke="#2B2438"
							strokeWidth="6"
							strokeLinecap="round"
						/>
						<text
							x="80"
							y="138"
							textAnchor="middle"
							fontFamily="Inter, Arial"
							fontSize="22"
							fontWeight="800"
							fill="#2B2438"
						>
							{titleSeed}
						</text>
					</>
				) : null}
			</svg>
		</div>
	);
}
