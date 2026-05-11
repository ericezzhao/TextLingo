import { AppShell } from "@/components/app-shell";
import { CreateCourseForm } from "@/components/create-course-form";

export default function CreatePage() {
	return (
		<AppShell active="create">
			<div className="mx-auto max-w-3xl space-y-5">
				<div>
					<p className="text-xs font-semibold uppercase tracking-[0.18em] text-[hsl(var(--text-tertiary))]">
						Create
					</p>
					<h1 className="mt-2 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
						What do you want to learn?
					</h1>
					<p className="mt-3 text-[hsl(var(--text-secondary))]">
						Enter a topic and optionally upload source material. TextLingo will
						turn it into a visual learning map.
					</p>
				</div>
				<CreateCourseForm />
			</div>
		</AppShell>
	);
}
