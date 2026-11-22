import type { PaintingImage } from "@/data/catalog";
import type { LanguageCode } from "@/lib/i18n";

export type SourceKind = "cleveland" | "aic" | "high" | "wikidata";

/** A row of museum_sources (supabase/sources.sql). */
export interface MuseumSource {
  kind: SourceKind;
  name: string;
  url: string;
  priority: number;
  config: Record<string, unknown>;
}

export type FactKey = "date" | "medium" | "dimensions" | "culture" | "type" | "accession" | "location" | "credit";

/** One work a source returned, before it is shaped into a catalog row. */
export interface Found {
  /** The source's own id for the work; makes the catalog id stable across searches. */
  sourceId: string;
  title: string;
  subtitle?: string;
  artist?: string;
  facts: { key: FactKey; value: string }[];
  /** The museum source's own department / classification for the work; undefined when the source has none. */
  category?: string;
  /** The museum's own page for the work. */
  objectUrl?: string;
  /** Only when the licence allows reuse (public domain / CC0). */
  image?: PaintingImage;
  /** The museum's (or, failing that, the encyclopedia's) text about the work. */
  text?: string;
  /** Who wrote `text`, with its licence. */
  textCredit?: string;
}

export interface SearchContext {
  query: string;
  language: LanguageCode;
  source: MuseumSource;
}

export type Adapter = (ctx: SearchContext) => Promise<Found[]>;
