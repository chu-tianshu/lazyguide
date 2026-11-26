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
  de: {
    length: {
      short: { title: "Kurz", desc: "Etwa 1 Minute" },
      medium: { title: "Mittel", desc: "Etwa 2–3 Minuten" },
      long: { title: "Lang", desc: "Etwa 5 Minuten" },
    },
    style: {
      conversational: { title: "Gesprächig", desc: "Warm und locker, wie ein Freund an Ihrer Seite" },
      storytelling: { title: "Erzählend", desc: "Als Geschichte mit rotem Faden erzählt" },
      scholarly: { title: "Wissenschaftlich", desc: "Präzise, mit kunsthistorischer Tiefe" },
      playful: { title: "Verspielt", desc: "Leicht, witzig und neugierig" },
    },
    topic: {
      history: { title: "Geschichte", desc: "Wann und warum es entstand" },
      technique: { title: "Technik", desc: "Materialien und Herstellung" },
      symbolism: { title: "Symbolik", desc: "Verborgene Bedeutungen und Ikonografie" },
      artist: { title: "Der Künstler", desc: "Leben und Werdegang" },
      culture: { title: "Kultur & Gesellschaft", desc: "Die Welt rund um das Werk" },
      anecdotes: { title: "Anekdoten", desc: "Überraschende Geschichten und Wissenswertes" },
    },
  },
  pt: {
    length: {
      short: { title: "Curta", desc: "Cerca de 1 minuto" },
      medium: { title: "Média", desc: "Cerca de 2–3 minutos" },
      long: { title: "Longa", desc: "Cerca de 5 minutos" },
    },
    style: {
      conversational: { title: "Conversacional", desc: "Caloroso e descontraído, como um amigo ao seu lado" },
      storytelling: { title: "Narrativo", desc: "Contado como uma história com fio condutor" },
      scholarly: { title: "Erudito", desc: "Rigoroso, com profundidade de história da arte" },
      playful: { title: "Descontraído", desc: "Leve, espirituoso e curioso" },
    },
    topic: {
      history: { title: "História", desc: "Quando e porque foi criada" },
      technique: { title: "Técnica", desc: "Materiais e como foi feita" },
      symbolism: { title: "Simbolismo", desc: "Significados ocultos e iconografia" },
      artist: { title: "O artista", desc: "A sua vida e carreira" },
      culture: { title: "Cultura e sociedade", desc: "O mundo em redor da obra" },
      anecdotes: { title: "Anedotas", desc: "Histórias surpreendentes e curiosidades" },
    },
  },
  it: {
    length: {
      short: { title: "Breve", desc: "Circa 1 minuto" },
      medium: { title: "Media", desc: "Circa 2–3 minuti" },
      long: { title: "Lunga", desc: "Circa 5 minuti" },
    },
    style: {
      conversational: { title: "Colloquiale", desc: "Caloroso e spontaneo, come un amico accanto a te" },
      storytelling: { title: "Narrativo", desc: "Raccontato come una storia con un filo conduttore" },
      scholarly: { title: "Accademico", desc: "Preciso, con profondità storico-artistica" },
      playful: { title: "Giocoso", desc: "Leggero, arguto e curioso" },
    },
    topic: {
      history: { title: "Storia", desc: "Quando e perché è stata creata" },
      technique: { title: "Tecnica", desc: "Materiali e modo di realizzazione" },
      symbolism: { title: "Simbolismo", desc: "Significati nascosti e iconografia" },
      artist: { title: "L’artista", desc: "La sua vita e la sua carriera" },
      culture: { title: "Cultura e società", desc: "Il mondo intorno all’opera" },
      anecdotes: { title: "Aneddoti", desc: "Storie sorprendenti e curiosità" },
    },
  },
  ja: {
    length: {
      short: { title: "短め", desc: "約1分" },
      medium: { title: "標準", desc: "約2〜3分" },
      long: { title: "長め", desc: "約5分" },
    },
    style: {
      conversational: { title: "会話調", desc: "友人がそばで語るような、温かく気軽な語り口" },
      storytelling: { title: "物語調", desc: "一本の筋でたどる物語として語る" },
      scholarly: { title: "学術的", desc: "正確で、美術史の深みがある" },
      playful: { title: "遊び心", desc: "軽やかで機知に富み、好奇心いっぱい" },
    },
    topic: {
      history: { title: "歴史", desc: "いつ、なぜ作られたのか" },
      technique: { title: "技法", desc: "素材と制作方法" },
      symbolism: { title: "象徴", desc: "隠された意味と図像学" },
      artist: { title: "作者", desc: "生涯と経歴" },
      culture: { title: "文化と社会", desc: "作品を取り巻く時代背景" },
      anecdotes: { title: "逸話", desc: "意外な物語や豆知識" },
    },
  },
  ko: {
    length: {
      short: { title: "짧게", desc: "약 1분" },
      medium: { title: "보통", desc: "약 2~3분" },
      long: { title: "길게", desc: "약 5분" },
    },
    style: {
      conversational: { title: "대화체", desc: "친구가 옆에서 말해 주듯 따뜻하고 편안하게" },
      storytelling: { title: "이야기체", desc: "하나의 줄기를 가진 이야기로 풀어서" },
      scholarly: { title: "학술적", desc: "정확하고 미술사적 깊이가 있게" },
      playful: { title: "유쾌하게", desc: "가볍고 재치 있으며 호기심 가득하게" },
    },
    topic: {
      history: { title: "역사", desc: "언제, 왜 만들어졌는지" },
      technique: { title: "기법", desc: "재료와 제작 방식" },
      symbolism: { title: "상징", desc: "숨은 의미와 도상학" },
      artist: { title: "작가", desc: "생애와 경력" },
      culture: { title: "문화와 사회", desc: "작품을 둘러싼 시대 배경" },
      anecdotes: { title: "일화", desc: "놀라운 이야기와 흥미로운 사실" },
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
