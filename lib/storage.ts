import type { Course } from "@/lib/types";

const STORAGE_KEY = "textlingo-courses";

export function loadCourses(): Course[] {
	if (typeof window === "undefined") return [];
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		if (!raw) return [];
		const parsed = JSON.parse(raw) as Course[];
		return parsed.sort(
			(a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt),
		);
	} catch {
		return [];
	}
}

export function saveCourses(courses: Course[]) {
	if (typeof window === "undefined") return;
	window.localStorage.setItem(STORAGE_KEY, JSON.stringify(courses));
}

export function upsertCourse(course: Course) {
	const courses = loadCourses();
	const nextCourses = [
		course,
		...courses.filter((item) => item.id !== course.id),
	].sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt));
	saveCourses(nextCourses);
	return nextCourses;
}

export function findCourse(courseId: string) {
	return loadCourses().find((course) => course.id === courseId);
}
