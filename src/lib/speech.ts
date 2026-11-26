import type { LanguageCode } from "./i18n";

const SENTENCE: Record<LanguageCode, RegExp> = {
  en: /[^.!?]+(?:[.!?]+["’”)\]]*|$)/g,
  // French and Spanish also close quotes with » and ».
  fr: /[^.!?]+(?:[.!?]+["’”»)\]]*|$)/g,
  es: /[^.!?]+(?:[.!?]+["’”»)\]]*|$)/g,
  de: /[^.!?]+(?:[.!?]+["’“”«»)\]]*|$)/g,
  pt: /[^.!?]+(?:[.!?]+["’”»)\]]*|$)/g,
  it: /[^.!?]+(?:[.!?]+["’”»)\]]*|$)/g,
  // Japanese sentences end with 。！？.
  ja: /[^。！？!?]+(?:[。！？!?]+["”’）)」』]*|$)/g,
  ko: /[^.!?]+(?:[.!?]+["’”)\]]*|$)/g,
  // Chinese sentences end with 。！？ (decimal points inside numbers are not split).
  zh: /[^。！？!?]+(?:[。！？!?]+["”’）)」』]*|$)/g,
};
const MIN_LENGTH: Record<LanguageCode, number> = { en: 25, zh: 8, fr: 25, es: 25, de: 25, pt: 25, it: 25, ja: 8, ko: 12 };
const JOINER: Record<LanguageCode, string> = { en: " ", zh: "", fr: " ", es: " ", de: " ", pt: " ", it: " ", ja: "", ko: " " };

/**
 * Split guide text into sentence-sized chunks. Each chunk is spoken as one
 * utterance and highlighted as one caption unit. Very short fragments (e.g. the
 * "ca." in "ca. 1510") are merged into the sentence that follows them.
 */
export function chunkText(text: string, language: LanguageCode = "en"): string[] {
  const normalized = text.replace(/\s+/g, " ").trim();
  const parts = normalized.match(SENTENCE[language]) ?? [];
  const joiner = JOINER[language];

  const chunks: string[] = [];
  let pending = "";
  for (const part of parts) {
    const piece = (pending ? pending + joiner : "") + part.trim();
    if (piece.length < MIN_LENGTH[language]) {
      pending = piece;
      continue;
    }
    chunks.push(piece);
    pending = "";
  }
  if (pending) {
    if (chunks.length) chunks[chunks.length - 1] += joiner + pending;
    else chunks.push(pending);
  }
  return chunks;
}
