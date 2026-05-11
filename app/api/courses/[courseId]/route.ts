import { NextResponse } from "next/server";

import { attachLearnerCookie, getLearnerSession } from "@/lib/learner-session";
import {
	deleteCourseForLearner,
	getCourseForLearner,
	updateCourseProgressForLearner,
} from "@/lib/course-repository";

export const runtime = "nodejs";

type RouteContext = {
	params: Promise<{
		courseId: string;
	}>;
};

type UpdatePayload = {
	currentLessonId?: string;
	completeLessonId?: string;
	title?: string;
};

export async function GET(_: Request, context: RouteContext) {
	try {
		const { courseId } = await context.params;
		const { learnerId, setCookie } = await getLearnerSession();
		const course = await getCourseForLearner(learnerId, courseId);

		if (!course) {
			const response = NextResponse.json(
				{ error: "Course not found." },
				{ status: 404 },
			);
			return attachLearnerCookie(response, learnerId, setCookie);
		}

		const response = NextResponse.json(course);
		return attachLearnerCookie(response, learnerId, setCookie);
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to load course.",
			},
			{ status: 500 },
		);
	}
}

export async function PATCH(request: Request, context: RouteContext) {
	try {
		const { courseId } = await context.params;
		const payload = (await request.json()) as UpdatePayload;
		const { learnerId, setCookie } = await getLearnerSession();
		const course = await updateCourseProgressForLearner(
			learnerId,
			courseId,
			payload,
		);

		if (!course) {
			const response = NextResponse.json(
				{ error: "Course not found." },
				{ status: 404 },
			);
			return attachLearnerCookie(response, learnerId, setCookie);
		}

		const response = NextResponse.json(course);
		return attachLearnerCookie(response, learnerId, setCookie);
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to update course.",
			},
			{ status: 500 },
		);
	}
}

export async function DELETE(_: Request, context: RouteContext) {
	try {
		const { courseId } = await context.params;
		const { learnerId, setCookie } = await getLearnerSession();
		await deleteCourseForLearner(learnerId, courseId);

		const response = NextResponse.json({ ok: true });
		return attachLearnerCookie(response, learnerId, setCookie);
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to delete course.",
			},
			{ status: 500 },
		);
	}
}
