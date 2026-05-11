import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

export const LEARNER_COOKIE_NAME = "textlingo_learner_id";

export async function getLearnerSession() {
	const cookieStore = await cookies();
	const existingLearnerId = cookieStore.get(LEARNER_COOKIE_NAME)?.value;

	if (existingLearnerId) {
		return {
			learnerId: existingLearnerId,
			setCookie: false,
		};
	}

	return {
		learnerId: crypto.randomUUID(),
		setCookie: true,
	};
}

export function attachLearnerCookie(
	response: NextResponse,
	learnerId: string,
	shouldSetCookie: boolean,
) {
	if (!shouldSetCookie) return response;

	response.cookies.set({
		name: LEARNER_COOKIE_NAME,
		value: learnerId,
		httpOnly: true,
		sameSite: "lax",
		secure: process.env.NODE_ENV === "production",
		path: "/",
		maxAge: 60 * 60 * 24 * 365,
	});

	return response;
}
