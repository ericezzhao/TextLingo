import type { Course, GenerateCourseInput } from "@/lib/types";

type UpdateCourseInput = {
	currentLessonId?: string;
	completeLessonId?: string;
	title?: string;
};

async function parseResponse<T>(response: Response): Promise<T> {
	const payload = (await response.json().catch(() => ({}))) as T & {
		error?: string;
	};

	if (!response.ok) {
		throw new Error(payload.error ?? "Request failed.");
	}

	return payload;
}

export async function listCourses() {
	const response = await fetch("/api/courses", {
		cache: "no-store",
	});

	return parseResponse<Course[]>(response);
}

export async function getCourse(courseId: string) {
	const response = await fetch(`/api/courses/${courseId}`, {
		cache: "no-store",
	});

	if (response.status === 404) {
		return null;
	}

	return parseResponse<Course>(response);
}

export async function createCourse(input: GenerateCourseInput) {
	const response = await fetch("/api/courses", {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(input),
	});

	return parseResponse<Course>(response);
}

export async function updateCourse(courseId: string, input: UpdateCourseInput) {
	const response = await fetch(`/api/courses/${courseId}`, {
		method: "PATCH",
		headers: {
			"Content-Type": "application/json",
		},
		body: JSON.stringify(input),
	});

	if (response.status === 404) {
		return null;
	}

	return parseResponse<Course>(response);
}

export async function deleteCourse(courseId: string) {
	const response = await fetch(`/api/courses/${courseId}`, {
		method: "DELETE",
	});

	return parseResponse<{ ok: boolean }>(response);
}
