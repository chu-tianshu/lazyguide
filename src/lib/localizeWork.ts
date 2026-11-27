/**
 * Shows a work in the visitor's language. Catalog rows are written in one language (usually English);
 * where an open source has the work's title, artist or materials in the visitor's language, those come
 * from the `work_translations` table (see scripts/localize/). Nothing here translates text: a field with
 * no source in the language is left as the catalog has it. Room and level words come from the app's own
 * interface strings, which already exist in every language.
 */
import type { WorkSummary } from "@/data/catalog";
import { museumName } from "@/data/museumNames";
import { uiStrings, type LanguageCode } from "./i18n";

export interface Translation {
  title?: string;
  artist?: string;
  /** Replacement values for facts, keyed by the fact's (English) label. */
  facts?: Record<string, string>;
}

/** "Room 711, Denon Wing, Level 1" and "Room 012, Museo del Prado" in the visitor's words. */
function localizeLocation(value: string, museumId: string, language: LanguageCode): string {
  const x = uiStrings[language].explorer;
  const louvre = value.match(/^Room (\S+), (\w+) Wing, Level (-?\d+)$/);
  if (louvre) {
    const level = x.levels[Number(louvre[3])];
    return [x.room(louvre[1]), x.wingSuffix(louvre[2]), level ?? louvre[3]].join(", ");
  }
  const prado = value.match(/^Room (\S+), Museo del Prado$/);
  if (prado) return `${x.room(prado[1])}, ${museumName("prado", language) ?? "Museo del Prado"}`;
  return value;
}

/** `catalogLanguage` is the language the row is written in: only English rows are translated. */
export function localizeWork<T extends WorkSummary>(
  work: T,
  museumId: string,
  catalogLanguage: LanguageCode,
  language: LanguageCode,
  translation?: Translation,
): T {
  if (catalogLanguage !== "en" || language === "en") return work;
  const facts = work.facts.map((f) => {
    if (f.label === "Location") return { ...f, value: localizeLocation(f.value, museumId, language) };
    const v = translation?.facts?.[f.label];
    return v ? { ...f, value: v } : f;
  });
  return { ...work, title: translation?.title ?? work.title, artist: translation?.artist ?? work.artist, facts };
}
