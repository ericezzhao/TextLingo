import { NextResponse } from "next/server";

export const runtime = "nodejs";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

type Message = {
	role: "user" | "assistant";
	content: string;
};

type CheckUnderstandingPayload = {
	courseTitle?: string;
	lessonTitle?: string;
	pageTitle?: string;
	pageBody?: string;
	question?: string;
	messages?: Message[];
};

type OpenAIPayload = {
	choices?: Array<{
		message?: {
			content?: string;
		};
	}>;
};

function clean(value?: string) {
	return value?.trim().slice(0, 4000) ?? "";
}

export async function POST(request: Request) {
	try {
		const apiKey = process.env.OPENAI_API_KEY;
		if (!apiKey) {
			return NextResponse.json(
				{ error: "OPENAI_API_KEY is not configured." },
				{ status: 500 },
			);
		}

		const payload = (await request.json()) as CheckUnderstandingPayload;
		const messages = (payload.messages ?? []).slice(-8);

		const response = await fetch(OPENAI_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: `Bearer ${apiKey}`,
			},
			body: JSON.stringify({
				model:
					process.env.OPENAI_TUTOR_MODEL ??
					process.env.OPENAI_MODEL ??
					"gpt-5.4-mini",
				temperature: 0.35,
				messages: [
					{
						role: "system",
						content:
							"You are TextLingo's lesson tutor. Stay tightly focused on the current lesson page and the user's answer. Do not introduce unrelated concepts. Give concise feedback: what is correct, what is missing or confused, and one follow-up question if helpful. If the user says they do not know, explain the page idea simply and ask an easier question. Keep responses under 140 words.",
					},
					{
						role: "user",
						content: [
							`Course: ${clean(payload.courseTitle)}`,
							`Lesson: ${clean(payload.lessonTitle)}`,
							`Page: ${clean(payload.pageTitle)}`,
							`Page content: ${clean(payload.pageBody)}`,
							`Question to focus on: ${clean(payload.question)}`,
						].join("\n"),
					},
					...messages.map((message) => ({
						role: message.role,
						content: clean(message.content),
					})),
				],
			}),
		});

		if (!response.ok) {
			return NextResponse.json(
				{ error: `OpenAI request failed with status ${response.status}.` },
				{ status: 500 },
			);
		}

		const data = (await response.json()) as OpenAIPayload;
		const reply = data.choices?.[0]?.message?.content?.trim();
		if (!reply) throw new Error("Tutor returned an empty response.");

		return NextResponse.json({ reply });
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Failed to check understanding.",
			},
			{ status: 500 },
		);
	}
}
