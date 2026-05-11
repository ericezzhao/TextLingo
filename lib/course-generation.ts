import { buildDemoCourse } from "@/lib/demo-course";
import type { Course, GenerateCourseInput } from "@/lib/types";

const OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions";

type GeneratedCoursePayload = Pick<
	Course,
	"title" | "description" | "difficulty" | "estimatedMinutes" | "lessons"
>;

type OpenAIPayload = {
	choices?: Array<{
		message?: {
			content?: string;
		};
	}>;
};

export function normalizeText(value?: string) {
	return value?.trim().replace(/\s+/g, " ") ?? "";
}

function buildPrompt(input: GenerateCourseInput) {
	return [
		"You are generating a visual learning course for a web app named TextLingo.",
		"The user wants a course map with named sections, lesson nodes, section reviews, and slide-based lessons.",
		"Return ONLY valid JSON. No markdown. No commentary.",
		"JSON shape:",
		JSON.stringify(
			{
				title: "Attention Is All You Need Deep Dive",
				description: "A visual course description.",
				difficulty: "beginner | intermediate | advanced",
				estimatedMinutes: 180,
				lessons: [
					{
						id: "attention-basics",
						orderIndex: 1,
						sectionTitle: "Attention Mechanisms",
						sectionOrder: 3,
						title: "Attention Basics",
						objective:
							"How can a model learn to focus on the most relevant parts of the input?",
						summary:
							"Learn attention as selective focus using query-key-value weighting.",
						explanation: "A concise fallback explanation.",
						keyPoints: [
							"Queries ask",
							"Keys match",
							"Values carry information",
						],
						examples: [
							{
								title: "Reading a sentence",
								content: "Your brain emphasizes key words.",
							},
						],
						quiz: {
							question: "What does attention compute?",
							options: [
								"Weighted sums of values",
								"Random masks",
								"Fixed embeddings",
								"Only word order",
							],
							answerIndex: 0,
							explanation:
								"Attention scores values by query-key compatibility.",
						},
						exercise: {
							prompt: "Explain Q, K, and V using your own analogy.",
							hint: "Use a search/file cabinet analogy.",
						},
						pages: [
							{
								title: "Intro",
								body: "How can a model learn to focus on the most relevant parts of the input?",
							},
						],
					},
				],
			},
			null,
			2,
		),
		"Course structure requirements:",
		"- Create 5 to 8 named sections for broad topics/papers.",
		"- Each section must contain 3 to 5 lessons.",
		"- Set sectionTitle and sectionOrder on every lesson.",
		"- The UI adds a Section Review after each section, so do NOT create section review as a lesson.",
		"- Flatten all lessons into the top-level lessons array, ordered section by section.",
		"- orderIndex is global across the whole course, starting at 1.",
		"Lesson page requirements:",
		"- Every lesson must have 7 or 8 pages.",
		"- Page 1 is a title/intro question ONLY: body should be one compelling question or hook plus the lesson title. Do NOT include visual on page 1.",
		"- Page 2 should start with 'What will you learn?' and include a useful roadmap visual.",
		"- Page body length: write 2 to 4 short paragraphs or 90 to 160 words per teaching page. Do not return one-sentence pages except the intro hook.",
		"- Middle pages should teach one clear idea each, using accurate domain terminology, concrete mechanism, and a quick intuition/example.",
		"- Each teaching page should include enough explanation that a learner could answer 'why does this work?' without guessing.",
		"- Every teaching page should include a checkQuestion: one open-ended question that can be answered using only that page's content.",
		"- Pages 2 through final page may include a visual object only when it genuinely clarifies the idea; do not force decorative visuals.",
		"- IMPORTANT: Do NOT generate raw SVG markup. Leave visual.svg empty or omit it. The app renders diagrams from visual.type, visual.title, visual.caption, visual.items, columns, and rows.",
		"- For visual.type use only: flow, comparison, diagram, table, timeline, token-arcs, mask-barrier, architecture-stack, equation-pipeline, branching-map, matrix, or two-column-system.",
		"- visual.items should contain 3 to 6 short labels, each 1 to 4 words. These labels become diagram nodes, so keep them concise.",
		"- For table visuals, include columns and rows. For all other visuals, include meaningful items and caption.",
		"- Choose visual.type intentionally: use token-arcs for words/tokens attending to each other; mask-barrier for causal/future masking; architecture-stack for layered model blocks; equation-pipeline for formulas/processes; timeline for ordered stages; matrix for attention weights or masks; branching-map for causes/effects or category maps; comparison/two-column-system for contrasts.",
		"- Visual variety: do not reuse the same three-box flow repeatedly. Prefer the specific templates above whenever they match the content.",
		"- For Attention/Transformer topics, visual labels should represent Q/K/V, dot product, scale/softmax, weights, values, output, encoder/decoder, masks, positional encoding, etc. when relevant.",
		"- Visuals should be meaningful: diagrams, tables, flows, comparisons, weighted maps, or architecture schematics. Avoid generic supplemental illustrations that repeat the prose without adding structure.",
		"- The final page should be 'Putting It All Together' or a workflow/checkpoint.",
		"Quality requirements:",
		"- Optimize for correctness and teaching quality over breadth. Avoid vague filler like 'this matters' unless followed by a concrete mechanism.",
		"- Each lesson must answer: what problem this solves, how it works, why each part exists, one concrete example, and one common misconception.",
		"- Quizzes must test understanding, not vocabulary. Distractors should be plausible misconceptions from the lesson.",
		"- Exercises must ask the learner to apply the idea to a new case, not merely restate definitions.",
		"Style requirements:",
		"- Use clear, visual, concise micro-lessons.",
		"- Avoid long textbook dumps.",
		"- Prefer concrete analogies and named visual labels, but do not replace technical accuracy with analogy.",
		"- For papers, preserve the actual paper structure, claims, equations, results, and terminology.",
		"- If uploaded material is provided, treat it as the primary authority. Build the course from that source first, not generic prior knowledge.",
		"- If the source mentions figures, diagrams, tables, workflows, equations, architecture blocks, screenshots, examples, or visual relationships, use those as inspiration for lesson visuals and explicitly teach what they show.",
		"- Supplement source material only to clarify missing prerequisites or connect ideas; do not contradict or replace the source.",
		"Quiz requirements:",
		"- Every lesson must include one quiz object. The app will show this as the end-of-lesson review quiz after the lesson pages.",
		"- quiz.options must have exactly 4 strings.",
		"- quiz.answerIndex must be 0, 1, 2, or 3.",
		"- These lesson quizzes will also be reused in the section review, so make each quiz cover the lesson's central concept clearly.",
		`Topic: ${normalizeText(input.topic)}`,
		`Current knowledge: ${normalizeText(input.currentKnowledge)}`,
		`Goal: ${normalizeText(input.goal) || "Not provided"}`,
		`Uploaded file name: ${normalizeText(input.sourceFileName) || "None"}`,
		`Uploaded file excerpt: ${normalizeText(input.sourceText).slice(0, 9000) || "None"}`,
	].join("\n");
}

