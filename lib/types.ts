export type KnowledgeLevel = "beginner" | "intermediate" | "advanced";

export type LessonExample = {
	title: string;
	content: string;
};

export type LessonQuiz = {
	question: string;
	options: string[];
	answerIndex: number;
	explanation: string;
};

export type LessonExercise = {
	prompt: string;
	hint: string;
};

export type LessonVisual = {
	type:
		| "diagram"
		| "table"
		| "flow"
		| "comparison"
		| "timeline"
		| "token-arcs"
		| "mask-barrier"
		| "architecture-stack"
		| "equation-pipeline"
		| "branching-map"
		| "matrix"
		| "two-column-system"
		| "svg";
	title: string;
	caption: string;
	items: string[];
	columns?: string[];
	rows?: string[][];
	/** Legacy field. The app does not render raw model SVG directly. */
	svg?: string;
};

export type LessonPage = {
	title: string;
	body: string;
	visual?: LessonVisual;
	checkQuestion?: string;
};

export type Lesson = {
	id: string;
	orderIndex: number;
	sectionTitle?: string;
	sectionOrder?: number;
	title: string;
	objective: string;
	summary: string;
	explanation: string;
	keyPoints: string[];
	examples: LessonExample[];
	quiz: LessonQuiz;
	exercise: LessonExercise;
	pages?: LessonPage[];
};

export type Course = {
	id: string;
	topic: string;
	currentKnowledge: string;
	goal?: string;
	sourceFileName?: string;
	sourceText?: string;
	title: string;
	description: string;
	difficulty: KnowledgeLevel;
	estimatedMinutes: number;
	lessons: Lesson[];
	completedLessonIds: string[];
	currentLessonId?: string;
	createdAt: string;
	updatedAt: string;
};

export type GenerateCourseInput = {
	topic: string;
	currentKnowledge: string;
	goal?: string;
	sourceText?: string;
	sourceFileName?: string;
};

export type ExtractedFile = {
	fileName: string;
	text: string;
	truncated: boolean;
};
