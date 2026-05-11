import type { GenerateCourseInput, KnowledgeLevel, Lesson } from "@/lib/types";

function slugify(value: string) {
	return value
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/(^-|-$)/g, "");
}

function detectDifficulty(currentKnowledge: string): KnowledgeLevel {
	const lower = currentKnowledge.toLowerCase();
	if (/(advanced|expert|professional|strong)/.test(lower)) return "advanced";
	if (/(intermediate|some experience|familiar)/.test(lower))
		return "intermediate";
	return "beginner";
}

function makePages(topic: string, lessonTitle: string) {
	return [
		{
			title: "Intro",
			body: `How can ${lessonTitle.toLowerCase()} help you understand ${topic}?`,
		},
		{
			title: "What will you learn?",
			body: `You will learn the core idea behind ${lessonTitle}, why it matters, and how to recognize it in real examples.`,
			visual: {
				type: "table" as const,
				title: "Learning Targets",
				caption: "Three anchors for the lesson.",
				items: ["Concept", "Analogy", "Application"],
				columns: ["Target", "Purpose"],
				rows: [
					["Concept", "Name the idea"],
					["Analogy", "Make it intuitive"],
					["Application", "Use it in context"],
				],
			},
		},
		{
			title: "The Core Mechanism",
			body: `${lessonTitle} works by breaking a large idea into smaller moving parts, then showing how those parts interact.`,
			visual: {
				type: "flow" as const,
				title: "Mechanism Flow",
				caption: "Each step transforms the previous one.",
				items: ["Part A", "Part B", "Result"],
			},
		},
		{
			title: "Concrete Analogy",
			body: `Think of ${lessonTitle} like a guided search: the system decides what matters, then routes attention toward it.`,
			visual: {
				type: "comparison" as const,
				title: "Analogy Bridge",
				caption: "Link the abstract idea to something familiar.",
				items: ["Search", "Match", "Use"],
			},
		},
		{
			title: "Worked Example",
			body: `In practice, ${lessonTitle} helps you identify what information should be emphasized and what can be ignored.`,
			visual: {
				type: "table" as const,
				title: "Example Table",
				caption: "Important information receives more weight.",
				items: ["High weight", "Low weight"],
				columns: ["Signal", "Weight"],
				rows: [
					["Relevant detail", "High"],
					["Background noise", "Low"],
				],
			},
		},
		{
			title: "Check Understanding",
			body: `Before moving on, check whether you can explain why ${lessonTitle} matters without memorizing wording.`,
			visual: {
				type: "diagram" as const,
				title: "Self Check",
				caption: "Explain, apply, then verify.",
				items: ["Explain", "Apply", "Verify"],
			},
			checkQuestion: `What is the main purpose of ${lessonTitle}?`,
		},
		{
			title: "Putting It All Together",
			body: `You can now place ${lessonTitle} inside the bigger ${topic} learning map and connect it to the next lesson.`,
			visual: {
				type: "flow" as const,
				title: "Workflow",
				caption: "A final synthesis step.",
				items: ["Understand", "Connect", "Continue"],
			},
		},
	];
}

export function buildDemoCourse(input: GenerateCourseInput) {
	const difficulty = detectDifficulty(input.currentKnowledge);
	const title = `${input.topic} Visual Foundations`;
	const sections = [
		{
			title: "Motivation",
			lessons: ["Why This Matters", "The Core Problem", "The Big Idea"],
		},
		{
			title: "Core Architecture",
			lessons: ["System Overview", "Main Components", "Information Flow"],
		},
		{
			title: "Attention Mechanisms",
			lessons: [
				"Attention Basics",
				"Dot-Product Attention",
				"Multi-Head Attention",
			],
		},
	];

	let orderIndex = 1;
	const lessons: Lesson[] = sections.flatMap((section, sectionIndex) =>
		section.lessons.map((lessonTitle) => {
			const lesson: Lesson = {
				id: slugify(`${section.title}-${lessonTitle}`),
				orderIndex,
				sectionTitle: section.title,
				sectionOrder: sectionIndex + 1,
				title: lessonTitle,
				objective: `How does ${lessonTitle.toLowerCase()} fit into ${input.topic}?`,
				summary: `A visual lesson about ${lessonTitle.toLowerCase()} within ${section.title.toLowerCase()}.`,
				explanation: `${lessonTitle} becomes easier when treated as a visual mechanism: identify the parts, understand their roles, then connect them into a workflow.`,
				keyPoints: [
					`${lessonTitle} has a clear role in ${section.title}.`,
					`Visual structure makes the concept easier to remember.`,
					`Examples show how the concept behaves in context.`,
				],
				examples: [
					{
						title: "Simple analogy",
						content: `Think of ${lessonTitle.toLowerCase()} as a guided focus tool inside ${input.topic}.`,
					},
				],
				quiz: {
					question: `What is the main value of ${lessonTitle}?`,
					options: [
						"It makes the idea easier to focus on and apply",
						"It removes the need for examples",
						"It skips the surrounding context",
						"It only memorizes terminology",
					],
					answerIndex: 0,
					explanation: `The lesson is designed to connect ${lessonTitle} to usable understanding.`,
				},
				exercise: {
					prompt: `Explain ${lessonTitle} in your own words using one analogy.`,
					hint: "Focus on what it does, not just what it is called.",
				},
				pages: makePages(input.topic, lessonTitle),
			};
			orderIndex += 1;
			return lesson;
		}),
	);

	return {
		title,
		description: `A visual TextLingo course on ${input.topic}, organized into named sections, lesson nodes, and slide-based micro-lessons.`,
		difficulty,
		estimatedMinutes: lessons.length * 10,
		lessons,
	};
}
