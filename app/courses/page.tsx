import { AppShell } from "@/components/app-shell";
import { CourseLibrary } from "@/components/course-library";

export default function CoursesPage() {
	return (
		<AppShell active="courses">
			<div className="space-y-6">
				<div className="max-w-3xl">
					<p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--text-tertiary))]">
						Courses
					</p>
					<h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
						Your learning library
					</h1>
					<p className="mt-3 text-[hsl(var(--text-secondary))]">
						Review, rename, or delete the visual courses you&apos;ve created.
					</p>
				</div>
				<CourseLibrary variant="table" />
			</div>
		</AppShell>
	);
}
