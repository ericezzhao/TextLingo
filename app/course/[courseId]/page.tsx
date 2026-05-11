"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AppShell } from "@/components/app-shell";
import { CourseThumbnail } from "@/components/course-thumbnail";
import { LessonRoadmap } from "@/components/lesson-roadmap";
import { getCourse } from "@/lib/course-api";
import type { Course } from "@/lib/types";
import { getCourseProgress } from "@/lib/utils";

export default function CoursePage({
	params,
}: {
	params: Promise<{ courseId: string }>;
}) {
	const [course, setCourse] = useState<Course | null>(null);
	const [courseId, setCourseId] = useState<string>("");
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let active = true;

		async function load() {
			try {
				const { courseId: value } = await params;
				if (!active) return;
				setCourseId(value);
				const nextCourse = await getCourse(value);
				if (!active) return;
				setCourse(nextCourse);
				setError(null);
			} catch (err) {
				if (!active) return;
				setError(err instanceof Error ? err.message : "Failed to load course.");
			} finally {
				if (active) setLoading(false);
			}
		}

		void load();

		return () => {
			active = false;
		};
	}, [params]);

	if (loading) {
		return (
			<AppShell active="courses" mode="course">
				<div className="mx-auto w-full max-w-6xl rounded-[28px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-8 text-[hsl(var(--text-secondary))] shadow-sm">
					Loading course...
				</div>
			</AppShell>
		);
	}

	if (error || !course) {
		return (
			<AppShell active="courses" mode="course">
				<div className="mx-auto w-full max-w-6xl space-y-4 rounded-[28px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-8 shadow-sm">
					<h1 className="text-2xl font-semibold">
						{error ? "Could not load course" : "Course not found"}
					</h1>
					<p className="text-[hsl(var(--text-secondary))]">
						{error ??
							"This course may not exist for your current browser session."}
					</p>
					<Link href="/" className="text-[hsl(var(--brand-active))] underline">
						Go back home
					</Link>
				</div>
			</AppShell>
		);
	}

	const progress = getCourseProgress(course);
	const resumeLessonId = course.currentLessonId ?? course.lessons[0]?.id;

	return (
		<AppShell active="courses" mode="course">
			<div className="flex h-full min-h-0 flex-col">
				<div className="mx-auto mb-5 w-full max-w-6xl shrink-0">
					<div className="relative h-[108px] overflow-hidden rounded-[28px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] shadow-sm">
						<div className="absolute inset-0 px-4 py-2">
							<div className="flex h-full gap-4">
								<div className="flex h-full shrink-0 items-center">
									<CourseThumbnail course={course} />
								</div>
								<div className="flex min-w-0 flex-1 flex-col justify-center pt-3">
									<button
										className="inline-flex min-w-0 max-w-full items-baseline gap-1 rounded-2xl text-left transition-colors hover:text-[hsl(var(--brand-active))]"
										title={course.title}
									>
										<span className="line-clamp-2 block text-base font-semibold leading-[19px] text-[hsl(var(--text-primary))]">
											{course.title}
										</span>
										<span className="relative top-px shrink-0 text-xs text-[hsl(var(--text-tertiary))]">
											↕
										</span>
									</button>
									<div className="mt-1.5 flex w-full max-w-full shrink-0 items-center gap-3">
										<div className="ml-auto flex shrink-0 items-center gap-3">
											<span className="hidden text-xs text-[hsl(var(--text-tertiary))] sm:inline">
												{progress.completed}/{progress.total} complete
											</span>
											<button
												className="flex size-10 items-center justify-center rounded-xl text-[hsl(var(--text-secondary))] transition-colors hover:text-[hsl(var(--text-primary))]"
												title="More options"
											>
												•••
											</button>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>

				<div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1">
					<div className="no-scrollbar relative min-h-0 flex-1 overflow-y-auto">
						<div className="mx-auto max-w-6xl pb-24">
							<LessonRoadmap course={course} />
							<div className="pb-6">
								<div className="my-3 flex items-center justify-center gap-2">
									<div className="h-px flex-1 bg-[hsl(var(--border))]" />
									<span className="whitespace-nowrap text-[10px] font-medium uppercase tracking-wider text-[hsl(var(--text-tertiary))]">
										Recommendations
									</span>
									<div className="h-px flex-1 bg-[hsl(var(--border))]" />
								</div>
								<div className="mx-auto flex max-w-6xl justify-center">
									{resumeLessonId ? (
										<Link
											href={`/course/${courseId}/lesson/${resumeLessonId}`}
											className="lesson-button-shadow inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[hsl(var(--border-hover))] bg-[hsl(var(--surface))] px-4 py-2 text-sm font-semibold uppercase transition hover:-translate-y-0.5"
										>
											✦ Continue learning
										</Link>
									) : null}
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</AppShell>
	);
}
