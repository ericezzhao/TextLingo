export const SOURCE_UPLOAD_BUCKET = "textlingo-source-uploads";
export const MAX_DIRECT_UPLOAD_BYTES = 4 * 1024 * 1024;
export const MAX_STORAGE_UPLOAD_BYTES = 25 * 1024 * 1024;

export function sanitizeStorageFileName(fileName: string) {
	return (
		fileName
			.replace(/[^a-zA-Z0-9._-]+/g, "-")
			.replace(/-+/g, "-")
			.replace(/^-|-$/g, "")
			.slice(0, 120) || "source-file"
	);
}

export function formatFileSize(bytes: number) {
	return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
