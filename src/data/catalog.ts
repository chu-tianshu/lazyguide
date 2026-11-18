import type { LanguageCode } from "@/lib/i18n";
import { languages } from "./languages";
import { paintingImages, type PaintingImage } from "./paintingImages";
import clevelandEn from "./guides/cleveland/en.json";
import highEn from "./guides/high-atlanta/en.json";
import henanEn from "./guides/henan/en.json";
import henanZh from "./guides/henan/zh.json";

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
}

export type Guide = TieredGuide | SingleGuide;

export interface Work {
  id: string;
  title: string;
  category?: string; // one of the catalog's categories
  subtitle?: string; // e.g. the original-language name
  artist?: string;
  facts: Fact[]; // labelled in the guide's language
  objectUrl?: string; // official museum page
  image?: PaintingImage; // public-domain preview, when available
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
  works: Work[];
}

interface RawWork {
  id: string;
  title: string;
  category?: string;
  subtitle?: string;
  artist?: string;
  facts: Fact[];
  objectUrl?: string;
  image?: PaintingImage;
  listed?: boolean;
  guide: Guide;
}

interface RawFile {
  museum: { id: string; language: string; name: string; location: string; textCredit?: string };
  categories: string[];
  works: RawWork[];
}

/**
 * One cleaned JSON file per museum and language, in src/data/guides/<museum>/<lang>.json.
 * To add a language or museum, add the file and register it here.
 */
const files: Record<string, Partial<Record<LanguageCode, RawFile>>> = {
  "high-atlanta": { en: highEn },
  henan: { en: henanEn, zh: henanZh },
  cleveland: { en: clevelandEn },
};

const cache = new Map<string, Catalog>();

/** Languages a museum has guides for, in display order. */
export function availableLanguages(museumId: string): LanguageCode[] {
  const offered = files[museumId] ?? {};
  return languages.map((l) => l.code).filter((code) => offered[code]);
}

export function getCatalog(museumId: string, language: LanguageCode): Catalog | undefined {
  const key = `${museumId}/${language}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const file = files[museumId]?.[language];
  if (!file) return undefined;

  const catalog: Catalog = {
    museumId,
    language,
    museumName: file.museum.name,
    museumLocation: file.museum.location,
    textCredit: file.museum.textCredit,
    categories: file.categories,
    works: file.works
      .filter((w) => w.listed !== false)
      .map((w) => ({
        id: w.id,
        title: w.title,
        category: w.category,
        subtitle: w.subtitle,
        artist: w.artist,
        facts: w.facts,
        objectUrl: w.objectUrl,
        image: w.image ?? paintingImages[w.id],
        guide: w.guide,
      })),
  };
  cache.set(key, catalog);
  return catalog;
}

export function getWork(museumId: string, language: LanguageCode, workId: string): Work | undefined {
  return getCatalog(museumId, language)?.works.find((w) => w.id === workId);
}

export function searchWorks(works: Work[], query: string): Work[] {
  const q = query.trim().toLowerCase();
  if (!q) return works;
  return works.filter((w) =>
    [w.title, w.subtitle, w.artist].some((field) => field?.toLowerCase().includes(q)),
  );
}
