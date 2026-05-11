import { NextResponse } from "next/server";

import { getLearnerSession } from "@/lib/learner-session";
import { getSupabaseAdmin } from "@/lib/supabase-admin";
import {
	MAX_STORAGE_UPLOAD_BYTES,
	SOURCE_UPLOAD_BUCKET,
	sanitizeStorageFileName,
} from "@/lib/upload-storage";

export const runtime = "nodejs";

type UploadRequest = {
	fileName?: string;
	contentType?: string;
	size?: number;
};

async function ensureUploadBucket() {
	const supabase = getSupabaseAdmin();
	const { data: bucket } =
		await supabase.storage.getBucket(SOURCE_UPLOAD_BUCKET);

	if (!bucket) {
		const { error } = await supabase.storage.createBucket(
			SOURCE_UPLOAD_BUCKET,
			{
				public: false,
				fileSizeLimit: MAX_STORAGE_UPLOAD_BYTES,
				allowedMimeTypes: [
					"text/plain",
					"text/markdown",
					"text/csv",
					"application/pdf",
					"application/vnd.openxmlformats-officedocument.wordprocessingml.document",
				],
			},
		);

		if (error && !/already exists/i.test(error.message)) {
			throw new Error(`Failed to create upload bucket: ${error.message}`);
		}
	}
}

export async function POST(request: Request) {
	try {
		const body = (await request.json()) as UploadRequest;
		const fileName = body.fileName?.trim();
		const size = Number(body.size ?? 0);

		if (!fileName) {
			return NextResponse.json(
				{ error: "File name is required." },
				{ status: 400 },
			);
		}

		if (!Number.isFinite(size) || size <= 0) {
			return NextResponse.json(
				{ error: "File size is required." },
				{ status: 400 },
			);
		}

		if (size > MAX_STORAGE_UPLOAD_BYTES) {
			return NextResponse.json(
				{ error: "Uploaded files must be under 25 MB." },
				{ status: 413 },
			);
		}

		await ensureUploadBucket();

		const { learnerId } = await getLearnerSession();
		const safeName = sanitizeStorageFileName(fileName);
		const path = `${learnerId}/${Date.now()}-${crypto.randomUUID()}-${safeName}`;
		const supabase = getSupabaseAdmin();
		const { data, error } = await supabase.storage
			.from(SOURCE_UPLOAD_BUCKET)
			.createSignedUploadUrl(path, { upsert: true });

		if (error || !data) {
			throw new Error(error?.message ?? "Failed to create signed upload URL.");
		}

		return NextResponse.json({
			bucket: SOURCE_UPLOAD_BUCKET,
			path,
			signedUrl: data.signedUrl,
			token: data.token,
		});
	} catch (error) {
		return NextResponse.json(
			{
				error:
					error instanceof Error
						? error.message
						: "Failed to prepare file upload.",
			},
			{ status: 500 },
		);
	}
}
