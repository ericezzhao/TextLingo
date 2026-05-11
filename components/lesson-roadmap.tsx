import Link from "next/link";

import type { Course, Lesson } from "@/lib/types";

type LessonRoadmapProps = {
	course: Course;
};

function groupLessonsBySection(lessons: Lesson[]) {
	const sectionMap = new Map<string, Lesson[]>();

	for (const lesson of lessons) {
		const fallbackSection = `Section ${Math.floor((lesson.orderIndex - 1) / 3) + 1}`;
		const sectionTitle = lesson.sectionTitle || fallbackSection;
		sectionMap.set(sectionTitle, [
			...(sectionMap.get(sectionTitle) ?? []),
			lesson,
		]);
	}

	return Array.from(sectionMap.entries()).map(([title, lessons], index) => ({
		title,
		order: lessons[0]?.sectionOrder ?? index + 1,
		lessons,
	}));
}

function LessonNode({
	course,
	lesson,
	index,
	accessible,
}: {
	course: Course;
	lesson: Lesson;
	index: number;
	accessible: boolean;
}) {
	const completed = course.completedLessonIds.includes(lesson.id);
	const offsets = [-80, -50, -20, -50, -80];
	const offset = offsets[index % 3] ?? -50;

	return (
		<div className="path-block relative flex justify-center py-2">
			<div
				className="relative z-10"
				style={{ transform: `translateX(${offset}px)` }}
			>
				<div className="group relative flex items-center justify-center">
					{accessible ? (
						<Link
							href={`/course/${course.id}/lesson/${lesson.id}`}
							className={`lesson-button-shadow relative z-10 flex size-14 items-center justify-center overflow-hidden rounded-full border-2 transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none md:size-16 ${
								completed
									? "border-[hsl(var(--brand-active))] bg-[hsl(var(--brand-bg))] text-[hsl(var(--brand-active))]"
									: "scale-110 border-[hsl(var(--brand-active))] bg-[hsl(var(--surface))] text-[hsl(var(--brand-active))]"
							}`}
							aria-label={`Open ${lesson.title}`}
						>
							<span className="text-xl">{completed ? "✓✓" : "★"}</span>
						</Link>
					) : (
						<button
							type="button"
							className="lesson-button-shadow relative z-10 flex size-14 cursor-not-allowed items-center justify-center overflow-hidden rounded-full border-2 border-[hsl(var(--border-hover))] bg-[hsl(var(--surface-secondary))] text-[hsl(var(--text-disabled))] transition md:size-16"
							aria-label={`${lesson.title} locked`}
						>
							🔒
						</button>
					)}
					<div className="absolute left-full ml-4 w-40 cursor-pointer text-left sm:w-48">
						<p className="line-clamp-2 text-base text-[hsl(var(--text-primary))]">
							{lesson.title}
						</p>
						{index % 3 === 2 ? (
							<p className="mt-0.5 text-xs text-[hsl(var(--text-tertiary))]">
								Advanced Lesson
							</p>
						) : null}
					</div>
				</div>
			</div>
		</div>
	);
}

function SectionReview({
	course,
	sectionIndex,
	sectionOrder,
	sectionTitle,
	completed,
	total,
}: {
	course: Course;
	sectionIndex: number;
	sectionOrder: number;
	sectionTitle: string;
	completed: number;
	total: number;
}) {
	const unlocked = completed >= total && total > 0;
	const reviewComplete = course.completedLessonIds.includes(
		`section-review-${sectionOrder}`,
	);
	const offsets = [-20, -50, -80];
	const offset = offsets[sectionIndex % offsets.length];
	return (
		<div className="path-block relative mt-5 flex justify-center">
			<div
				className="relative z-10"
				style={{ transform: `translateX(${offset}px)` }}
			>
				<div className="group relative flex items-center justify-center">
					{reviewComplete ? (
						<div
							className="lesson-button-shadow relative flex size-14 items-center justify-center overflow-hidden rounded-full border-2 border-[hsl(var(--green))] bg-[hsl(var(--surface))] text-[hsl(var(--green))] md:size-16"
							aria-label={`${sectionTitle} section review complete`}
						>
							✓
						</div>
					) : unlocked ? (
						<Link
							href={`/course/${course.id}/review/${sectionOrder}`}
							className="lesson-button-shadow relative flex size-14 items-center justify-center overflow-hidden rounded-full border-2 border-[hsl(var(--brand-active))] bg-[hsl(var(--brand-bg))] text-[hsl(var(--brand-active))] transition hover:-translate-y-0.5 active:translate-y-1 active:shadow-none md:size-16"
							aria-label={`${sectionTitle} section review`}
						>
							?
						</Link>
					) : (
						<button
							type="button"
							className="lesson-button-shadow relative flex size-14 cursor-not-allowed items-center justify-center overflow-hidden rounded-full border-2 border-[hsl(var(--border-hover))] bg-[hsl(var(--surface-secondary))] text-[hsl(var(--text-disabled))] transition md:size-16"
							aria-label={`${sectionTitle} section review locked`}
						>
							🔒
						</button>
					)}
					<div className="absolute left-full ml-4 w-40 text-left sm:w-48">
						<p className="line-clamp-2 text-base text-[hsl(var(--text-primary))]">
							Section Review
						</p>
						<p className="text-xs text-[hsl(var(--text-secondary))]">
							{reviewComplete ? "Completed" : unlocked ? "Ready" : "Locked"}
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}

export function LessonRoadmap({ course }: LessonRoadmapProps) {
	const sections = groupLessonsBySection(course.lessons);
	const firstIncompleteLesson =
		course.lessons.find(
			(lesson) => !course.completedLessonIds.includes(lesson.id),
		) ?? course.lessons[0];

	return (
		<section className="space-y-6">
			<div className="space-y-8">
				{sections.map((section, sectionIndex) => {
					const sectionLessons = section.lessons;
					const completedCount = sectionLessons.filter((lesson) =>
						course.completedLessonIds.includes(lesson.id),
					).length;

					return (
						<div key={section.title} className="section-container mb-8">
							<div className="sticky top-0 z-20 flex items-stretch justify-between overflow-hidden rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] shadow-sm">
								<div className="flex-1 px-6 py-3">
									<h2 className="text-base font-semibold">
										{section.order}. {section.title}
									</h2>
									<p className="mt-0.5 text-sm text-[hsl(var(--text-secondary))]">
										{completedCount}/{sectionLessons.length} lessons
									</p>
								</div>
							</div>

							<div className="relative mt-4">
								<div className="relative mx-auto max-w-xl">
									<div className="relative py-8">
										{sectionLessons.map((lesson, index) => (
											<LessonNode
												key={lesson.id}
												course={course}
												lesson={lesson}
												index={index}
												accessible={
													course.completedLessonIds.includes(lesson.id) ||
													lesson.id === firstIncompleteLesson?.id
												}
											/>
										))}
										<SectionReview
											course={course}
											sectionIndex={sectionIndex}
											sectionOrder={section.order}
											sectionTitle={section.title}
											completed={completedCount}
											total={sectionLessons.length}
										/>
									</div>
								</div>
							</div>
						</div>
					);
				})}
			</div>
		</section>
	);
}
