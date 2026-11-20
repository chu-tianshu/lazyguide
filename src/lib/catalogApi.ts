/**
 * Reads the museum catalog from Postgres (tables in supabase/catalog.sql).
 * The tables are public-read under row-level security, so the anon key is
 * enough, in the browser and in API routes alike. Guides are large, so the
 * collection list leaves them out and fetchWork loads one when it is opened.
 */
import type { LanguageCode } from "@/lib/i18n";
import type { Catalog, Fact, Guide, PaintingImage, Work, WorkSummary } from "@/data/catalog";
import type { Museum } from "@/data/museums";
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
