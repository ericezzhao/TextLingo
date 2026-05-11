import { LessonViewer } from "@/components/lesson-viewer";

export default async function LessonPage({
	params,
}: {
	params: Promise<{ courseId: string; lessonId: string }>;
}) {
	const { courseId, lessonId } = await params;

	return (
		<main className="py-4">
			<LessonViewer courseId={courseId} lessonId={lessonId} />
		</main>
	);
}
