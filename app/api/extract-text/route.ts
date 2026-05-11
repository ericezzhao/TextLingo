import { NextResponse } from "next/server";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 12000;
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024;

function trimText(value: string) {
	const normalized = value.replace(/\s+/g, " ").trim();
	return {
		text: normalized.slice(0, MAX_TEXT_LENGTH),
		truncated: normalized.length > MAX_TEXT_LENGTH,
	};
}

export async function POST(request: Request) {
	try {
		const formData = await request.formData();
		const file = formData.get("file");

		if (!(file instanceof File)) {
			return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
		}

		if (file.size > MAX_UPLOAD_BYTES) {
			return NextResponse.json(
				{
					error:
						"Uploaded files must be under 4 MB on the hosted version. Try a smaller file or paste a shorter text excerpt.",
				},
				{ status: 413 },
			);
		}

		const fileName = file.name;
		const extension = fileName.split(".").pop()?.toLowerCase();
		const buffer = Buffer.from(await file.arrayBuffer());
		let text = "";

		if (["txt", "md", "csv"].includes(extension ?? "")) {
			text = buffer.toString("utf-8");
		} else if (extension === "pdf") {
			const pdf = await pdfParse(buffer);
			text = pdf.text;
		} else if (extension === "docx") {
			const result = await mammoth.extractRawText({ buffer });
			text = result.value;
		} else {
			return NextResponse.json(
				{ error: "Unsupported file type. Please upload TXT, PDF, or DOCX." },
				{ status: 400 },
			);
		}

		if (!text.trim()) {
			return NextResponse.json(
				{ error: "The uploaded file did not contain readable text." },
				{ status: 400 },
			);
		}

		const trimmed = trimText(text);

		return NextResponse.json({
			fileName,
			text: trimmed.text,
			truncated: trimmed.truncated,
		});
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error ? error.message : "Failed to extract text.",
			},
			{ status: 500 },
		);
	}
}
