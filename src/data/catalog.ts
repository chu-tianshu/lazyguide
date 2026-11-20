import type { LanguageCode } from "@/lib/i18n";

/** Preview image: a file under public/images, with where it came from. */
export interface PaintingImage {
  src: string;
  sourceUrl: string; // Wikimedia Commons file page, or the museum's own page
  license: string;
  author?: string; // photographer credit, shown in the caption (required by CC BY-SA)
  sourceLabel?: string; // name of the source site, when it is not Wikimedia Commons
}

export interface Fact {
  label: string;
  value: string;
}

/** Guides written for this app: a short and a long version plus an expansion. */
export interface TieredGuide {
  /** Standalone concise guide (about 1 minute). */
  short: string;
  /** Additional layer of looking and context (about 1 minute). */
  expansion: string;
  /** Standalone detailed guide (about 2–3 minutes). */
  long: string;
}

/** A guide that is the museum's own text, used as supplied: one text, no depths. */
export interface SingleGuide {
  text: string;
  /** Placeholder for a work with no audio guide yet: the page shows a notice instead of a player. */
  unavailable?: boolean;
}

export type Guide = TieredGuide | SingleGuide;

/** What the collection list needs. Guides are loaded separately, when a work is opened. */
export interface WorkSummary {
  id: string;
  title: string;
  category?: string; // one of the catalog's categories
  subtitle?: string; // e.g. the original-language name
  artist?: string;
  facts: Fact[]; // labelled in the guide's language
  objectUrl?: string; // official museum page
  image?: PaintingImage;
}

export interface Work extends WorkSummary {
  guide: Guide;
}

export interface Catalog {
  museumId: string;
  language: LanguageCode;
  museumName: string;
  museumLocation: string;
  /** Credit line shown with a museum's own guide texts, when there is one. */
  textCredit?: string;
  /** Category names in display order. */
  categories: string[];
  works: WorkSummary[];
}

export function searchWorks<T extends WorkSummary>(works: T[], query: string): T[] {
  const q = query.trim().toLowerCase();
  if (!q) return works;
  return works.filter((w) =>
    [w.title, w.subtitle, w.artist].some((field) => field?.toLowerCase().includes(q)),
  );
}
