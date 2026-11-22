import { supabase } from "./supabaseClient";
import type { LanguageCode } from "./i18n";

const cache = new Map<string, Promise<string>>();

/**
 * Resolves to the URL of the neural-voice audio for one sentence. Requests are made only when a
 * sentence is about to be played (lazy), and each is remembered for the rest of the session.
 * Rejects when the service is unavailable, so the caller can fall back to the browser voice.
 */
export function speechUrl(text: string, language: LanguageCode): Promise<string> {
  const key = `${language}|${text}`;
  let p = cache.get(key);
  if (!p) {
    p = request(text, language);
    cache.set(key, p);
    p.catch(() => cache.delete(key)); // let a later attempt retry
  }
  return p;
}

async function request(text: string, language: LanguageCode): Promise<string> {
  const { data } = (await supabase?.auth.getSession()) ?? { data: undefined };
  const token = data?.session?.access_token;
  if (!token) {
    console.warn("[LazyGuide] Natural voice needs a signed-in session. Using the browser voice.");
    throw new Error("no signed-in session token");
  }
  const res = await fetch("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ text, language }),
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as { error?: string; detail?: string };
    console.warn(`[LazyGuide] Natural voice unavailable (${res.status} ${body.error ?? ""}). ${body.detail ?? ""} Using the browser voice.`);
    throw new Error(`/api/tts ${res.status}: ${body.error ?? ""} ${body.detail ?? ""}`.trim());
  }
  return ((await res.json()) as { url: string }).url;
}
