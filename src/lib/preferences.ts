/**
 * Guide preferences: what a visitor wants generated guides to be like. Stored per user in
 * `user_preferences` (supabase/personalization.sql); row-level security scopes every query
 * to the current user, so these are plain client-side calls.
 */
import { supabase } from "./supabaseClient";

export const LENGTHS = ["short", "medium", "long"] as const;
export const STYLES = ["conversational", "storytelling", "scholarly", "playful"] as const;
export const TOPICS = ["history", "technique", "symbolism", "artist", "culture", "anecdotes"] as const;

export type GuideLength = (typeof LENGTHS)[number];
export type GuideStyle = (typeof STYLES)[number];
export type GuideTopic = (typeof TOPICS)[number];

export interface Preferences {
  length: GuideLength;
  style: GuideStyle;
  topics: GuideTopic[];
}

export const OPTION_LABELS = {
  length: {
    short: { title: "Short", desc: "About 1 minute" },
    medium: { title: "Medium", desc: "About 2–3 minutes" },
    long: { title: "Long", desc: "About 5 minutes" },
  },
  style: {
    conversational: { title: "Conversational", desc: "Warm and easy, like a friend beside you" },
    storytelling: { title: "Storytelling", desc: "Told as a narrative with a thread" },
    scholarly: { title: "Scholarly", desc: "Precise, with art-historical depth" },
    playful: { title: "Playful", desc: "Light, witty and curious" },
  },
  topic: {
    history: { title: "History", desc: "When and why it was made" },
    technique: { title: "Technique", desc: "Materials and how it was made" },
    symbolism: { title: "Symbolism", desc: "Hidden meanings and iconography" },
    artist: { title: "The artist", desc: "Their life and career" },
    culture: { title: "Culture & society", desc: "The world around the work" },
    anecdotes: { title: "Anecdotes", desc: "Surprising stories and trivia" },
  },
} as const;

export const DEFAULT_PREFERENCES: Preferences = {
  length: "medium",
  style: "conversational",
  topics: ["history", "symbolism"],
};

/** Topics in a fixed order, so the same selection always yields the same key. */
export function topicsKey(topics: readonly GuideTopic[]): string {
  return TOPICS.filter((t) => topics.includes(t)).join(",");
}

export function isPreferences(v: unknown): v is Preferences {
  if (!v || typeof v !== "object") return false;
  const p = v as Partial<Preferences>;
  return (
    LENGTHS.includes(p.length as GuideLength) &&
    STYLES.includes(p.style as GuideStyle) &&
    Array.isArray(p.topics) &&
    p.topics.length > 0 &&
    p.topics.every((t) => TOPICS.includes(t as GuideTopic)) &&
    new Set(p.topics).size === p.topics.length
  );
}

/** The signed-in visitor's saved preferences; null if none saved yet. Throws if the lookup fails. */
export async function fetchPreferences(): Promise<Preferences | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("user_preferences").select("length, style, topics").maybeSingle();
  if (error) throw error;
  if (!data || !isPreferences(data)) return null;
  return { length: data.length, style: data.style, topics: data.topics };
}

export async function savePreferences(prefs: Preferences): Promise<void> {
  if (!supabase) throw new Error("Not configured.");
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) throw new Error("Not signed in.");
  const { error } = await supabase
    .from("user_preferences")
    .upsert(
      { user_id: userId, ...prefs, topics: [...prefs.topics], updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
  if (error) throw error;
}
