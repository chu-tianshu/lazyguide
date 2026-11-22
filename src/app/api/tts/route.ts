import { createHash } from "node:crypto";
import { isLanguageCode } from "@/lib/i18n";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const BUCKET = "tts";
const MODEL = "gpt-4o-mini-tts";
const MAX_CHARS = 1000; // one caption sentence; guards against using the route as a free TTS proxy
const INSTRUCTIONS =
  "Speak as a warm, curious museum guide chatting with one visitor. Natural, unhurried pacing with gentle variation in pitch; pause briefly at commas and between ideas. Never sound like you are reading.";

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

/**
 * Returns a public URL to the spoken version of one sentence. Audio is generated the first time a
 * sentence is requested (i.e. when a visitor plays that work) and stored in Supabase Storage, keyed by
 * a hash of the text and voice, so every later listener gets the cached file from the CDN.
 * Needs OPENAI_API_KEY; without it the client falls back to the browser voice.
 */
export async function POST(request: Request) {
  const admin = supabaseAdmin();
  const apiKey = process.env.OPENAI_API_KEY;
  if (!admin || !apiKey) {
    const missing = [!apiKey && "OPENAI_API_KEY", !admin && "SUPABASE_SERVICE_ROLE_KEY / NEXT_PUBLIC_SUPABASE_URL"].filter(Boolean);
    return json({ error: "unavailable", detail: `Missing server env: ${missing.join(", ")}` }, 503);
  }

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthorized" }, 401);
  const { data: auth } = await admin.auth.getUser(token);
  if (!auth.user) return json({ error: "unauthorized" }, 401);

  const raw = (await request.json().catch(() => null)) as { text?: unknown; language?: unknown } | null;
  const text = typeof raw?.text === "string" ? raw.text.trim() : "";
  if (!text || text.length > MAX_CHARS || !isLanguageCode(raw?.language)) return json({ error: "invalid" }, 400);

  const voice = process.env.OPENAI_TTS_VOICE || "coral";
  const hash = createHash("sha256").update(`${MODEL}|${voice}|${INSTRUCTIONS}|${text}`).digest("hex");
  const path = `${hash}.mp3`;
  const publicUrl = () => admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;

  // Cached already? A listing of the exact name is cheaper than downloading the file.
  const { data: existing } = await admin.storage.from(BUCKET).list("", { search: path, limit: 1 });
  if (existing?.some((f) => f.name === path)) return json({ url: publicUrl() });

  const res = await fetch("https://api.openai.com/v1/audio/speech", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, voice, input: text, instructions: INSTRUCTIONS, response_format: "mp3" }),
    signal: AbortSignal.timeout(30_000),
  }).catch(() => undefined);
  if (!res?.ok) return json({ error: "generation_failed" }, 502);

  const audio = new Uint8Array(await res.arrayBuffer());
  let up = await admin.storage.from(BUCKET).upload(path, audio, { contentType: "audio/mpeg", upsert: true });
  if (up.error && /not found/i.test(up.error.message)) {
    // First use: create the public bucket, then retry once.
    await admin.storage.createBucket(BUCKET, { public: true });
    up = await admin.storage.from(BUCKET).upload(path, audio, { contentType: "audio/mpeg", upsert: true });
  }
  if (up.error) return json({ error: "storage_failed" }, 502);
  return json({ url: publicUrl() });
}
