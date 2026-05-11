import { SectionReviewViewer } from "@/components/section-review-viewer";

type SectionReviewPageProps = {
	params: Promise<{
		courseId: string;
		sectionOrder: string;
	}>;
};

export default async function SectionReviewPage({
	params,
}: SectionReviewPageProps) {
	const { courseId, sectionOrder } = await params;

	return (
		<SectionReviewViewer
			courseId={courseId}
			sectionOrder={Number(sectionOrder)}
		/>
	);
}
