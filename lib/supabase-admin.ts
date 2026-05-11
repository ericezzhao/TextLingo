import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;

function extractSecretKeyFromJsonDictionary(raw?: string) {
	if (!raw) return undefined;

	try {
		const parsed = JSON.parse(raw) as Record<string, string>;
		return Object.values(parsed).find((value) => typeof value === "string");
	} catch {
		return undefined;
	}
}

function getSupabaseServerKey() {
	return (
		process.env.SUPABASE_SERVICE_ROLE_KEY ??
		process.env.SUPABASE_SECRET_KEY ??
		extractSecretKeyFromJsonDictionary(process.env.SUPABASE_SECRET_KEYS)
	);
}

export function isSupabaseConfigured() {
	return Boolean(supabaseUrl && getSupabaseServerKey());
}

export function getSupabaseAdmin() {
	const supabaseServerKey = getSupabaseServerKey();

	if (!supabaseUrl || !supabaseServerKey) {
		throw new Error(
			"Supabase is not configured. Add SUPABASE_URL plus one server-side secret: SUPABASE_SERVICE_ROLE_KEY, SUPABASE_SECRET_KEY, or SUPABASE_SECRET_KEYS.",
		);
	}

	return createClient(supabaseUrl, supabaseServerKey, {
		auth: {
			persistSession: false,
			autoRefreshToken: false,
		},
	});
}
