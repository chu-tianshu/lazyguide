/**
 * Guide preferences: what a visitor wants generated guides to be like. Stored per user in
 * `user_preferences` (supabase/personalization.sql); row-level security scopes every query
 * to the current user, so these are plain client-side calls.
 */
import { isLanguageCode, type LanguageCode } from "./i18n";
import { supabase } from "./supabaseClient";

export const LENGTHS = ["short", "medium", "long"] as const;
export const STYLES = ["conversational", "storytelling", "scholarly", "playful"] as const;
export const TOPICS = ["history", "technique", "symbolism", "artist", "culture", "anecdotes"] as const;

export type GuideLength = (typeof LENGTHS)[number];
export type GuideStyle = (typeof STYLES)[number];
export type GuideTopic = (typeof TOPICS)[number];

export interface Preferences {
  /** Language of the guides and of the guide pages. */
  language: LanguageCode;
  length: GuideLength;
  style: GuideStyle;
  topics: GuideTopic[];
}

export const OPTION_LABELS = {
  en: {
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
  },
  zh: {
    length: {
      short: { title: "简短", desc: "约1分钟" },
      medium: { title: "适中", desc: "约2–3分钟" },
      long: { title: "详尽", desc: "约5分钟" },
    },
    style: {
      conversational: { title: "轻松对话", desc: "亲切自然，像朋友在身边讲解" },
      storytelling: { title: "讲故事", desc: "以叙事的方式娓娓道来" },
      scholarly: { title: "学术严谨", desc: "精确，具有艺术史深度" },
      playful: { title: "俏皮有趣", desc: "轻松、机智、充满好奇" },
    },
    topic: {
      history: { title: "历史", desc: "创作的时间与缘由" },
      technique: { title: "技法", desc: "材料与制作方式" },
      symbolism: { title: "象征意义", desc: "隐藏的寓意与图像学" },
      artist: { title: "艺术家", desc: "其生平与创作历程" },
      culture: { title: "文化与社会", desc: "作品背后的时代背景" },
      anecdotes: { title: "轶事", desc: "令人惊讶的故事与趣闻" },
    },
  },
  fr: {
    length: {
      short: { title: "Court", desc: "Environ 1 minute" },
      medium: { title: "Moyen", desc: "Environ 2 à 3 minutes" },
      long: { title: "Long", desc: "Environ 5 minutes" },
    },
    style: {
      conversational: { title: "Conversationnel", desc: "Chaleureux et naturel, comme un ami à vos côtés" },
      storytelling: { title: "Récit", desc: "Raconté comme une histoire avec un fil conducteur" },
      scholarly: { title: "Savant", desc: "Précis, avec la profondeur de l’histoire de l’art" },
      playful: { title: "Ludique", desc: "Léger, plein d’esprit et de curiosité" },
    },
    topic: {
      history: { title: "Histoire", desc: "Quand et pourquoi l’œuvre a été créée" },
      technique: { title: "Technique", desc: "Les matériaux et la façon de la réaliser" },
      symbolism: { title: "Symbolisme", desc: "Sens cachés et iconographie" },
      artist: { title: "L’artiste", desc: "Sa vie et sa carrière" },
      culture: { title: "Culture et société", desc: "Le monde autour de l’œuvre" },
      anecdotes: { title: "Anecdotes", desc: "Histoires surprenantes et curiosités" },
    },
  },
  es: {
    length: {
      short: { title: "Corta", desc: "Alrededor de 1 minuto" },
      medium: { title: "Media", desc: "Alrededor de 2–3 minutos" },
      long: { title: "Larga", desc: "Alrededor de 5 minutos" },
    },
    style: {
      conversational: { title: "Conversacional", desc: "Cercano y natural, como un amigo a tu lado" },
      storytelling: { title: "Narrativo", desc: "Contado como una historia con hilo conductor" },
      scholarly: { title: "Erudito", desc: "Preciso, con profundidad de historia del arte" },
      playful: { title: "Desenfadado", desc: "Ligero, ingenioso y curioso" },
    },
    topic: {
      history: { title: "Historia", desc: "Cuándo y por qué se creó" },
      technique: { title: "Técnica", desc: "Materiales y cómo se hizo" },
      symbolism: { title: "Simbolismo", desc: "Significados ocultos e iconografía" },
      artist: { title: "El artista", desc: "Su vida y trayectoria" },
      culture: { title: "Cultura y sociedad", desc: "El mundo que rodea la obra" },
      anecdotes: { title: "Anécdotas", desc: "Historias sorprendentes y curiosidades" },
    },
  },
} as const;

export const DEFAULT_PREFERENCES: Preferences = {
  language: "en",
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
    isLanguageCode(p.language) &&
    LENGTHS.includes(p.length as GuideLength) &&
    STYLES.includes(p.style as GuideStyle) &&
    Array.isArray(p.topics) &&
    p.topics.length > 0 &&
    p.topics.every((t) => TOPICS.includes(t as GuideTopic)) &&
    new Set(p.topics).size === p.topics.length
  );
}

/**
 * The signed-in visitor's saved preferences. `prefs` is null until they have saved a complete set
 * (a row saved before language existed counts as incomplete); `draft` carries whatever was saved, to prefill
 * the form. Throws if the lookup fails.
 */
export async function fetchPreferences(): Promise<{ prefs: Preferences | null; draft: Partial<Preferences> | null }> {
  if (!supabase) return { prefs: null, draft: null };
  const { data, error } = await supabase
    .from("user_preferences")
    .select("language, length, style, topics")
    .maybeSingle();
  if (error) throw error;
  if (!data) return { prefs: null, draft: null };
  if (isPreferences(data)) return { prefs: data, draft: null };
  return {
    prefs: null,
    draft: {
      ...(isLanguageCode(data.language) ? { language: data.language } : {}),
      ...(LENGTHS.includes(data.length) ? { length: data.length } : {}),
      ...(STYLES.includes(data.style) ? { style: data.style } : {}),
      ...(Array.isArray(data.topics) ? { topics: data.topics.filter((t: string) => TOPICS.includes(t as GuideTopic)) } : {}),
    },
  };
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
