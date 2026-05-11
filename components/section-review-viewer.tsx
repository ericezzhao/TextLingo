"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { getCourse, updateCourse } from "@/lib/course-api";
import type { Course, Lesson } from "@/lib/types";

type SectionReviewViewerProps = {
	courseId: string;
	sectionOrder: number;
};

type ReviewQuestion = {
	lesson: Lesson;
	question: string;
	options: string[];
	answerIndex: number;
	explanation: string;
};

type ReviewOption = {
	text: string;
	originalIndex: number;
};

function shuffleOptions(
	options: string[],
	answerIndex: number,
): ReviewOption[] {
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

function getSectionLessons(course: Course, sectionOrder: number) {
	return course.lessons.filter((lesson) => {
		const fallbackOrder = Math.floor((lesson.orderIndex - 1) / 3) + 1;
		return (lesson.sectionOrder ?? fallbackOrder) === sectionOrder;
	});
}

function buildQuestions(lessons: Lesson[]): ReviewQuestion[] {
	const questions: ReviewQuestion[] = [];

	for (const lesson of lessons) {
		if (lesson.quiz?.options?.length === 4) {
			questions.push({
				lesson,
				question: lesson.quiz.question,
				options: lesson.quiz.options,
				answerIndex: lesson.quiz.answerIndex,
				explanation: lesson.quiz.explanation,
			});
		}

		const [firstPoint, secondPoint] = lesson.keyPoints;
		if (firstPoint && secondPoint) {
			questions.push({
				lesson,
				question: `Which statement best captures the role of “${lesson.title}” in this section?`,
				options: [
					firstPoint,
					`It is unrelated to ${lesson.sectionTitle ?? "this section"}.`,
					`It only matters after the final lesson.`,
					secondPoint,
				],
				answerIndex: 0,
				explanation: firstPoint,
			});
		}
	}

	if (questions.length === 1 && lessons[0]) {
		const lesson = lessons[0];
		questions.push({
			lesson,
			question: `What should you be able to explain after studying “${lesson.title}”?`,
			options: [
				lesson.objective,
				"Only the name of the topic",
				"Only the order of lessons",
				"A random definition without context",
			],
			answerIndex: 0,
			explanation: lesson.objective,
		});
	}

	return questions.slice(0, Math.max(3, Math.min(6, questions.length)));
}

export function SectionReviewViewer({
	courseId,
	sectionOrder,
}: SectionReviewViewerProps) {
	const router = useRouter();
	const [course, setCourse] = useState<Course | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [questionIndex, setQuestionIndex] = useState(0);
	const [selectedOption, setSelectedOption] = useState<number | null>(null);
	const [checked, setChecked] = useState(false);
	const [wrongCount, setWrongCount] = useState(0);
	const [finished, setFinished] = useState(false);
	const reviewCompletionId = `section-review-${sectionOrder}`;

	useEffect(() => {
		let active = true;

		async function load() {
			try {
				const loadedCourse = await getCourse(courseId);
				if (!active) return;
				setCourse(loadedCourse);
				setError(null);
			} catch (err) {
				if (!active) return;
				setError(err instanceof Error ? err.message : "Failed to load review.");
			} finally {
				if (active) setLoading(false);
			}
		}

		void load();
		return () => {
			active = false;
		};
	}, [courseId]);

	useEffect(() => {
		if (course?.completedLessonIds.includes(reviewCompletionId) && !finished) {
			router.replace(`/course/${courseId}`);
		}
	}, [course, courseId, finished, reviewCompletionId, router]);

	const sectionLessons = useMemo(
		() => (course ? getSectionLessons(course, sectionOrder) : []),
		[course, sectionOrder],
	);
	const questions = useMemo(
		() => buildQuestions(sectionLessons),
		[sectionLessons],
	);
	const sectionTitle =
		sectionLessons[0]?.sectionTitle ?? `Section ${sectionOrder}`;
	const currentQuestion = questions[questionIndex];
	const shuffledOptions = useMemo(
		() =>
			shuffleOptions(
				currentQuestion?.options ?? [],
				currentQuestion?.answerIndex ?? 0,
			),
		[currentQuestion],
	);
	const progress = questions.length
		? (questionIndex / questions.length) * 100
		: 0;
	const isCorrect =
		selectedOption !== null &&
		shuffledOptions[selectedOption]?.originalIndex ===
			currentQuestion?.answerIndex;

	function checkAnswer() {
		if (selectedOption === null || checked) return;
		if (!isCorrect) setWrongCount((count) => count + 1);
		setChecked(true);
	}

	async function completeReview() {
		setFinished(true);
		try {
			const updatedCourse = await updateCourse(courseId, {
				completeLessonId: reviewCompletionId,
			});
			if (updatedCourse) setCourse(updatedCourse);
		} catch {
			// Keep the learner moving even if persistence fails temporarily.
		}
	}

	function continueReview() {
		if (questionIndex < questions.length - 1) {
			setQuestionIndex((index) => index + 1);
			setSelectedOption(null);
			setChecked(false);
			return;
		}
		void completeReview();
	}

	if (loading) {
		return (
			<div className="min-h-screen bg-[hsl(var(--surface))] p-8 text-[hsl(var(--text-secondary))]">
				Loading section review...
			</div>
		);
	}

	if (error || !course || !questions.length) {
		return (
			<div className="flex min-h-screen items-center justify-center bg-[hsl(var(--surface))] p-6">
				<div className="max-w-md rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6 shadow-sm">
					<h1 className="text-xl font-semibold">Review unavailable</h1>
					<p className="mt-2 text-[hsl(var(--text-secondary))]">
						{error ?? "This section does not have enough quiz questions yet."}
					</p>
					<button
						type="button"
						onClick={() => router.push(`/course/${courseId}`)}
						className="brand-button-shadow mt-5 rounded-xl border border-[hsl(var(--brand-active))] bg-[hsl(var(--brand))] px-4 py-2 font-semibold uppercase"
					>
						Back to map
					</button>
				</div>
			</div>
		);
	}

	if (finished) {
		return (
			<div className="flex min-h-dvh flex-col bg-[hsl(var(--surface))]">
				<div className="flex flex-1 flex-col items-center justify-center px-6 text-center">
					<div className="mb-6 flex size-40 items-center justify-center rounded-full border border-[hsl(var(--border))] bg-[hsl(var(--brand-bg))] text-6xl shadow-sm">
						{wrongCount ? "↻" : "✓"}
					</div>
					<h2 className="mb-4 text-2xl font-bold text-[hsl(var(--text-primary))]">
						{wrongCount
							? "Let's review what you got wrong"
							: "Section review complete"}
					</h2>
					<p className="text-lg text-[hsl(var(--text-secondary))]">
						{wrongCount
							? `${wrongCount} question${wrongCount === 1 ? "" : "s"} to revisit later`
							: `Nice work reviewing ${sectionTitle}.`}
					</p>
				</div>
				<div className="w-full px-6 pb-6">
					<div className="mx-auto max-w-md">
						<button
							type="button"
							onClick={() => router.push(`/course/${courseId}`)}
							className="brand-button-shadow w-full rounded-xl border border-[hsl(var(--brand-active))] bg-[hsl(var(--brand))] px-4 py-3 text-base font-semibold uppercase transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
						>
							Back to map
						</button>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="flex h-screen flex-col overflow-y-auto bg-[hsl(var(--surface))] text-[hsl(var(--text-primary))]">
			<header className="fixed inset-x-0 top-0 z-40 bg-[hsl(var(--surface))]">
				<div className="mx-auto max-w-4xl p-4">
					<div className="flex items-center justify-between">
						<button
							type="button"
							onClick={() => router.push(`/course/${courseId}`)}
							className="rounded-lg p-1 transition-colors hover:bg-[hsl(var(--surface-hover))]"
							aria-label="Close"
						>
							✕
						</button>
						<div className="flex-1 px-4">
							<div className="h-2.5 overflow-hidden rounded-xl bg-[hsl(var(--surface-secondary))]">
								<div
									className="h-full bg-[hsl(var(--brand))] transition-all duration-500"
									style={{ width: `${progress}%` }}
								/>
							</div>
						</div>
						<div className="w-6" />
					</div>
				</div>
			</header>

			<main className="flex flex-1 flex-col items-center justify-center overflow-y-auto pb-[min(52vh,360px)] pt-20">
				<div className="mx-auto max-w-4xl p-4">
					<p className="mb-3 text-sm font-medium uppercase tracking-[0.18em] text-[hsl(var(--text-tertiary))]">
						{sectionTitle} review
					</p>
					<div className="mb-4 text-lg leading-relaxed md:text-xl">
						<p className="whitespace-pre-wrap break-words">
							{currentQuestion.question}
						</p>
					</div>
				</div>
			</main>

			<div className="fixed inset-x-0 bottom-0 z-30 p-4">
				<div className="mx-auto max-w-4xl">
					<div className="no-scrollbar mb-6 max-h-[40vh] overflow-y-auto">
						<div className="space-y-3">
							{shuffledOptions.map((option, index) => {
								const selected = selectedOption === index;
								const correct =
									option.originalIndex === currentQuestion.answerIndex;
								return (
									<button
										key={`${option.originalIndex}-${option.text}`}
										type="button"
										disabled={checked}
										onClick={() => setSelectedOption(index)}
										className={`w-full rounded-lg border-2 p-4 text-start transition-all ${
											checked && correct
												? "border-green-500 bg-green-50 text-green-800"
												: checked && selected
													? "border-red-400 bg-red-50 text-red-700"
													: selected
														? "border-[hsl(var(--brand-active))] bg-[hsl(var(--brand-bg))]"
														: "border-[hsl(var(--border))] bg-[hsl(var(--surface))] hover:border-[hsl(var(--border-hover))] hover:shadow-sm"
										}`}
									>
										<div className="flex items-start gap-3">
											<span className="flex-1 text-sm">{option.text}</span>
											{checked && correct ? <span>✓</span> : null}
											{checked && selected && !correct ? <span>✕</span> : null}
										</div>
									</button>
								);
							})}
						</div>
					</div>
					<button
						type="button"
						disabled={selectedOption === null}
						onClick={checked ? continueReview : checkAnswer}
						className="brand-button-shadow w-full rounded-xl border border-[hsl(var(--brand-active))] bg-[hsl(var(--brand))] px-4 py-3 text-base font-semibold uppercase transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
					>
						{checked ? "Continue" : "Check"}
					</button>
				</div>
			</div>

			<div
				className={`fixed inset-x-0 bottom-0 z-40 max-h-[85dvh] overflow-hidden bg-[hsl(var(--surface-secondary))] px-6 py-4 shadow-2xl transition-transform duration-300 ease-in-out ${checked ? "translate-y-0" : "translate-y-full"}`}
			>
				<div className="mx-auto max-w-4xl">
					<h3 className="mb-3 text-lg font-semibold">
						{isCorrect ? "That's right!" : "Not quite right"}
					</h3>
					<p className="leading-7 text-[hsl(var(--text-secondary))]">
						{currentQuestion.explanation}
					</p>
					<div className="mt-4 flex gap-3">
						<button
							type="button"
							onClick={continueReview}
							className="lesson-button-shadow flex-1 rounded-xl border border-[hsl(var(--border-hover))] bg-[hsl(var(--surface))] px-4 py-3 text-base font-semibold uppercase transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none"
						>
							Continue
						</button>
					</div>
				</div>
			</div>
		</div>
	);
}
