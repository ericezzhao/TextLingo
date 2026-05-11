import { NextResponse } from "next/server";

import {
	createCourseForLearner,
	listCoursesForLearner,
} from "@/lib/course-repository";
import { attachLearnerCookie, getLearnerSession } from "@/lib/learner-session";
import { normalizeText } from "@/lib/course-generation";
import type { GenerateCourseInput } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
	try {
		const { learnerId, setCookie } = await getLearnerSession();
		const courses = await listCoursesForLearner(learnerId);
		const response = NextResponse.json(courses);
		return attachLearnerCookie(response, learnerId, setCookie);
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to load courses.",
			},
			{ status: 500 },
		);
	}
}

export async function POST(request: Request) {
	try {
		const input = (await request.json()) as GenerateCourseInput;

		const hasTopic = Boolean(normalizeText(input.topic));
		const hasSource = Boolean(
			normalizeText(input.sourceText) || normalizeText(input.sourceFileName),
		);

		if ((!hasTopic && !hasSource) || !normalizeText(input.currentKnowledge)) {
			return NextResponse.json(
				{ error: "Enter a topic or upload source material." },
				{ status: 400 },
			);
		}

		if (!hasTopic && input.sourceFileName) {
			input.topic = input.sourceFileName.replace(/\.[^/.]+$/, "");
		}

		const { learnerId, setCookie } = await getLearnerSession();
		const course = await createCourseForLearner(learnerId, input);
		const response = NextResponse.json(course, { status: 201 });
		return attachLearnerCookie(response, learnerId, setCookie);
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to create course.",
			},
			{ status: 500 },
		);
	}
}
