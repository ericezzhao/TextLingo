import Link from "next/link";

import { AppShell } from "@/components/app-shell";
import { CourseLibrary } from "@/components/course-library";

export default function HomePage() {
	return (
		<AppShell active="home">
			<div className="space-y-8">
				<section className="overflow-hidden rounded-[28px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-4 shadow-sm md:p-6">
					<div className="grid gap-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
						<div className="space-y-6 py-4">
							<div className="inline-flex rounded-full bg-[hsl(var(--brand-bg))] px-4 py-2 text-sm font-medium text-[hsl(var(--brand-active))]">
								TextLingo
							</div>
							<div className="space-y-4">
								<h1 className="max-w-3xl text-5xl font-semibold leading-[1.02] tracking-[-0.04em] text-[hsl(var(--text-primary))] sm:text-6xl">
									Learn what you thought you couldn&apos;t.
								</h1>
								<p className="max-w-2xl text-lg leading-8 text-[hsl(var(--text-secondary))]">
									Create visual learning maps from any topic or uploaded source
									material. Study through short slide-based lessons with
									diagrams, checks, and progress.
								</p>
							</div>
							<div className="flex flex-wrap gap-3">
								<Link
									href="/create"
									className="brand-button-shadow rounded-xl border border-[hsl(var(--brand-active))] bg-[hsl(var(--brand))] px-5 py-3 text-sm font-semibold uppercase transition hover:-translate-y-0.5 hover:bg-[hsl(var(--brand-hover))] active:translate-y-1 active:shadow-none"
								>
									Create course
								</Link>
								<Link
									href="/courses"
									className="lesson-button-shadow rounded-xl border border-[hsl(var(--border-hover))] bg-[hsl(var(--surface))] px-5 py-3 text-sm font-semibold uppercase transition hover:-translate-y-0.5 hover:bg-[hsl(var(--surface-hover))] active:translate-y-1 active:shadow-none"
								>
									View courses
								</Link>
							</div>
						</div>

						<div className="relative rounded-[2rem] border border-[hsl(var(--border))] bg-[hsl(var(--surface-secondary))] p-6">
							<div className="mx-auto max-w-md py-4">
								<div className="mb-5 rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-6 py-3 shadow-sm">
									<h2 className="font-semibold">Example learning map</h2>
									<p className="text-sm text-[hsl(var(--text-secondary))]">
										A course path from basics to mastery
									</p>
								</div>
								<div className="relative space-y-7 py-4">
									{[
										["Big Picture", -70, true],
										["Core Concepts", -35, true],
										["Guided Practice", 0, false],
										["Section Review", -35, false],
									].map(([title, offset, active]) => (
										<div
											key={String(title)}
											className="relative flex justify-center"
										>
											<div
												className="relative flex items-center"
												style={{ transform: `translateX(${offset}px)` }}
											>
												<div
													className={`lesson-button-shadow flex size-16 items-center justify-center rounded-full border-2 transition hover:-translate-y-0.5 hover:bg-[hsl(var(--surface-hover))] active:translate-y-1 active:shadow-none ${
														active
															? "border-[hsl(var(--brand-active))] bg-[hsl(var(--brand-bg))] text-[hsl(var(--brand-active))]"
															: "border-[hsl(var(--border-hover))] bg-[hsl(var(--surface-secondary))] text-[hsl(var(--text-tertiary))]"
													}`}
												>
													{active
														? "✓✓"
														: title === "Section Review"
															? "🔒"
															: "◷"}
												</div>
												<div className="absolute left-full ml-4 w-44 text-sm text-[hsl(var(--text-primary))]">
													{String(title)}
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>
				</section>

				<CourseLibrary variant="compact" />
			</div>
		</AppShell>
	);
}
