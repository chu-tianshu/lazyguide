/**
 * "Search online" for a title the cached catalog does not have: asks the museum's sources
 * (table museum_sources) in priority order and returns the first title matches, shaped as catalog works.
 */
import type { Fact, SingleGuide } from "@/data/catalog";
import type { LanguageCode } from "@/lib/i18n";
import { searchAic } from "./aic";
import { searchCleveland } from "./cleveland";
import { searchHigh } from "./high";
import type { Adapter, FactKey, Found, MuseumSource, SourceKind } from "./types";
import { pickTitleMatches } from "./util";
import { searchWikidata } from "./wikidata";

const adapters: Record<SourceKind, Adapter> = {
  cleveland: searchCleveland,
  aic: searchAic,
  high: searchHigh,
  wikidata: searchWikidata,
};

/** At most this many works are stored per search, so a broad phrase cannot flood a catalog. */
export const MAX_STORED = 3;

const factLabels: Record<LanguageCode, Record<FactKey, string>> = {
  en: { date: "Date", medium: "Medium", dimensions: "Size", culture: "Culture", type: "Type", accession: "Accession", location: "Location", credit: "Credit" },
  zh: { date: "年代", medium: "材质", dimensions: "尺寸", culture: "文化", type: "类别", accession: "编号", location: "位置", credit: "来源" },
  fr: { date: "Date", medium: "Technique", dimensions: "Dimensions", culture: "Culture", type: "Type", accession: "N° d’acquisition", location: "Emplacement", credit: "Crédit" },
  es: { date: "Fecha", medium: "Técnica", dimensions: "Dimensiones", culture: "Cultura", type: "Tipo", accession: "N.º de registro", location: "Ubicación", credit: "Crédito" },
};

export interface SourceResult {
  /** Matches from the first source that had any. */
  found: Found[];
  /** The source they came from. */
  source?: MuseumSource;
  /** Sources that failed (network, rate limit). When none answered, "no match" would be misleading. */
  failed: number;
  /** Sources that answered with no title match. */
  answered: number;
}

export async function searchSources(
  sources: MuseumSource[],
  query: string,
  language: LanguageCode,
): Promise<SourceResult> {
  const ordered = [...sources].sort((a, b) => a.priority - b.priority);
  let failed = 0;
  let answered = 0;
  for (const source of ordered) {
    try {
      const results = await adapters[source.kind]({ query, language, source });
      const matches = pickTitleMatches(results, query, MAX_STORED);
      answered++;
      if (matches.length > 0) return { found: matches, source, failed, answered };
    } catch (err) {
      failed++;
      console.error(`source ${source.kind} failed:`, err instanceof Error ? err.message : "unknown");
    }
  }
  return { found: [], failed, answered };
}

/** The fields of a `works` row for a found work (position is set by the caller). */
export function toWorkRow(
  f: Found,
  source: MuseumSource,
  museumId: string,
  language: LanguageCode,
  category: string | null = null,
) {
  const facts: Fact[] = f.facts.map((x) => ({ label: factLabels[language][x.key], value: x.value }));
  const guide: SingleGuide & { credit?: string } = f.text
    ? { text: f.text, credit: f.textCredit }
    : { text: "Audio guide unavailable.", unavailable: true };
  return {
    museum_id: museumId,
    language,
    id: `x-${source.kind}-${f.sourceId}`,
    title: f.title,
    category,
    subtitle: f.subtitle ?? null,
    artist: f.artist ?? null,
    facts,
    object_url: f.objectUrl ?? null,
    image: f.image ?? null,
    guide,
  };
}

/**
 * Files a source's category under one of the museum's existing categories (same name, ignoring case and
 * punctuation, or one name containing the other), or returns the source's own name as a new category.
 * Null when the source gave none, so the work stays uncategorized.
 */
export function resolveCategory(sourceCategory: string | undefined, existing: string[]): string | null {
  const raw = sourceCategory?.trim();
  if (!raw) return null;
  const norm = (s: string) => s.toLowerCase().replace(/&/g, " and ").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
  const n = norm(raw);
  if (!n) return null;
  const exact = existing.find((c) => norm(c) === n);
  if (exact) return exact;
  const loose = existing.find((c) => {
    const m = norm(c);
    return m.length >= 4 && (m.includes(n) || n.includes(m));
  });
  return loose ?? raw;
}
