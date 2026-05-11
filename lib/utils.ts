import type { Course, Lesson } from "@/lib/types";

export function formatPercent(value: number) {
	return `${Math.round(value)}%`;
}

export function getCourseProgress(course: Course) {
	const lessonIds = new Set(course.lessons.map((lesson) => lesson.id));
	const total = course.lessons.length || 1;
	const completed = course.completedLessonIds.filter((id) =>
		lessonIds.has(id),
	).length;
	return {
		completed,
		total,
		percent: (completed / total) * 100,
	};
}

export function getNextLesson(course: Course, lessonId?: string) {
	if (!course.lessons.length) return undefined;
	if (!lessonId) return course.lessons[0];
	const currentIndex = course.lessons.findIndex(
		(lesson) => lesson.id === lessonId,
	);
	return course.lessons[currentIndex + 1];
}

export function getPreviousLesson(course: Course, lessonId?: string) {
	if (!course.lessons.length || !lessonId) return undefined;
	const currentIndex = course.lessons.findIndex(
		(lesson) => lesson.id === lessonId,
	);
	return currentIndex > 0 ? course.lessons[currentIndex - 1] : undefined;
}

export function lessonStatus(
	course: Course,
	lesson: Lesson,
): "completed" | "current" | "upcoming" {
	if (course.completedLessonIds.includes(lesson.id)) return "completed";
	if (!course.currentLessonId)
		return lesson.orderIndex === 1 ? "current" : "upcoming";
	return course.currentLessonId === lesson.id ? "current" : "upcoming";
}
