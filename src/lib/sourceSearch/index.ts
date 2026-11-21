/**
 * "Search online" for a title the cached catalog does not have: asks the museum's sources
 * (table museum_sources) in priority order and returns the first title matches, shaped as catalog works.
 */
import type { Fact, SingleGuide } from "@/data/catalog";
import type { LanguageCode } from "@/lib/i18n";
import { searchAic } from "./aic";
import { searchCleveland } from "./cleveland";
import type { Adapter, FactKey, Found, MuseumSource, SourceKind } from "./types";
import { pickTitleMatches } from "./util";
import { searchWikidata } from "./wikidata";

const adapters: Record<SourceKind, Adapter> = {
  cleveland: searchCleveland,
  aic: searchAic,
  wikidata: searchWikidata,
};

/** At most this many works are stored per search, so a broad phrase cannot flood a catalog. */
export const MAX_STORED = 3;

const factLabels: Record<LanguageCode, Record<FactKey, string>> = {
  en: { date: "Date", medium: "Medium", dimensions: "Size", culture: "Culture", type: "Type", accession: "Accession" },
  zh: { date: "年代", medium: "材质", dimensions: "尺寸", culture: "文化", type: "类别", accession: "编号" },
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
export function toWorkRow(f: Found, source: MuseumSource, museumId: string, language: LanguageCode) {
  const facts: Fact[] = f.facts.map((x) => ({ label: factLabels[language][x.key], value: x.value }));
  const guide: SingleGuide & { credit?: string } = f.text
    ? { text: f.text, credit: f.textCredit }
    : { text: "Audio guide unavailable.", unavailable: true };
  return {
    museum_id: museumId,
    language,
    id: `x-${source.kind}-${f.sourceId}`,
    title: f.title,
    category: null,
    subtitle: f.subtitle ?? null,
    artist: f.artist ?? null,
    facts,
    object_url: f.objectUrl ?? null,
    image: f.image ?? null,
    guide,
  };
}
