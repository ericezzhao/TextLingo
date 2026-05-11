import type { Course, GenerateCourseInput } from "@/lib/types";
import { generateCourseContent } from "@/lib/course-generation";
import { getSupabaseAdmin } from "@/lib/supabase-admin";

type CourseRow = {
	id: string;
	learner_id: string;
	topic: string;
	current_knowledge: string;
	goal: string | null;
	source_file_name: string | null;
	source_text: string | null;
	title: string;
	description: string;
	difficulty: Course["difficulty"];
	estimated_minutes: number;
	lessons: Course["lessons"];
	completed_lesson_ids: string[] | null;
	current_lesson_id: string | null;
	created_at: string;
	updated_at: string;
};

function mapCourseRow(row: CourseRow): Course {
	return {
		id: row.id,
		topic: row.topic,
		currentKnowledge: row.current_knowledge,
		goal: row.goal ?? undefined,
		sourceFileName: row.source_file_name ?? undefined,
		sourceText: row.source_text ?? undefined,
		title: row.title,
		description: row.description,
		difficulty: row.difficulty,
		estimatedMinutes: row.estimated_minutes,
		lessons: row.lessons,
		completedLessonIds: row.completed_lesson_ids ?? [],
		currentLessonId: row.current_lesson_id ?? undefined,
		createdAt: row.created_at,
		updatedAt: row.updated_at,
	};
}

async function ensureLearnerExists(learnerId: string) {
	const supabase = getSupabaseAdmin();
	const { error } = await supabase
		.from("textlingo_learners")
		.upsert({ id: learnerId }, { onConflict: "id" });

	if (error) {
		throw new Error(`Failed to initialize learner session: ${error.message}`);
	}
}

export async function listCoursesForLearner(learnerId: string) {
	await ensureLearnerExists(learnerId);

	const supabase = getSupabaseAdmin();
	const { data, error } = await supabase
		.from("textlingo_courses")
		.select("*")
		.eq("learner_id", learnerId)
		.order("updated_at", { ascending: false });

	if (error) {
		throw new Error(`Failed to load courses: ${error.message}`);
	}

	return (data as CourseRow[]).map(mapCourseRow);
}

export async function getCourseForLearner(learnerId: string, courseId: string) {
	await ensureLearnerExists(learnerId);

	const supabase = getSupabaseAdmin();
	const { data, error } = await supabase
		.from("textlingo_courses")
		.select("*")
		.eq("learner_id", learnerId)
		.eq("id", courseId)
		.maybeSingle();

	if (error) {
		throw new Error(`Failed to load course: ${error.message}`);
	}

	return data ? mapCourseRow(data as CourseRow) : null;
}

export async function createCourseForLearner(
	learnerId: string,
	input: GenerateCourseInput,
) {
	await ensureLearnerExists(learnerId);

	const generated = await generateCourseContent(input);
	const supabase = getSupabaseAdmin();
	const { data, error } = await supabase
		.from("textlingo_courses")
		.insert({
			learner_id: learnerId,
			topic: input.topic,
			current_knowledge: input.currentKnowledge,
			goal: input.goal ?? null,
			source_file_name: input.sourceFileName ?? null,
			source_text: input.sourceText ?? null,
			title: generated.title,
			description: generated.description,
			difficulty: generated.difficulty,
			estimated_minutes: generated.estimatedMinutes,
			lessons: generated.lessons,
			completed_lesson_ids: [],
			current_lesson_id: generated.lessons[0]?.id ?? null,
		})
		.select("*")
		.single();

	if (error) {
		throw new Error(`Failed to save course: ${error.message}`);
	}

	return mapCourseRow(data as CourseRow);
}

type UpdateCourseProgressInput = {
	currentLessonId?: string;
	completeLessonId?: string;
	title?: string;
};

export async function updateCourseProgressForLearner(
	learnerId: string,
	courseId: string,
	input: UpdateCourseProgressInput,
) {
	const existingCourse = await getCourseForLearner(learnerId, courseId);
	if (!existingCourse) {
		return null;
	}

	const nextCompletedLessonIds = input.completeLessonId
		? Array.from(
				new Set([...existingCourse.completedLessonIds, input.completeLessonId]),
			)
		: existingCourse.completedLessonIds;

	const supabase = getSupabaseAdmin();
	const { data, error } = await supabase
		.from("textlingo_courses")
		.update({
			title: input.title?.trim() || existingCourse.title,
			completed_lesson_ids: nextCompletedLessonIds,
			current_lesson_id:
				input.currentLessonId ?? existingCourse.currentLessonId ?? null,
			updated_at: new Date().toISOString(),
		})
		.eq("learner_id", learnerId)
		.eq("id", courseId)
		.select("*")
		.single();

	if (error) {
		throw new Error(`Failed to update course progress: ${error.message}`);
	}

	return mapCourseRow(data as CourseRow);
}

export async function deleteCourseForLearner(
	learnerId: string,
	courseId: string,
) {
	await ensureLearnerExists(learnerId);

	const supabase = getSupabaseAdmin();
	const { error } = await supabase
		.from("textlingo_courses")
		.delete()
		.eq("learner_id", learnerId)
		.eq("id", courseId);

	if (error) {
		throw new Error(`Failed to delete course: ${error.message}`);
	}

	return true;
}
