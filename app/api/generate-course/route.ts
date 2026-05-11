import { NextResponse } from "next/server";

import { generateCourseContent, normalizeText } from "@/lib/course-generation";
import type { GenerateCourseInput } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
	try {
		const input = (await request.json()) as GenerateCourseInput;

		if (!normalizeText(input.topic) || !normalizeText(input.currentKnowledge)) {
			return NextResponse.json(
				{ error: "Topic and current knowledge are required." },
				{ status: 400 },
			);
		}

		const generated = await generateCourseContent(input);
		return NextResponse.json(generated);
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to generate course.",
			},
			{ status: 500 },
		);
	}
}
