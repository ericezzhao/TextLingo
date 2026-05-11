"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { deleteCourse, listCourses, updateCourse } from "@/lib/course-api";
import type { Course } from "@/lib/types";
import { getCourseProgress } from "@/lib/utils";

type CourseLibraryProps = {
	variant?: "compact" | "table";
};

const secondaryButtonClass =
	"lesson-button-shadow inline-flex min-w-[6.75rem] items-center justify-center whitespace-nowrap rounded-lg border border-[hsl(var(--border-hover))] bg-[hsl(var(--surface))] px-3 py-1.5 text-xs font-semibold uppercase transition hover:-translate-y-0.5 hover:bg-[hsl(var(--surface-hover))] active:translate-y-1 active:shadow-none";

const primaryButtonClass =
	"brand-button-shadow inline-flex min-w-[6.75rem] items-center justify-center whitespace-nowrap rounded-lg border border-[hsl(var(--brand-active))] bg-[hsl(var(--brand))] px-3 py-1.5 text-xs font-semibold uppercase transition hover:-translate-y-0.5 hover:bg-[hsl(var(--brand-hover))] active:translate-y-1 active:shadow-none";

function statusForCourse(course: Course) {
	const progress = getCourseProgress(course);
	if (progress.completed === 0)
		return {
			label: "Not Started",
			className:
				"bg-[hsl(var(--surface-secondary))] text-[hsl(var(--text-secondary))]",
		};
	if (progress.completed >= progress.total)
		return {
			label: "Reviewing",
			className: "bg-[hsl(var(--brand-bg))] text-[hsl(var(--brand-active))]",
		};
	return { label: "In Progress", className: "bg-blue-50 text-blue-700" };
}

