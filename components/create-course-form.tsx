"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { createCourse } from "@/lib/course-api";
import type { ExtractedFile } from "@/lib/types";

type FormState = {
	topic: string;
};

const initialState: FormState = {
	topic: "",
};

const inputClass =
	"w-full rounded-2xl border border-[hsl(var(--border))] bg-[hsl(var(--surface))] px-4 py-3 text-[hsl(var(--text-primary))] outline-none transition placeholder:text-[hsl(var(--text-tertiary))] focus:border-[hsl(var(--brand-hover))] focus:ring-2 focus:ring-[hsl(var(--brand-bg))]";

const buildingMessages = [
	"Structuring your learning map...",
	"Reading the source material for key ideas...",
	"Designing lesson pages and checkpoints...",
	"Drafting diagrams and visual explanations...",
	"Polishing quizzes and practice prompts...",
];

export function CreateCourseForm() {
	const router = useRouter();
	const [form, setForm] = useState<FormState>(initialState);
	const [file, setFile] = useState<File | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [statusMessage, setStatusMessage] = useState(
		"Generate a visual course in under a minute.",
	);

	const canSubmit = useMemo(
		() => form.topic.trim() && !loading,
		[form.topic, loading],
	);

	useEffect(() => {
		if (!loading) return;
		let index = 0;
		setStatusMessage(buildingMessages[index]);
		const interval = window.setInterval(() => {
			index = (index + 1) % buildingMessages.length;
			setStatusMessage(buildingMessages[index]);
		}, 2800);

		return () => window.clearInterval(interval);
	}, [loading]);

	async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
		event.preventDefault();
		setError(null);
		setLoading(true);

		try {
			let extractedFile: ExtractedFile | null = null;

			if (file) {
				setStatusMessage(`Extracting text from ${file.name}...`);
				const uploadFormData = new FormData();
				uploadFormData.append("file", file);

				const extractResponse = await fetch("/api/extract-text", {
					method: "POST",
					body: uploadFormData,
				});

				if (!extractResponse.ok) {
					const payload = (await extractResponse.json().catch(() => ({}))) as {
						error?: string;
					};
					throw new Error(payload.error ?? "Could not read the uploaded file.");
				}

				extractedFile = (await extractResponse.json()) as ExtractedFile;
			}

			setStatusMessage("Structuring your learning map...");

			const course = await createCourse({
				topic: form.topic,
				currentKnowledge:
					"Assume a motivated learner. Adapt explanations to the topic and source material; start approachable, then build depth progressively.",
				goal: extractedFile
					? "Use the uploaded source as the primary authority. Preserve its structure, terminology, claims, examples, and any described visuals/figures/tables when useful. Supplement only where needed for clarity."
					: "Create a visual course with clear sections, slide-based lessons, and educational diagrams.",
				sourceText: extractedFile?.text,
				sourceFileName: extractedFile?.fileName,
			});

			router.push(`/course/${course.id}`);
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong.");
		} finally {
			setLoading(false);
			setStatusMessage("Generate a visual course in under a minute.");
		}
	}

	return (
		<form
			onSubmit={handleSubmit}
			className="space-y-6 rounded-[28px] border border-[hsl(var(--border))] bg-[hsl(var(--surface))] p-5 shadow-sm md:p-6"
		>
			<label className="space-y-2 block">
				<span className="text-sm font-medium text-[hsl(var(--text-secondary))]">
					What do you want to learn?
				</span>
				<input
					className={`${inputClass} text-lg`}
					placeholder="e.g. Attention Is All You Need paper"
					value={form.topic}
					onChange={(event) =>
						setForm((current) => ({ ...current, topic: event.target.value }))
					}
				/>
			</label>

			<div className="rounded-2xl border border-dashed border-[hsl(var(--border-hover))] bg-[hsl(var(--surface-secondary))] p-5 text-sm text-[hsl(var(--text-secondary))]">
				<p className="mb-2 font-medium text-[hsl(var(--text-primary))]">
					Upload source material{" "}
					<span className="text-[hsl(var(--text-tertiary))]">(optional)</span>
				</p>
				<p className="mb-4">
					TXT, PDF, or DOCX. Upload a paper, notes, syllabus, or article for
					better course structure.
				</p>
				<label className="lesson-button-shadow inline-flex cursor-pointer items-center justify-center rounded-xl border border-[hsl(var(--border-hover))] bg-[hsl(var(--surface))] px-4 py-2 font-semibold uppercase text-[hsl(var(--text-primary))] transition hover:-translate-y-0.5 hover:bg-[hsl(var(--surface-hover))] active:translate-y-1 active:shadow-none">
					Choose file
					<input
						type="file"
						accept=".txt,.md,.pdf,.doc,.docx"
						onChange={(event) => setFile(event.target.files?.[0] ?? null)}
						className="sr-only"
					/>
				</label>
				{file ? (
					<div className="mt-3 text-xs text-[hsl(var(--brand-active))]">
						Selected: {file.name}
					</div>
				) : null}
			</div>

			<div className="flex flex-col gap-4 border-t border-[hsl(var(--border))] pt-5 md:flex-row md:items-center md:justify-between">
				<div>
					<p className="text-sm text-[hsl(var(--text-secondary))]">
						{statusMessage}
					</p>
					{error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
				</div>
				<button
					type="submit"
					disabled={!canSubmit}
					className="brand-button-shadow inline-flex items-center justify-center rounded-xl border border-[hsl(var(--brand-active))] bg-[hsl(var(--brand))] px-6 py-3 font-semibold uppercase text-[hsl(var(--text-primary))] transition hover:-translate-y-0.5 hover:bg-[hsl(var(--brand-hover))] active:translate-y-1 active:shadow-none disabled:cursor-not-allowed disabled:opacity-50"
				>
					{loading ? "Building..." : "Start learning"}
				</button>
			</div>
		</form>
	);
}