function validateCoursePayload(
	payload: unknown,
): payload is GeneratedCoursePayload {
	if (!payload || typeof payload !== "object") return false;

	const candidate = payload as {
		lessons?: unknown[];
		title?: unknown;
		description?: unknown;
		difficulty?: unknown;
		estimatedMinutes?: unknown;
	};

	return (
		typeof candidate.title === "string" &&
		typeof candidate.description === "string" &&
		typeof candidate.difficulty === "string" &&
		typeof candidate.estimatedMinutes === "number" &&
		Array.isArray(candidate.lessons) &&
		candidate.lessons.length > 0
	);
}

async function generateWithOpenAI(
	input: GenerateCourseInput,
): Promise<GeneratedCoursePayload | null> {
	const apiKey = process.env.OPENAI_API_KEY;
	if (!apiKey) return null;

	const response = await fetch(OPENAI_ENDPOINT, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Authorization: `Bearer ${apiKey}`,
		},
		body: JSON.stringify({
			model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
			temperature: 0.65,
			response_format: { type: "json_object" },
			messages: [
				{
					role: "system",
					content:
						"You are an expert curriculum designer and technical explainer. Generate accurate, source-grounded JSON for visual micro-learning courses. Prioritize teaching quality, concrete mechanisms, strong misconceptions-based quizzes, and useful educational diagrams. Always follow the schema exactly.",
				},
				{
					role: "user",
					content: buildPrompt(input),
				},
			],
		}),
	});

	if (!response.ok) {
		throw new Error(`OpenAI request failed with status ${response.status}.`);
	}

	const payload = (await response.json()) as OpenAIPayload;
	const content = payload.choices?.[0]?.message?.content;
	if (!content) {
		throw new Error("OpenAI returned an empty response.");
	}

	const parsed = JSON.parse(content) as unknown;
	if (!validateCoursePayload(parsed)) {
		throw new Error("Model returned invalid course JSON.");
	}

	return parsed;
}

export async function generateCourseContent(
	input: GenerateCourseInput,
): Promise<GeneratedCoursePayload> {
	return (await generateWithOpenAI(input)) ?? buildDemoCourse(input);
}