function formatDate(value: string) {
	const date = new Date(value);
	const months = [
		"Jan",
		"Feb",
		"Mar",
		"Apr",
		"May",
		"Jun",
		"Jul",
		"Aug",
		"Sep",
		"Oct",
		"Nov",
		"Dec",
	];
	return `${months[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

export function CourseLibrary({ variant = "compact" }: CourseLibraryProps) {
	const [courses, setCourses] = useState<Course[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [openMenuCourseId, setOpenMenuCourseId] = useState<string | null>(null);
	const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
	const [busyCourseId, setBusyCourseId] = useState<string | null>(null);
	const [editingCourse, setEditingCourse] = useState<Course | null>(null);
	const [deletingCourse, setDeletingCourse] = useState<Course | null>(null);
	const [editTitle, setEditTitle] = useState("");

	useEffect(() => {
		let active = true;

		async function load() {
			try {
				const nextCourses = await listCourses();
				if (!active) return;
				setCourses(nextCourses);
				setError(null);
			} catch (err) {
				if (!active) return;
				setError(
					err instanceof Error ? err.message : "Failed to load courses.",
				);
			} finally {
				if (active) setLoading(false);
			}
		}

		void load();

		return () => {
			active = false;
		};
	}, []);

	function openRenameDialog(course: Course) {
		setOpenMenuCourseId(null);
		setEditingCourse(course);
		setEditTitle(course.title);
	}

	function openDeleteDialog(course: Course) {
		setOpenMenuCourseId(null);
		setDeletingCourse(course);
	}

	async function submitRename() {
		if (!editingCourse) return;
		const nextTitle = editTitle.trim();
		if (!nextTitle || nextTitle === editingCourse.title) return;

		setBusyCourseId(editingCourse.id);
		try {
			const updated = await updateCourse(editingCourse.id, {
				title: nextTitle,
			});
			if (updated) {
				setCourses((current) =>
					current.map((item) => (item.id === updated.id ? updated : item)),
				);
			}
			setEditingCourse(null);
			setEditTitle("");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to rename course.");
		} finally {
			setBusyCourseId(null);
		}
	}

	async function submitDelete() {
		if (!deletingCourse) return;
		setBusyCourseId(deletingCourse.id);
		try {
			await deleteCourse(deletingCourse.id);
			setCourses((current) =>
				current.filter((item) => item.id !== deletingCourse.id),
			);
			setDeletingCourse(null);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Failed to delete course.");
		} finally {
			setBusyCourseId(null);
		}
	}

	function CourseMenu({ course }: { course: Course }) {
		const isOpen = openMenuCourseId === course.id;
		const isBusy = busyCourseId === course.id;

		return (
			<div className="relative">
				<button
					type="button"
					onClick={(event) => {
						if (isOpen) {
							setOpenMenuCourseId(null);
							return;
						}
						const rect = event.currentTarget.getBoundingClientRect();
						setMenuPosition({
							top: rect.bottom + 8,
							right: window.innerWidth - rect.right,
						});
						setOpenMenuCourseId(course.id);
					}}
					className="rounded-full p-2 text-[hsl(var(--text-tertiary))] transition-colors hover:bg-[hsl(var(--surface-hover))] hover:text-[hsl(var(--text-secondary))]"
					aria-label="Course options"
				>
					⋮
				</button>
				{isOpen ? (
					<div
						className="fixed z-[70] w-48 overflow-hidden rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] shadow-lg"
						style={{ top: menuPosition.top, right: menuPosition.right }}
					>
						<button
							type="button"
							onClick={() => openRenameDialog(course)}
							className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-[hsl(var(--text-primary))] transition-colors hover:bg-[hsl(var(--surface-hover))]"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="size-4"
								aria-hidden="true"
							>
								<path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
							</svg>
							Edit name
						</button>
						<button
							type="button"
							disabled={isBusy}
							onClick={() => openDeleteDialog(course)}
							className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-red-700 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
						>
							<svg
								xmlns="http://www.w3.org/2000/svg"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								strokeWidth="2"
								strokeLinecap="round"
								strokeLinejoin="round"
								className="size-4"
								aria-hidden="true"
							>
								<path d="M10 11v6" />
								<path d="M14 11v6" />
								<path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
								<path d="M3 6h18" />
								<path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
							</svg>
							Delete course
						</button>
					</div>
				) : null}
			</div>
		);
	}

	function renderCourseDialogs() {
		const editingBusy = editingCourse
			? busyCourseId === editingCourse.id
			: false;
		const deletingBusy = deletingCourse
			? busyCourseId === deletingCourse.id
			: false;

		if (!editingCourse && !deletingCourse) return null;

		return (
			<div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/20 backdrop-blur-sm">
				{editingCourse ? (
					<div className="mx-4 w-full max-w-md rounded-lg bg-[hsl(var(--surface))] p-6 shadow-xl">
						<h3 className="mb-4 text-lg font-semibold text-[hsl(var(--text-primary))]">
							Edit Course Name
						</h3>
						<input
							type="text"
							className="mb-6 w-full rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4 py-2 text-base text-[hsl(var(--text-primary))] outline-none transition focus:border-[hsl(var(--brand-active))] focus:ring-2 focus:ring-[hsl(var(--brand-bg))] disabled:opacity-50"
							placeholder="Course name"
							value={editTitle}
							disabled={editingBusy}
							onChange={(event) => setEditTitle(event.target.value)}
							onKeyDown={(event) => {
								if (event.key === "Enter") void submitRename();
								if (event.key === "Escape") setEditingCourse(null);
							}}
						/>
						<div className="flex gap-3">
							<button
								type="button"
								disabled={editingBusy}
								onClick={() => setEditingCourse(null)}
								className={`${secondaryButtonClass} w-full px-4 py-2 text-sm`}
							>
								Cancel
							</button>
							<button
								type="button"
								disabled={
									editingBusy ||
									!editTitle.trim() ||
									editTitle.trim() === editingCourse.title
								}
								onClick={() => void submitRename()}
								className={`${primaryButtonClass} w-full px-4 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50`}
							>
								{editingBusy ? "Saving..." : "Save"}
							</button>
						</div>
					</div>
				) : null}

				{deletingCourse ? (
					<div className="mx-4 w-full max-w-md rounded-lg bg-[hsl(var(--surface))] p-6 shadow-xl">
						<h3 className="mb-4 text-lg font-semibold text-[hsl(var(--text-primary))]">
							Delete Course
						</h3>
						<p className="mb-6 text-[hsl(var(--text-secondary))]">
							Are you sure you want to delete “{deletingCourse.title}”? This
							will also delete all lessons associated with this course. This
							action cannot be undone.
						</p>
						<div className="flex gap-3">
							<button
								type="button"
								disabled={deletingBusy}
								onClick={() => setDeletingCourse(null)}
								className={`${secondaryButtonClass} w-full px-4 py-2 text-sm`}
							>
								Cancel
							</button>
							<button
								type="button"
								disabled={deletingBusy}
								onClick={() => void submitDelete()}
								className="rounded-lg border border-red-800 bg-red-100 px-4 py-2 text-sm font-semibold uppercase text-red-800 shadow-[0_4px_0_0_rgb(252_165_165),0_5px_0_0_rgb(153_27_27)] transition hover:-translate-y-0.5 hover:bg-red-200 hover:shadow-[0_6px_0_0_rgb(252_165_165),0_7px_0_0_rgb(153_27_27)] active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50 w-full"
							>
								{deletingBusy ? "Deleting..." : "Delete"}
							</button>
						</div>
					</div>
				) : null}
			</div>
		);
	}

	if (loading) {
		return (
			<section className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6 text-[hsl(var(--text-secondary))] shadow-sm">
				Loading your courses...
			</section>
		);
	}

	if (error) {
		return (
			<section className="rounded-lg border border-red-200 bg-red-50 p-6 text-red-700 shadow-sm">
				<p className="font-semibold">Course library</p>
				<p className="mt-2 text-sm">{error}</p>
			</section>
		);
	}

	if (!courses.length) {
		return (
			<section className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6 shadow-sm">
				<div className="max-w-xl space-y-2">
					<h2 className="text-2xl font-semibold">No courses yet</h2>
					<p className="text-[hsl(var(--text-secondary))]">
						Create your first TextLingo course from the Create tab.
					</p>
					<Link
						href="/create"
						className={`${primaryButtonClass} mt-3 inline-flex px-4 py-2 text-sm`}
					>
						Create course
					</Link>
				</div>
			</section>
		);
	}

	if (variant === "table") {
		return (
			<>
				{renderCourseDialogs()}
				<div className="space-y-3 md:hidden">
					{courses.map((course) => {
						const progress = getCourseProgress(course);
						const status = statusForCourse(course);
						return (
							<div
								key={course.id}
								className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4 shadow-sm"
							>
								<div className="mb-3 flex items-start justify-between gap-3">
									<Link
										href={`/course/${course.id}`}
										className="font-medium hover:underline"
									>
										{course.title}
									</Link>
									<CourseMenu course={course} />
								</div>
								<div className="flex flex-wrap items-center gap-3 text-sm">
									<span
										className={`inline-block rounded-sm px-2 py-1 text-xs ${status.className}`}
									>
										{status.label}
									</span>
									<span className="text-[hsl(var(--text-secondary))]">
										{progress.completed} / {progress.total} lessons
									</span>
								</div>
								<div className="mt-3 flex items-center gap-2">
									<Link
										href={`/course/${course.id}`}
										className={`${primaryButtonClass} w-full text-center`}
									>
										Review
									</Link>
								</div>
							</div>
						);
					})}
				</div>

				<div className="hidden overflow-x-auto rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] md:block">
					<table className="w-full border-collapse">
						<thead>
							<tr className="border-b border-[hsl(var(--border))] bg-[hsl(var(--surface-secondary))]">
								<th className="px-4 py-3 text-left text-sm font-semibold">
									Name
								</th>
								<th className="px-4 py-3 text-left text-sm font-semibold">
									Status
								</th>
								<th className="px-4 py-3 text-left text-sm font-semibold">
									Done Lessons
								</th>
								<th className="px-4 py-3 text-left text-sm font-semibold">
									Total Lessons
								</th>
								<th className="px-4 py-3 text-left text-sm font-semibold">
									Created
								</th>
								<th className="px-4 py-3 text-left text-sm font-semibold">
									Actions
								</th>
							</tr>
						</thead>
						<tbody>
							{courses.map((course) => {
								const progress = getCourseProgress(course);
								const status = statusForCourse(course);
								return (
									<tr
										key={course.id}
										className="border-b border-[hsl(var(--border))] transition-colors last:border-b-0 hover:bg-[hsl(var(--surface-hover))]"
									>
										<td className="px-4 py-3">
											<Link
												href={`/course/${course.id}`}
												className="font-medium hover:underline"
											>
												{course.title}
											</Link>
										</td>
										<td className="px-4 py-3">
											<span
												className={`inline-block rounded-sm px-2 py-1 text-xs ${status.className}`}
											>
												{status.label}
											</span>
										</td>
										<td className="px-4 py-3 text-sm text-[hsl(var(--text-secondary))]">
											{progress.completed}
										</td>
										<td className="px-4 py-3 text-sm text-[hsl(var(--text-secondary))]">
											{progress.total}
										</td>
										<td className="px-4 py-3 text-sm text-[hsl(var(--text-secondary))]">
											{formatDate(course.createdAt)}
										</td>
										<td className="px-4 py-3">
											<div className="flex items-center gap-2">
												<Link
													href={`/course/${course.id}`}
													className={primaryButtonClass}
												>
													Review
												</Link>
												<CourseMenu course={course} />
											</div>
										</td>
									</tr>
								);
							})}
						</tbody>
					</table>
				</div>
			</>
		);
	}

	return (
		<section className="space-y-5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-6 shadow-sm">
			<div className="flex items-center justify-between gap-4">
				<div>
					<h2 className="text-2xl font-semibold">Recent courses</h2>
					<p className="mt-1 text-sm text-[hsl(var(--text-secondary))]">
						Continue where you left off.
					</p>
				</div>
				<Link
					href="/courses"
					className="text-sm font-medium text-[hsl(var(--brand-active))] hover:underline"
				>
					View all
				</Link>
			</div>

			<div className="grid gap-4 md:grid-cols-2">
				{courses.slice(0, 4).map((course) => {
					const progress = getCourseProgress(course);
					return (
						<Link
							key={course.id}
							href={`/course/${course.id}`}
							className="rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface-secondary))] p-4 shadow-sm transition hover:-translate-y-0.5 hover:bg-[hsl(var(--surface-hover))] active:translate-y-1"
						>
							<h3 className="text-lg font-semibold">{course.title}</h3>
							<p className="mt-2 text-sm text-[hsl(var(--text-secondary))]">
								{progress.completed} / {progress.total} lessons
							</p>
						</Link>
					);
				})}
			</div>
		</section>
	);
}
