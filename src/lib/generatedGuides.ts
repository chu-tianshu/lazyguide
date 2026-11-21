import { strings, type LanguageCode } from "./i18n";
import type { Preferences } from "./preferences";
import { supabase } from "./supabaseClient";

/**
 * Asks the server for the guide matching the visitor's preferences. The server reuses the stored
 * text for a combination it has generated before and calls Claude only for a new one.
 * Throws an Error whose message is safe to show.
 */
export async function generateGuide(
  museumId: string,
  workId: string,
  language: LanguageCode,
  prefs: Preferences,
): Promise<string> {
  const text = await requestGuide(museumId, workId, language, prefs, false);
  if (!text) throw new Error(strings[language].errors.failed);
  return text;
}

/** Returns the stored guide for exactly these preferences, or null if none exists yet. Never generates. */
export async function lookupGuide(
  museumId: string,
  workId: string,
  language: LanguageCode,
  prefs: Preferences,
): Promise<string | null> {
  return requestGuide(museumId, workId, language, prefs, true);
}

async function requestGuide(
  museumId: string,
  workId: string,
  language: LanguageCode,
  prefs: Preferences,
  lookupOnly: boolean,
): Promise<string | null> {
  const e = strings[language].errors;
  const { data } = (await supabase?.auth.getSession()) ?? { data: undefined };
  const token = data?.session?.access_token;
  if (!token) throw new Error(e.signIn);

  let res: Response;
  try {
    res = await fetch("/api/generate-guide", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...prefs, museumId, workId, language, lookupOnly }),
    });
  } catch {
    throw new Error(e.network);
  }
  const body = (await res.json().catch(() => ({}))) as { text?: string | null; error?: string };
  if (!res.ok) throw new Error(body.error ?? e.failed);
  if (!body.text) {
    if (lookupOnly) return null;
    throw new Error(e.failed);
  }
  return body.text;
}
