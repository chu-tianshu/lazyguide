import { strings, type LanguageCode } from "./i18n";
import type { Preferences } from "./preferences";
import { supabase } from "./supabaseClient";

/** Guides fetched or generated this session, so reopening a painting shows its guide immediately. */
export interface GeneratedGuide {
  text: string;
  /** Angles worth exploring next that the guide does not cover. */
  suggestions: string[];
}

const sessionCache = new Map<string, GeneratedGuide>();

export function guideCacheKey(museumId: string, workId: string, language: LanguageCode, prefs: Preferences): string {
  return JSON.stringify([museumId, workId, language, prefs.length, prefs.style, [...prefs.topics].sort()]);
}

export function cachedGuide(museumId: string, workId: string, language: LanguageCode, prefs: Preferences): GeneratedGuide | null {
  return sessionCache.get(guideCacheKey(museumId, workId, language, prefs)) ?? null;
}

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
): Promise<GeneratedGuide> {
  const guide = await requestGuide(museumId, workId, language, prefs, false);
  if (!guide) throw new Error(strings[language].errors.failed);
  sessionCache.set(guideCacheKey(museumId, workId, language, prefs), guide);
  return guide;
}

/** Returns the stored guide for exactly these preferences, or null if none exists yet. Never generates. */
export async function lookupGuide(
  museumId: string,
  workId: string,
  language: LanguageCode,
  prefs: Preferences,
): Promise<GeneratedGuide | null> {
  const guide = await requestGuide(museumId, workId, language, prefs, true);
  if (guide) sessionCache.set(guideCacheKey(museumId, workId, language, prefs), guide);
  return guide;
}

async function requestGuide(
  museumId: string,
  workId: string,
  language: LanguageCode,
  prefs: Preferences,
  lookupOnly: boolean,
): Promise<GeneratedGuide | null> {
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
  const body = (await res.json().catch(() => ({}))) as { text?: string | null; suggestions?: string[]; error?: string };
  if (!res.ok) throw new Error(body.error ?? e.failed);
  if (!body.text) {
    if (lookupOnly) return null;
    throw new Error(e.failed);
  }
  return { text: body.text, suggestions: body.suggestions ?? [] };
}

/** Writes a short extra segment on one suggested angle, avoiding what the visitor has already heard. */
export async function exploreTopic(
  museumId: string,
  workId: string,
  language: LanguageCode,
  topic: string,
  covered: string,
): Promise<string> {
  const e = strings[language].errors;
  let res: Response;
  try {
    res = await fetch("/api/explore-topic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ museumId, workId, language, topic, covered }),
    });
  } catch {
    throw new Error(e.network);
  }
  const body = (await res.json().catch(() => ({}))) as { text?: string; error?: string };
  if (!res.ok || !body.text) throw new Error(body.error ?? e.failed);
  return body.text;
}
