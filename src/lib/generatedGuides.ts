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
  const e = strings[language].errors;
  const { data } = (await supabase?.auth.getSession()) ?? { data: undefined };
  const token = data?.session?.access_token;
  if (!token) throw new Error(e.signIn);

  let res: Response;
  try {
    res = await fetch("/api/generate-guide", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...prefs, museumId, workId, language }),
    });
  } catch {
    throw new Error(e.network);
  }
  const body = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
  if (!res.ok || !body.text) throw new Error(body.error ?? e.failed);
  return body.text;
}
