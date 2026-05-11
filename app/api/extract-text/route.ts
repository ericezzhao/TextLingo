import { NextResponse } from "next/server";
import mammoth from "mammoth";
import pdfParse from "pdf-parse";

import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
	MAX_DIRECT_UPLOAD_BYTES,
	SOURCE_UPLOAD_BUCKET,
} from "@/lib/upload-storage";

export const runtime = "nodejs";

const MAX_TEXT_LENGTH = 12000;

function trimText(value: string) {
	const normalized = value.replace(/\s+/g, " ").trim();
	return {
		text: normalized.slice(0, MAX_TEXT_LENGTH),
		truncated: normalized.length > MAX_TEXT_LENGTH,
	};
}

async function readUpload(request: Request) {
	const contentType = request.headers.get("content-type") ?? "";

	if (contentType.includes("application/json")) {
		const body = (await request.json()) as {
			storagePath?: string;
			fileName?: string;
		};

		if (!body.storagePath || !body.fileName) {
			return { error: "Storage path and file name are required.", status: 400 };
		}

		const supabase = getSupabaseAdmin();
		const { data, error } = await supabase.storage
			.from(SOURCE_UPLOAD_BUCKET)
			.download(body.storagePath);

		if (error || !data) {
			throw new Error(error?.message ?? "Could not download uploaded file.");
		}

		return {
			fileName: body.fileName,
			buffer: Buffer.from(await data.arrayBuffer()),
		};
	}

	const formData = await request.formData();
	const file = formData.get("file");

	if (!(file instanceof File)) {
		return { error: "No file uploaded.", status: 400 };
	}

	if (file.size > MAX_DIRECT_UPLOAD_BYTES) {
		return {
			error:
				"This file is too large for direct extraction. Upload it through the large-file storage flow.",
			status: 413,
		};
	}

	return {
		fileName: file.name,
		buffer: Buffer.from(await file.arrayBuffer()),
	};
}

export async function POST(request: Request) {
	try {
		const upload = await readUpload(request);

		if ("error" in upload) {
			return NextResponse.json(
				{ error: upload.error },
				{ status: upload.status },
			);
		}

		const fileName = upload.fileName;
		const extension = fileName.split(".").pop()?.toLowerCase();
		const buffer = upload.buffer;
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
