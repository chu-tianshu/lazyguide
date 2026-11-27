/**
 * Reads the museum catalog from Postgres (tables in supabase/catalog.sql).
 * The tables are public-read under row-level security, so the anon key is
 * enough, in the browser and in API routes alike. Guides are large, so the
 * collection list leaves them out and fetchWork loads one when it is opened.
 */
import type { LanguageCode } from "@/lib/i18n";
import type { Catalog, Fact, Guide, PaintingImage, Work, WorkSummary } from "@/data/catalog";
import type { Museum } from "@/data/museums";
import { museumLocation, museumName, placeName } from "@/data/museumNames";
import type { Translation } from "./localizeWork";
import { supabase } from "./supabaseClient";

function db() {
  if (!supabase) throw new Error("The catalog database is not configured.");
  return supabase;
}

const LIST_COLUMNS = "id, title, category, subtitle, artist, facts, object_url, image";

interface WorkRow {
  id: string;
  title: string;
  category: string | null;
  subtitle: string | null;
  artist: string | null;
  facts: Fact[];
  object_url: string | null;
  image: PaintingImage | null;
  guide?: Guide;
}

function toSummary(row: WorkRow): WorkSummary {
  return {
    id: row.id,
    title: row.title,
    category: row.category ?? undefined,
    subtitle: row.subtitle ?? undefined,
    artist: row.artist ?? undefined,
    facts: row.facts,
    objectUrl: row.object_url ?? undefined,
    image: row.image ?? undefined,
  };
}

export async function fetchMuseums(): Promise<Museum[]> {
  const { data, error } = await db()
    .from("museums")
    .select("id, name, subtitle, lat, lng, city, country, continent, icon")
    .order("sort_order");
  if (error) throw error;
  return data.map((m) => ({
    id: m.id,
    name: m.name,
    subtitle: m.subtitle,
    icon: m.icon,
    place: { lat: m.lat, lng: m.lng, city: m.city, country: m.country, continent: m.continent },
  }));
}

/** Museums with their names and locations in the given language (the database's English where there is no translation). */
export function localizeMuseums(museums: Museum[], language: LanguageCode): Museum[] {
  return museums.map((m) => ({
    ...m,
    name: museumName(m.id, language) ?? m.name,
    subtitle: museumLocation(m.id, language) ?? m.subtitle,
    place: {
      ...m.place,
      city: placeName(m.place.city, language),
      country: placeName(m.place.country, language),
      continent: placeName(m.place.continent, language),
    },
  }));
}

/** Languages a museum has guides for. */
export async function fetchLanguageCodes(museumId: string): Promise<LanguageCode[]> {
  const { data, error } = await db().from("catalogs").select("language").eq("museum_id", museumId);
  if (error) throw error;
  return data.map((r) => r.language as LanguageCode);
}

export async function fetchCatalog(museumId: string, language: LanguageCode): Promise<Catalog | undefined> {
  const [catalog, works] = await Promise.all([
    db()
      .from("catalogs")
      .select("museum_name, location, text_credit, categories")
      .eq("museum_id", museumId)
      .eq("language", language)
      .maybeSingle(),
    db()
      .from("works")
      .select(LIST_COLUMNS)
      .eq("museum_id", museumId)
      .eq("language", language)
      .order("position"),
  ]);
  if (catalog.error) throw catalog.error;
  if (works.error) throw works.error;
  if (!catalog.data) return undefined;
  return {
    museumId,
    language,
    museumName: catalog.data.museum_name,
    museumLocation: catalog.data.location,
    textCredit: catalog.data.text_credit ?? undefined,
    categories: catalog.data.categories,
    works: (works.data as WorkRow[]).map(toSummary),
  };
}

export async function fetchWork(
  museumId: string,
  language: LanguageCode,
  workId: string,
): Promise<Work | undefined> {
  const { data, error } = await db()
    .from("works")
    .select(`${LIST_COLUMNS}, guide`)
    .eq("museum_id", museumId)
    .eq("language", language)
    .eq("id", workId)
    .maybeSingle();
  if (error) throw error;
  if (!data) return undefined;
  const row = data as unknown as WorkRow;
  return { ...toSummary(row), guide: row.guide as Guide };
}

/** Names of the online sources a museum can be searched in (table museum_sources), best first. */
export async function fetchSourceNames(museumId: string): Promise<string[]> {
  const { data, error } = await db()
    .from("museum_sources")
    .select("name, priority")
    .eq("museum_id", museumId)
    .order("priority");
  if (error) throw error;
  return data.map((r) => r.name as string);
}

export type SourceSearch =
  | { status: "found"; works: WorkSummary[]; source: string }
  | { status: "none" | "unavailable" | "no-source" };

/**
 * Asks the server to look a title up in the museum's online sources. Matches are stored in the
 * catalog by the server, so they are there for the next visitor too.
 */
export async function searchSources(museumId: string, language: LanguageCode, query: string): Promise<SourceSearch> {
  const { data } = await db().auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Not signed in.");
  const res = await fetch("/api/search-source", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ museumId, language, query }),
  });
  if (!res.ok) throw new Error(`search failed (${res.status})`);
  return (await res.json()) as SourceSearch;
}

/**
 * Catalog facts for prompting, taken from the requested language if the museum has it, otherwise
 * from any language it does have. The model writes in the requested language either way.
 */
export async function fetchPromptSource(
  museumId: string,
  language: LanguageCode,
  workId: string,
): Promise<{ museumName: string; work: Work } | undefined> {
  const offered = await fetchLanguageCodes(museumId);
  const order = [language, ...offered.filter((l) => l !== language)];
  for (const lang of order) {
    const [museumName, work] = await Promise.all([fetchMuseumName(museumId, lang), fetchWork(museumId, lang, workId)]);
    if (museumName && work) return { museumName, work };
  }
  return undefined;
}

export async function fetchMuseumName(museumId: string, language: LanguageCode): Promise<string | undefined> {
  const { data, error } = await db()
    .from("catalogs")
    .select("museum_name")
    .eq("museum_id", museumId)
    .eq("language", language)
    .maybeSingle();
  if (error) throw error;
  return data?.museum_name;
}

/**
 * Titles, artists and material names that open sources (Wikidata, the Louvre's own records) have in the
 * visitor's language, keyed by work id. Only works with such a source are present. Paged, since a
 * museum can have more rows than one request returns.
 */
export async function fetchTranslations(museumId: string, language: LanguageCode): Promise<Record<string, Translation>> {
  const out: Record<string, Translation> = {};
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db()
      .from("work_translations")
      .select("work_id, title, artist, facts")
      .eq("museum_id", museumId)
      .eq("language", language)
      .order("work_id")
      .range(from, from + PAGE - 1);
    if (error) throw error;
    for (const r of data) {
      out[r.work_id] = { title: r.title ?? undefined, artist: r.artist ?? undefined, facts: r.facts ?? undefined };
    }
    if (data.length < PAGE) return out;
  }
}
