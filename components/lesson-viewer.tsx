"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { getCourse, updateCourse } from "@/lib/course-api";
import type { Course, Lesson, LessonPage, LessonVisual } from "@/lib/types";
import { getNextLesson } from "@/lib/utils";

type LessonViewerProps = {
	courseId: string;
	lessonId: string;
};

type TutorMessage = {
	role: "user" | "assistant";
	content: string;
};

type QuizOption = {
	text: string;
	originalIndex: number;
};

type LessonPageData =
	| {
			title: string;
			type:
				| "intro"
				| "explanation"
				| "visual"
				| "points"
				| "examples"
				| "quiz"
				| "exercise"
				| "summary"
				| "lesson-review";
	  }
	| {
			title: string;
			type: "generated";
			page: LessonPage;
	  };

function shuffleOptions(options: string[], answerIndex: number): QuizOption[] {
	const shuffled = options.map((text, originalIndex) => ({
		text,
		originalIndex,
	}));
	for (let index = shuffled.length - 1; index > 0; index -= 1) {
		const swapIndex = Math.floor(Math.random() * (index + 1));
		[shuffled[index], shuffled[swapIndex]] = [
			shuffled[swapIndex],
			shuffled[index],
		];
	}
	if (shuffled[0]?.originalIndex === answerIndex && shuffled.length > 1) {
		[shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
	}
	return shuffled;
}

function labelLines(value: string, maxLength = 14) {
	const words = value.split(/\s+/).filter(Boolean);
	const lines: string[] = [];
	let current = "";

	for (const word of words) {
		const next = current ? `${current} ${word}` : word;
		if (next.length > maxLength && current) {
			lines.push(current);
			current = word;
		} else {
			current = next;
		}
	}
	if (current) lines.push(current);
	return lines.slice(0, 3);
}

function SvgLabel({
	x,
	y,
	text,
	maxLength = 14,
	fontSize = 24,
	fill = "#2B2438",
}: {
	x: number;
	y: number;
	text: string;
	maxLength?: number;
	fontSize?: number;
	fill?: string;
}) {
	const lines = labelLines(text, maxLength);
	const startY = y - ((lines.length - 1) * fontSize * 0.6) / 2;
	return (
		<text
			x={x}
			y={startY}
			fontFamily="Inter, Arial, sans-serif"
			fontSize={fontSize}
			fontWeight="700"
			fill={fill}
			textAnchor="middle"
			dominantBaseline="middle"
		>
			{lines.map((line, index) => (
				<tspan key={line} x={x} dy={index === 0 ? 0 : fontSize * 1.12}>
					{line}
				</tspan>
			))}
		</text>
	);
}

function GeneratedVisual({ visual }: { visual: LessonVisual }) {
	if (
		visual.type === "table" &&
		visual.columns?.length &&
		visual.rows?.length
	) {
		return (
			<div className="my-5 overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] shadow-sm">
				<div className="border-b border-[hsl(var(--border))] bg-[hsl(var(--brand))] px-5 py-3 font-semibold">
					{visual.title}
				</div>
				<div className="overflow-x-auto">
					<table className="w-full text-left text-sm">
						<thead>
							<tr className="border-b border-[hsl(var(--border))]">
								{visual.columns.map((column) => (
									<th key={column} className="px-4 py-3 font-semibold">
										{column}
									</th>
								))}
							</tr>
						</thead>
						<tbody>
							{visual.rows.map((row, rowIndex) => (
								<tr
									key={`${visual.title}-${rowIndex}`}
									className="border-b border-[hsl(var(--border))] last:border-b-0"
								>
									{row.map((cell, cellIndex) => (
										<td
											key={`${cell}-${cellIndex}`}
											className="px-4 py-3 text-[hsl(var(--text-secondary))]"
										>
											{cell}
										</td>
									))}
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		);
	}

	const visualTitle = visual.title?.trim() || "Diagram";
	const visualCaption = visual.caption?.trim() || "Key relationship";
	const items = visual.items?.length
		? visual.items.slice(0, 5).map((item) => item || "Step")
		: ["Concept", "Mechanism", "Result"];
	const [
		first = "Concept",
		second = "Mechanism",
		third = "Result",
		fourth = "Check",
	] = items;
	const markerId = `arrow-${visualTitle.replace(/\W/g, "") || "diagram"}`;
	const isCompare = visual.type === "comparison" || items.length === 4;
	const frameClass =
		"svg-illustration my-5 overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--cream))] shadow-sm lg:mx-auto lg:max-w-[68%]";
	const marker = (
		<defs>
			<marker
				id={markerId}
				markerWidth="12"
				markerHeight="10"
				refX="10"
				refY="5"
				orient="auto"
				markerUnits="userSpaceOnUse"
			>
				<polygon points="0 0, 12 5, 0 10" fill="#2B2438" />
			</marker>
		</defs>
	);
	const title = (
		<SvgLabel x={400} y={58} text={visualTitle} maxLength={26} fontSize={30} />
	);
	const box = (
		x: number,
		y: number,
		w: number,
		h: number,
		fill: string,
		text: string,
		max = 14,
	) => (
		<>
			<rect
				x={x}
				y={y}
				width={w}
				height={h}
				rx="16"
				fill={fill}
				stroke="#2B2438"
				strokeWidth="4"
			/>
			<SvgLabel
				x={x + w / 2}
				y={y + h / 2}
				text={text}
				maxLength={max}
				fontSize={22}
			/>
		</>
	);
	const frame = (children: ReactNode) => (
		<div className={frameClass} role="img" aria-label={visualTitle}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 800 600"
				className="h-auto w-full"
			>
				<rect width="800" height="600" fill="#FAF7FF" />
				{marker}
				{title}
				{children}
			</svg>
		</div>
	);

	if (visual.type === "mask-barrier") {
		return frame(
			<>
				<line
					x1="95"
					y1="475"
					x2="705"
					y2="475"
					stroke="#2B2438"
					strokeWidth="4"
					markerEnd={`url(#${markerId})`}
				/>
				<SvgLabel x={675} y={525} text="Time" maxLength={8} fontSize={22} />
				{box(105, 330, 140, 80, "#5ABDAC", first)}
				{box(320, 330, 140, 80, "#B8D9FF", second)}
				<rect
					x="560"
					y="330"
					width="140"
					height="80"
					rx="16"
					fill="#E7E2EA"
					stroke="#2B2438"
					strokeWidth="4"
					strokeDasharray="8 6"
				/>
				<SvgLabel
					x={630}
					y={370}
					text={third}
					maxLength={12}
					fontSize={22}
					fill="#7B7284"
				/>
				<line
					x1="505"
					y1="150"
					x2="505"
					y2="445"
					stroke="#2B2438"
					strokeWidth="7"
					strokeLinecap="round"
				/>
				<SvgLabel x={570} y={170} text="MASK" maxLength={8} fontSize={25} />
				<path
					d="M320 330 C250 245 190 290 160 322"
					fill="none"
					stroke="#2B2438"
					strokeWidth="4"
					markerEnd={`url(#${markerId})`}
				/>
				<SvgLabel
					x={235}
					y={235}
					text="Can look back"
					maxLength={16}
					fontSize={21}
				/>
				<SvgLabel
					x={635}
					y={295}
					text="Future hidden"
					maxLength={16}
					fontSize={21}
				/>
			</>,
		);
	}

	if (visual.type === "token-arcs") {
		return frame(
			<>
				{items.slice(0, 5).map((item, index) => {
					const x = 55 + index * 145;
					return (
						<g key={`${item}-${index}`}>
							{box(
								x,
								260,
								112,
								72,
								index === 1 ? "#DFB431" : index === 4 ? "#5ABDAC" : "#B8D9FF",
								item,
								10,
							)}
						</g>
					);
				})}
				<path
					d="M170 260 C230 160 315 160 365 260"
					fill="none"
					stroke="#2B2438"
					strokeWidth="4"
					markerEnd={`url(#${markerId})`}
				/>
				<path
					d="M170 332 C310 455 520 455 635 332"
					fill="none"
					stroke="#2B2438"
					strokeWidth="4"
					markerEnd={`url(#${markerId})`}
				/>
				<SvgLabel
					x={400}
					y={455}
					text={visualCaption}
					maxLength={28}
					fontSize={22}
				/>
			</>,
		);
	}

	if (
		visual.type === "architecture-stack" ||
		visual.type === "equation-pipeline"
	) {
		return frame(
			<>
				{box(250, 120, 300, 70, "#B8D9FF", first, 22)}
				{box(250, 225, 300, 70, "#D8C7FF", second, 22)}
				{box(250, 330, 300, 70, "#5ABDAC", third, 22)}
				{box(250, 435, 300, 70, "#DFB431", fourth || visualCaption, 22)}
				<line
					x1="400"
					y1="190"
					x2="400"
					y2="220"
					stroke="#2B2438"
					strokeWidth="5"
					markerEnd={`url(#${markerId})`}
				/>
				<line
					x1="400"
					y1="295"
					x2="400"
					y2="325"
					stroke="#2B2438"
					strokeWidth="5"
					markerEnd={`url(#${markerId})`}
				/>
				<line
					x1="400"
					y1="400"
					x2="400"
					y2="430"
					stroke="#2B2438"
					strokeWidth="5"
					markerEnd={`url(#${markerId})`}
				/>
			</>,
		);
	}

	if (visual.type === "matrix") {
		return frame(
			<>
				{Array.from({ length: 5 }).map((_, row) =>
					Array.from({ length: 5 }).map((__, col) => (
						<rect
							key={`${row}-${col}`}
							x={220 + col * 62}
							y={150 + row * 52}
							width="48"
							height="40"
							rx="8"
							fill={row === col ? "#DFB431" : col < row ? "#5ABDAC" : "#D8C7FF"}
							stroke="#2B2438"
							strokeWidth="2"
							opacity={col > row ? 0.45 : 1}
						/>
					)),
				)}
				<SvgLabel
					x={400}
					y={455}
					text={visualCaption}
					maxLength={30}
					fontSize={22}
				/>
			</>,
		);
	}

	if (visual.type === "timeline") {
		return frame(
			<>
				<line
					x1="110"
					y1="330"
					x2="690"
					y2="330"
					stroke="#2B2438"
					strokeWidth="5"
					markerEnd={`url(#${markerId})`}
				/>
				{items.slice(0, 4).map((item, index) => (
					<g key={`${item}-${index}`}>
						<circle
							cx={145 + index * 160}
							cy="330"
							r="18"
							fill="#DFB431"
							stroke="#2B2438"
							strokeWidth="4"
						/>
						{box(
							82 + index * 160,
							185 + (index % 2) * 205,
							126,
							72,
							index % 2 ? "#5ABDAC" : "#B8D9FF",
							item,
							11,
						)}
					</g>
				))}
			</>,
		);
	}

	if (visual.type === "branching-map") {
		return frame(
			<>
				{box(260, 105, 280, 80, "#DFB431", first, 20)}
				{box(75, 300, 190, 82, "#B8D9FF", second)}
				{box(305, 330, 190, 82, "#D8C7FF", third)}
				{box(535, 300, 190, 82, "#5ABDAC", fourth)}
				<line
					x1="330"
					y1="185"
					x2="200"
					y2="295"
					stroke="#2B2438"
					strokeWidth="4"
					markerEnd={`url(#${markerId})`}
				/>
				<line
					x1="400"
					y1="185"
					x2="400"
					y2="325"
					stroke="#2B2438"
					strokeWidth="4"
					markerEnd={`url(#${markerId})`}
				/>
				<line
					x1="470"
					y1="185"
					x2="600"
					y2="295"
					stroke="#2B2438"
					strokeWidth="4"
					markerEnd={`url(#${markerId})`}
				/>
			</>,
		);
	}

	return (
		<div
			className="svg-illustration my-5 overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--cream))] shadow-sm lg:mx-auto lg:max-w-[68%]"
			role="img"
			aria-label={visualTitle}
		>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				viewBox="0 0 800 600"
				className="h-auto w-full"
			>
				<rect width="800" height="600" fill="#FAF7FF" />
				<defs>
					<marker
						id={markerId}
						markerWidth="12"
						markerHeight="10"
						refX="10"
						refY="5"
						orient="auto"
						markerUnits="userSpaceOnUse"
					>
						<polygon points="0 0, 12 5, 0 10" fill="#2B2438" />
					</marker>
				</defs>
				<SvgLabel
					x={400}
					y={58}
					text={visualTitle}
					maxLength={26}
					fontSize={30}
				/>

				{isCompare ? (
					<>
						<rect
							x="70"
							y="150"
							width="285"
							height="250"
							rx="18"
							fill="#B8D9FF"
							stroke="#2B2438"
							strokeWidth="4"
						/>
						<rect
							x="445"
							y="150"
							width="285"
							height="250"
							rx="18"
							fill="#5ABDAC"
							stroke="#2B2438"
							strokeWidth="4"
						/>
						<SvgLabel
							x={212}
							y={260}
							text={first}
							maxLength={15}
							fontSize={27}
						/>
						<SvgLabel
							x={588}
							y={260}
							text={second}
							maxLength={15}
							fontSize={27}
						/>
						<path
							d="M360 270 C390 235 410 235 440 270"
							fill="none"
							stroke="#2B2438"
							strokeWidth="5"
							markerEnd={`url(#${markerId})`}
						/>
						<rect
							x="235"
							y="440"
							width="330"
							height="82"
							rx="16"
							fill="#DFB431"
							stroke="#2B2438"
							strokeWidth="4"
						/>
						<SvgLabel
							x={400}
							y={481}
							text={visualCaption || third}
							maxLength={24}
							fontSize={22}
						/>
					</>
				) : (
					<>
						<rect
							x="72"
							y="200"
							width="165"
							height="108"
							rx="16"
							fill="#B8D9FF"
							stroke="#2B2438"
							strokeWidth="4"
						/>
						<rect
							x="318"
							y="170"
							width="165"
							height="168"
							rx="16"
							fill="#D8C7FF"
							stroke="#2B2438"
							strokeWidth="4"
						/>
						<rect
							x="563"
							y="200"
							width="165"
							height="108"
							rx="16"
							fill="#5ABDAC"
							stroke="#2B2438"
							strokeWidth="4"
						/>
						<SvgLabel x={154} y={254} text={first} />
						<SvgLabel x={400} y={254} text={second} />
						<SvgLabel x={646} y={254} text={third} />
						<line
							x1="240"
							y1="254"
							x2="305"
							y2="254"
							stroke="#2B2438"
							strokeWidth="5"
							markerEnd={`url(#${markerId})`}
						/>
						<line
							x1="486"
							y1="254"
							x2="550"
							y2="254"
							stroke="#2B2438"
							strokeWidth="5"
							markerEnd={`url(#${markerId})`}
						/>
						<rect
							x="260"
							y="410"
							width="280"
							height="82"
							rx="16"
							fill="#DFB431"
							stroke="#2B2438"
							strokeWidth="4"
						/>
						<SvgLabel
							x={400}
							y={451}
							text={visualCaption || fourth}
							maxLength={24}
							fontSize={22}
						/>
					</>
				)}
			</svg>
		</div>
	);
}

function MiniVisual({ lesson, variant }: { lesson: Lesson; variant: number }) {
	const colors = [
		"bg-[hsl(var(--blue))]",
		"bg-[hsl(var(--green))]",
		"bg-[hsl(var(--brand))]",
	];
	const mainIdea = lesson.title;
	const application =
		lesson.keyPoints[0] ?? lesson.summary ?? "Apply the concept";
	return (
		<div className="my-5 overflow-hidden rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--cream))] shadow-sm">
			<div className="relative mx-auto aspect-[4/3] max-h-[360px] w-full p-6">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_20%,hsl(var(--brand-bg)),transparent_30%),radial-gradient(circle_at_80%_75%,hsl(var(--surface-secondary)),transparent_28%)]" />
				<div className="relative flex h-full items-center justify-center">
					{variant % 3 === 0 ? (
						<div className="flex w-full max-w-lg items-center justify-between gap-4">
							<div className="min-h-28 flex-1 rounded-2xl border-2 border-[hsl(var(--text-primary))] bg-[hsl(var(--blue))] px-5 py-5 text-center text-base font-bold shadow-sm">
								{mainIdea}
							</div>
							<div className="text-4xl">→</div>
							<div className="min-h-28 flex-1 rounded-2xl border-2 border-[hsl(var(--text-primary))] bg-[hsl(var(--green))] px-5 py-5 text-center text-base font-bold shadow-sm">
								{application}
							</div>
						</div>
					) : variant % 3 === 1 ? (
						<div className="grid w-full max-w-lg grid-cols-3 gap-3">
							{lesson.keyPoints.slice(0, 3).map((point, index) => (
								<div
									key={point}
									className={`min-h-28 rounded-2xl border-2 border-[hsl(var(--text-primary))] ${colors[index]} p-4 text-sm font-semibold shadow-sm`}
								>
									{point}
								</div>
							))}
						</div>
					) : (
						<div className="w-full max-w-lg overflow-hidden rounded-2xl border-2 border-[hsl(var(--text-primary))] bg-[hsl(var(--surface))]">
							<div className="grid grid-cols-2 border-b-2 border-[hsl(var(--text-primary))] bg-[hsl(var(--brand))] text-sm font-bold uppercase">
								<div className="border-r-2 border-[hsl(var(--text-primary))] p-3">
									Concept
								</div>
								<div className="p-3">Meaning</div>
							</div>
							{lesson.keyPoints.slice(0, 3).map((point, index) => (
								<div
									key={point}
									className="grid grid-cols-2 border-b border-[hsl(var(--border))] text-sm last:border-b-0"
								>
									<div className="border-r border-[hsl(var(--border))] p-3 font-semibold">
										Step {index + 1}
									</div>
									<div className="p-3 text-[hsl(var(--text-secondary))]">
										{point}
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		</div>
	);
}

function buildLessonPages(): LessonPageData[] {
	return [
		{ title: "Overview", type: "intro" },
		{ title: "Core idea", type: "explanation" },
		{ title: "Visual model", type: "visual" },
		{ title: "Key points", type: "points" },
		{ title: "Examples", type: "examples" },
		{ title: "Check", type: "quiz" },
		{ title: "Practice", type: "exercise" },
		{ title: "Wrap-up", type: "summary" },
	];
}

export function LessonViewer({ courseId, lessonId }: LessonViewerProps) {
	const router = useRouter();
	const [course, setCourse] = useState<Course | null>(null);
	const [selectedOption, setSelectedOption] = useState<number | null>(null);
	const [submitted, setSubmitted] = useState(false);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [pageIndex, setPageIndex] = useState(0);
	const [understandingOpen, setUnderstandingOpen] = useState(false);
	const [understandingAnswer, setUnderstandingAnswer] = useState("");
	const [tutorMessages, setTutorMessages] = useState<TutorMessage[]>([]);
	const [tutorLoading, setTutorLoading] = useState(false);
	const [notesOpen, setNotesOpen] = useState(false);
	const [lessonNotes, setLessonNotes] = useState("");

	useEffect(() => {
		let active = true;

		async function load() {
			try {
				const existingCourse = await getCourse(courseId);
				if (!active) return;

				if (!existingCourse) {
					setCourse(null);
					setError(null);
					return;
				}

				if (existingCourse.currentLessonId !== lessonId) {
					const updatedCourse = await updateCourse(courseId, {
						currentLessonId: lessonId,
					});
					if (!active) return;
					setCourse(updatedCourse ?? existingCourse);
				} else {
					setCourse(existingCourse);
				}

				setError(null);
			} catch (err) {
				if (!active) return;
				setError(err instanceof Error ? err.message : "Failed to load lesson.");
			} finally {
				if (active) setLoading(false);
			}
		}

		void load();

		return () => {
			active = false;
		};
	}, [courseId, lessonId]);

	const lesson = useMemo(
		() => course?.lessons.find((item) => item.id === lessonId),
		[course, lessonId],
	);
	const pages = useMemo<LessonPageData[]>(() => {
		if (lesson?.pages?.length) {
			return [
				...lesson.pages.map((page) => ({
					title: page.title,
					type: "generated" as const,
					page,
				})),
				{ title: "Lesson Review", type: "lesson-review" as const },
			];
		}

		return buildLessonPages();
	}, [lesson]);
	const currentPage = pages[pageIndex];
	const firstIncompleteLesson = course?.lessons.find(
		(item) => !course.completedLessonIds.includes(item.id),
	);
	const lessonAccessible = Boolean(
		course &&
			lesson &&
			(course.completedLessonIds.includes(lesson.id) ||
				lesson.id === (firstIncompleteLesson?.id ?? course.lessons[0]?.id)),
	);
	const shuffledQuizOptions = useMemo(
		() =>
			shuffleOptions(lesson?.quiz.options ?? [], lesson?.quiz.answerIndex ?? 0),
		[lesson?.id, lesson?.quiz.answerIndex, lesson?.quiz.options],
	);

	useEffect(() => {
		setSelectedOption(null);
		setSubmitted(false);
		setUnderstandingOpen(false);
		setUnderstandingAnswer("");
		setTutorMessages([]);
		setTutorLoading(false);
		setNotesOpen(false);
		setLessonNotes(
			window.localStorage.getItem(`textlingo-notes:${courseId}:${lessonId}`) ??
				"",
		);
		setPageIndex(0);
	}, [courseId, lessonId]);

	useEffect(() => {
		setSelectedOption(null);
		setSubmitted(false);
		setUnderstandingOpen(false);
		setUnderstandingAnswer("");
		setTutorMessages([]);
		setTutorLoading(false);
	}, [pageIndex]);

	useEffect(() => {
		if (!loading && course && lesson && !lessonAccessible) {
			router.replace(`/course/${course.id}`);
		}
	}, [course, lesson, lessonAccessible, loading, router]);

	if (loading) {
		return (
			<div className="min-h-screen bg-[hsl(var(--surface))] p-8 text-[hsl(var(--text-secondary))]">
				Loading lesson...
			</div>
		);
	}

	if (error || !course || !lesson || !lessonAccessible) {
		return (
			<div className="min-h-screen bg-[hsl(var(--surface))] p-8">
				<div className="mx-auto max-w-3xl rounded-[28px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-8 shadow-sm">
					<h1 className="text-2xl font-semibold">Could not load lesson</h1>
					<p className="mt-2 text-[hsl(var(--text-secondary))]">
						{error ?? "Course not found."}
					</p>
					<Link
						href="/"
						className="mt-4 inline-block text-[hsl(var(--brand-active))] underline"
					>
						Go back home
					</Link>
				</div>
			</div>
		);
	}

	const nextLesson = getNextLesson(course, lessonId);
	const quizCorrect =
		selectedOption !== null &&
		shuffledQuizOptions[selectedOption]?.originalIndex ===
			lesson.quiz.answerIndex;
	const pageCheckQuestion =
		currentPage.type === "generated"
			? currentPage.page.checkQuestion ||
				`In your own words, what is the main idea of “${currentPage.title}” and why does it matter for ${lesson.title}?`
			: `In your own words, what is the main idea of “${currentPage.title}” and why does it matter for ${lesson.title}?`;

	async function completeLesson() {
		if (!course || saving) return;
		try {
			setSaving(true);
			const updatedCourse = await updateCourse(course.id, {
				completeLessonId: lessonId,
				currentLessonId: nextLesson?.id ?? lessonId,
			});
			if (!updatedCourse) throw new Error("Course not found.");
			setCourse(updatedCourse);
			router.push(`/course/${course.id}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to save progress.");
		} finally {
			setSaving(false);
		}
	}

	function goNext() {
		if (currentPage.type === "lesson-review" && !submitted) return;
		if (pageIndex < pages.length - 1) setPageIndex((current) => current + 1);
		else void completeLesson();
	}

	function goBack() {
		if (!course) return;
		if (pageIndex > 0) setPageIndex((current) => current - 1);
		else router.push(`/course/${course.id}`);
	}

	function updateLessonNotes(value: string) {
		setLessonNotes(value);
		window.localStorage.setItem(
			`textlingo-notes:${courseId}:${lessonId}`,
			value,
		);
	}

	async function sendUnderstandingMessage(content?: string) {
		if (!course || !lesson) return;
		const text = (content ?? understandingAnswer).trim();
		if (!text || tutorLoading) return;

		const nextMessages: TutorMessage[] = [
			...tutorMessages,
			{ role: "user", content: text },
		];
		setTutorMessages(nextMessages);
		setUnderstandingAnswer("");
		setTutorLoading(true);

		try {
			const response = await fetch("/api/check-understanding", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					courseTitle: course.title,
					lessonTitle: lesson.title,
					pageTitle: currentPage.title,
					pageBody:
						currentPage.type === "generated"
							? currentPage.page.body
							: lesson.explanation,
					question: pageCheckQuestion,
					messages: nextMessages,
				}),
			});

			const payload = (await response.json().catch(() => ({}))) as {
				reply?: string;
				error?: string;
			};
			if (!response.ok) throw new Error(payload.error ?? "Tutor failed.");
			setTutorMessages([
				...nextMessages,
				{ role: "assistant", content: payload.reply ?? "Let's try again." },
			]);
		} catch (err) {
			setTutorMessages([
				...nextMessages,
				{
					role: "assistant",
					content:
						err instanceof Error
							? err.message
							: "I couldn't check that answer yet.",
				},
			]);
		} finally {
			setTutorLoading(false);
		}
	}

	return (
		<div className="flex min-h-screen flex-col overflow-y-auto bg-[hsl(var(--surface))] text-[hsl(var(--text-primary))]">
			<header className="fixed inset-x-0 top-0 z-40">
				<div className="bg-[linear-gradient(to_bottom,hsl(var(--surface))_0%,hsl(var(--surface))_50%,transparent_100%)] backdrop-blur">
					<div className="mx-auto max-w-4xl p-4">
						<div className="flex items-center justify-between">
							<button
								onClick={() => router.push(`/course/${course.id}`)}
								className="rounded-lg p-1 text-[hsl(var(--text-primary))] transition hover:bg-[hsl(var(--surface-hover))]"
								aria-label="Go back"
							>
								✕
							</button>
							<div className="flex-1 px-4">
								<div className="flex items-center justify-center gap-2">
									{pages.map((page, index) => (
										<button
											key={page.title}
											onClick={() => setPageIndex(index)}
											className={`h-3 rounded-full transition-all ${index === pageIndex ? "w-8 bg-[hsl(var(--brand))]" : "w-3 bg-[hsl(var(--surface-tertiary))] hover:bg-[hsl(var(--border-hover))]"}`}
											aria-label={`Go to page ${index + 1}`}
										/>
									))}
								</div>
							</div>
							<button
								type="button"
								onClick={() => setNotesOpen(true)}
								className="rounded-lg p-1 text-[hsl(var(--text-primary))] transition hover:bg-[hsl(var(--surface-hover))]"
								aria-label="Open lesson notes"
							>
								<svg
									xmlns="http://www.w3.org/2000/svg"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									strokeWidth="2"
									strokeLinecap="round"
									strokeLinejoin="round"
									className="size-6"
									aria-hidden="true"
								>
									<path d="M2 6h4" />
									<path d="M2 10h4" />
									<path d="M2 14h4" />
									<path d="M2 18h4" />
									<rect width="16" height="20" x="4" y="2" rx="2" />
									<path d="M16 2v20" />
								</svg>
							</button>
						</div>
					</div>
				</div>
			</header>

			<main className="flex-1 pb-36 pt-20">
				<div className="mx-auto max-w-3xl px-6 py-3">
					<div
						className={
							pageIndex === 0
								? "flex min-h-[60vh] animate-fade-in flex-col items-center justify-center px-0 text-center"
								: "animate-fade-in"
						}
					>
						{pageIndex === 0 ? null : (
							<p className="mb-3 text-sm font-medium text-[hsl(var(--text-tertiary))]">
								{lesson.title} · Page {pageIndex + 1}/{pages.length}
							</p>
						)}
						<h1
							className={
								pageIndex === 0
									? "mb-8 max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-[hsl(var(--text-primary))] md:text-6xl"
									: "mb-5 text-2xl font-semibold leading-tight tracking-[-0.02em] md:text-3xl"
							}
						>
							{pageIndex === 0
								? currentPage.type === "generated"
									? currentPage.page.body
									: lesson.objective
								: currentPage.title}
						</h1>
						{pageIndex === 0 ? (
							<>
								<div className="h-px w-16 bg-[hsl(var(--border-hover))]" />
								<p className="mt-8 max-w-2xl text-xl font-normal leading-relaxed text-[hsl(var(--text-secondary))] md:text-2xl">
									{lesson.title}
								</p>
							</>
						) : null}

						{currentPage.type === "generated" && pageIndex > 0 ? (
							<div className="text-lg leading-8 text-[hsl(var(--text-primary))]">
								<p className="whitespace-pre-wrap">{currentPage.page.body}</p>
								{pageIndex > 0 ? (
									currentPage.page.visual ? (
										<GeneratedVisual visual={currentPage.page.visual} />
									) : (
										<MiniVisual lesson={lesson} variant={pageIndex} />
									)
								) : null}
							</div>
						) : null}

						{currentPage.type === "intro" && pageIndex > 0 ? (
							<div className="text-lg leading-8 text-[hsl(var(--text-primary))]">
								<p>{lesson.objective}</p>
								<p className="mt-6 text-[hsl(var(--text-secondary))]">
									This lesson is one step in your learning map. Move through
									each page, check your understanding, then complete the lesson.
								</p>
							</div>
						) : null}

						{currentPage.type === "explanation" ? (
							<div className="text-lg leading-8">
								<p className="whitespace-pre-wrap">{lesson.explanation}</p>
								<MiniVisual lesson={lesson} variant={1} />
							</div>
						) : null}

						{currentPage.type === "visual" ? (
							<div>
								<p className="text-lg leading-8 text-[hsl(var(--text-secondary))]">
									Use this visual model to connect the lesson idea to a concrete
									structure.
								</p>
								<MiniVisual lesson={lesson} variant={2} />
							</div>
						) : null}

						{currentPage.type === "points" ? (
							<div>
								<MiniVisual lesson={lesson} variant={1} />
								<ul className="mt-5 space-y-3 text-lg leading-8">
									{lesson.keyPoints.map((point) => (
										<li
											key={point}
											className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-secondary))] p-4"
										>
											{point}
										</li>
									))}
								</ul>
							</div>
						) : null}

						{currentPage.type === "examples" ? (
							<div className="space-y-4">
								<MiniVisual lesson={lesson} variant={2} />
								{lesson.examples.map((example) => (
									<div
										key={example.title}
										className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 shadow-sm"
									>
										<h2 className="text-lg font-semibold">{example.title}</h2>
										<p className="mt-2 text-lg leading-8 text-[hsl(var(--text-secondary))]">
											{example.content}
										</p>
									</div>
								))}
							</div>
						) : null}

						{currentPage.type === "quiz" ||
						currentPage.type === "lesson-review" ? (
							<div>
								{currentPage.type === "lesson-review" ? (
									<p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-[hsl(var(--text-tertiary))]">
										End of lesson review
									</p>
								) : (
									<MiniVisual lesson={lesson} variant={0} />
								)}
								<p className="mb-4 text-lg leading-8">{lesson.quiz.question}</p>
								<div className="space-y-3">
									{shuffledQuizOptions.map((option, index) => (
										<button
											key={`${option.originalIndex}-${option.text}`}
											type="button"
											onClick={() => setSelectedOption(index)}
											className={`w-full rounded-2xl border px-4 py-3 text-left text-base transition ${selectedOption === index ? "border-[hsl(var(--brand-active))] bg-[hsl(var(--brand-bg))]" : "border-[hsl(var(--border))] bg-[hsl(var(--surface))] hover:bg-[hsl(var(--surface-hover))]"}`}
										>
											{option.text}
										</button>
									))}
								</div>
								<button
									type="button"
									onClick={() => setSubmitted(true)}
									disabled={selectedOption === null}
									className="brand-button-shadow mt-4 rounded-xl border border-[hsl(var(--brand-active))] bg-[hsl(var(--brand))] px-5 py-3 font-semibold uppercase disabled:opacity-50"
								>
									Check
								</button>
								{submitted ? (
									<div
										className={`mt-4 rounded-2xl p-4 ${quizCorrect ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}
									>
										<p className="font-semibold">
											{quizCorrect ? "Correct" : "Not quite yet"}
										</p>
										<p className="mt-2">{lesson.quiz.explanation}</p>
									</div>
								) : null}
							</div>
						) : null}

						{currentPage.type === "exercise" ? (
							<div>
								<MiniVisual lesson={lesson} variant={1} />
								<div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 shadow-sm">
									<p className="text-lg leading-8">{lesson.exercise.prompt}</p>
									<div className="mt-4 rounded-2xl border border-dashed border-[hsl(var(--border-hover))] bg-[hsl(var(--surface-secondary))] p-4 text-[hsl(var(--text-secondary))]">
										Hint: {lesson.exercise.hint}
									</div>
								</div>
							</div>
						) : null}

						{currentPage.type === "summary" ? (
							<div>
								<MiniVisual lesson={lesson} variant={2} />
								<div className="rounded-3xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 shadow-sm">
									<h2 className="text-lg font-semibold">Ready to move on?</h2>
									<p className="mt-2 leading-8 text-[hsl(var(--text-secondary))]">
										You reviewed the core idea, visual model, examples, quiz,
										and exercise. Complete the lesson to update your learning
										map.
									</p>
								</div>
							</div>
						) : null}

						{pageIndex > 0 &&
						currentPage.type !== "quiz" &&
						currentPage.type !== "lesson-review" ? (
							<div className="mt-10">
								<button
									type="button"
									onClick={() => setUnderstandingOpen(true)}
									className="inline-flex items-center justify-center gap-2 rounded-xl border border-[hsl(var(--border-hover))] bg-[hsl(var(--surface))] px-4 py-2 text-sm font-semibold uppercase shadow-sm transition hover:bg-[hsl(var(--surface-hover))]"
								>
									<span className="text-lg">✦</span>
									Check My Understanding
								</button>
							</div>
						) : null}
					</div>
				</div>
			</main>

			<div className="pointer-events-none fixed inset-x-0 bottom-0 z-40">
				<div className="surface-blur-bottom absolute inset-0" />
				<div className="pointer-events-auto relative mx-auto max-w-4xl px-6 py-4">
					<div
						className="grid gap-3"
						style={{ gridTemplateColumns: pageIndex === 0 ? "1fr" : "1fr 3fr" }}
					>
						{pageIndex > 0 ? (
							<button
								type="button"
								onClick={goBack}
								className="rounded-xl border border-[hsl(var(--border-hover))] bg-[hsl(var(--surface))] px-4 py-3 font-semibold uppercase lesson-button-shadow transition hover:-translate-y-0.5"
							>
								Back
							</button>
						) : null}
						<button
							type="button"
							onClick={goNext}
							disabled={
								saving || (currentPage.type === "lesson-review" && !submitted)
							}
							className="brand-button-shadow rounded-xl border border-[hsl(var(--brand-active))] bg-[hsl(var(--brand))] px-4 py-3 font-semibold uppercase transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
						>
							{pageIndex === pages.length - 1
								? saving
									? "Saving..."
									: "Complete"
								: "Next"}
						</button>
					</div>
				</div>
			</div>

			{notesOpen ? (
				<>
					<div
						className="fixed inset-0 z-[90] bg-black/40"
						onClick={() => setNotesOpen(false)}
					/>
					<div className="fixed inset-x-0 bottom-0 z-[100] max-h-[90dvh] rounded-t-2xl bg-[hsl(var(--surface))] p-4 shadow-2xl">
						<div className="mx-auto max-w-3xl space-y-4">
							<div className="flex items-center justify-between">
								<div>
									<p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--text-tertiary))]">
										Lesson Notes
									</p>
									<h2 className="mt-1 text-lg font-semibold">{lesson.title}</h2>
								</div>
								<button
									type="button"
									onClick={() => setNotesOpen(false)}
									className="rounded-lg p-2 hover:bg-[hsl(var(--surface-hover))]"
									aria-label="Close notes"
								>
									✕
								</button>
							</div>
							<p className="text-sm leading-6 text-[hsl(var(--text-secondary))]">
								These notes are saved for this lesson and stay available across
								every page in it.
							</p>
							<textarea
								value={lessonNotes}
								onChange={(event) => updateLessonNotes(event.target.value)}
								placeholder="Write notes for this lesson..."
								className="min-h-[45vh] w-full resize-none rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4 py-3 leading-7 outline-none focus:border-[hsl(var(--brand-active))] focus:ring-2 focus:ring-[hsl(var(--brand-bg))]"
							/>
							<div className="flex items-center justify-between gap-3">
								<p className="text-xs text-[hsl(var(--text-tertiary))]">
									Saved locally for this lesson.
								</p>
								<button
									type="button"
									onClick={() => setNotesOpen(false)}
									className="brand-button-shadow rounded-xl border border-[hsl(var(--brand-active))] bg-[hsl(var(--brand))] px-5 py-3 text-sm font-semibold uppercase transition hover:-translate-y-0.5"
								>
									Done
								</button>
							</div>
						</div>
					</div>
				</>
			) : null}

			{understandingOpen ? (
				<>
					<div
						className="fixed inset-0 z-[90] bg-black/40"
						onClick={() => setUnderstandingOpen(false)}
					/>
					<div className="fixed inset-x-0 bottom-0 z-[100] flex max-h-[90dvh] flex-col rounded-t-2xl bg-[hsl(var(--surface))] p-4 shadow-2xl">
						<div className="mx-auto flex min-h-0 w-full max-w-3xl flex-col gap-4">
							<div className="flex items-center justify-between">
								<h2 className="text-lg font-semibold">
									Check My Understanding
								</h2>
								<button
									type="button"
									onClick={() => setUnderstandingOpen(false)}
									className="rounded-lg p-2 hover:bg-[hsl(var(--surface-hover))]"
								>
									✕
								</button>
							</div>
							<div className="rounded-2xl bg-[hsl(var(--surface-secondary))] p-4 leading-7 text-[hsl(var(--text-primary))]">
								<p className="text-sm font-medium uppercase tracking-[0.18em] text-[hsl(var(--text-tertiary))]">
									Focus on this page
								</p>
								<p className="mt-2">{pageCheckQuestion}</p>
							</div>
							<div className="min-h-0 flex-1 space-y-3 overflow-y-auto rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-3">
								{tutorMessages.length ? (
									tutorMessages.map((message, index) => (
										<div
											key={`${message.role}-${index}`}
											className={`rounded-2xl p-3 text-sm leading-6 ${
												message.role === "user"
													? "ml-8 bg-[hsl(var(--brand-bg))] text-[hsl(var(--text-primary))]"
													: "mr-8 bg-[hsl(var(--surface-secondary))] text-[hsl(var(--text-secondary))]"
											}`}
										>
											{message.content}
										</div>
									))
								) : (
									<p className="p-3 text-sm leading-6 text-[hsl(var(--text-secondary))]">
										Answer the question above. The tutor will respond only about
										this page.
									</p>
								)}
								{tutorLoading ? (
									<div className="mr-8 rounded-2xl bg-[hsl(var(--surface-secondary))] p-3 text-sm text-[hsl(var(--text-secondary))]">
										Thinking...
									</div>
								) : null}
							</div>
							<form
								onSubmit={(event) => {
									event.preventDefault();
									void sendUnderstandingMessage();
								}}
								className="space-y-3"
							>
								<textarea
									value={understandingAnswer}
									onChange={(event) =>
										setUnderstandingAnswer(event.target.value)
									}
									placeholder="Answer the question..."
									className="min-h-20 w-full resize-none rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4 py-3 outline-none focus:border-[hsl(var(--brand-active))] focus:ring-2 focus:ring-[hsl(var(--brand-bg))]"
								/>
								<div className="flex gap-3">
									<button
										type="button"
										onClick={() =>
											void sendUnderstandingMessage(
												"I don't know yet. Please make it simpler.",
											)
										}
										className="lesson-button-shadow rounded-xl border border-[hsl(var(--border-hover))] bg-[hsl(var(--surface))] px-4 py-3 text-sm font-semibold uppercase transition hover:-translate-y-0.5"
									>
										I don't know
									</button>
									<button
										type="submit"
										disabled={!understandingAnswer.trim() || tutorLoading}
										className="brand-button-shadow flex-1 rounded-xl border border-[hsl(var(--brand-active))] bg-[hsl(var(--brand))] px-4 py-3 text-sm font-semibold uppercase transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
									>
										Send
									</button>
								</div>
							</form>
						</div>
					</div>
				</>
			) : null}
		</div>
	);
}
