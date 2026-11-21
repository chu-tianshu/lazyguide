/**
 * Wikidata items held in a museum's collection (P195), for museums with no open API of their own.
 * Metadata comes from Wikidata (CC0), the text from the item's Wikipedia article (CC BY-SA), and the
 * image from Wikimedia Commons, only when it is public domain / CC0.
 */
import type { LanguageCode } from "@/lib/i18n";
import type { Adapter, FactKey, Found } from "./types";
import { louvreRecord } from "./louvre";
import { getJson, stripHtml, clipText, pickTitleMatches, titleRank } from "./util";

const API = "https://www.wikidata.org/w/api.php";
const MAX_MATCHES = 3;

type Claims = Record<string, { mainsnak: { datavalue?: { value: unknown } }; rank?: string }[]>;
interface Entity {
  id: string;
  labels?: Record<string, { value: string }>;
  claims?: Claims;
  sitelinks?: Record<string, { title: string }>;
}

function values(e: Entity, prop: string): unknown[] {
  return (e.claims?.[prop] ?? [])
    .filter((c) => c.rank !== "deprecated")
    .flatMap((c) => (c.mainsnak.datavalue ? [c.mainsnak.datavalue.value] : []));
}
const itemIds = (e: Entity, prop: string) =>
  values(e, prop).flatMap((v) => (typeof v === "object" && v && "id" in v ? [(v as { id: string }).id] : []));
const strings = (e: Entity, prop: string) => values(e, prop).filter((v): v is string => typeof v === "string");

function ordinal(n: number): string {
  const teen = Math.floor(n / 10) % 10 === 1;
  const last = n % 10;
  return n + (teen ? "th" : last === 1 ? "st" : last === 2 ? "nd" : last === 3 ? "rd" : "th");
}

function formatTime(v: unknown): string | undefined {
  const t = v as { time?: string; precision?: number } | undefined;
  const m = t?.time?.match(/^([+-])(\d+)-/);
  if (!m || !t?.precision) return undefined;
  const year = Number(m[2]) * (m[1] === "-" ? -1 : 1);
  const bce = (n: number) => (n < 0 ? `${-n} BCE` : String(n));
  if (t.precision >= 9) return bce(year);
  if (t.precision === 8) return `${Math.abs(Math.trunc(year / 10) * 10)}s${year < 0 ? " BCE" : ""}`;
  if (t.precision === 7) return `${ordinal(Math.ceil(Math.abs(year) / 100))} century${year < 0 ? " BCE" : ""}`;
  return bce(year);
}

const TO_CM: Record<string, number> = { Q174728: 1, Q174789: 0.1, Q11573: 100 };
function dimension(e: Entity, prop: string): number | undefined {
  const v = values(e, prop)[0] as { amount?: string; unit?: string } | undefined;
  const factor = TO_CM[v?.unit?.split("/").pop() ?? ""];
  if (!v?.amount || !factor) return undefined;
  return Math.round(Number(v.amount) * factor * 10) / 10;
}

interface WikidataConfig {
  /** Wikidata items of the museum and its departments (P195, "collection"). */
  collections: string[];
  /** A property only this museum's objects have (e.g. its collection-database id): one query for everything. */
  idProperty?: string;
  /** Language of the museum's own titles, shown as the original name next to the translated title. */
  native?: string;
  /** Adds the museum's own record to each result. */
  enrich?: "louvre";
}

async function searchOne(filter: string, query: string): Promise<string[]> {
  const term = `${filter} ${query}`;
  const url = `${API}?action=query&list=search&srsearch=${encodeURIComponent(term)}&srlimit=20&format=json`;
  const res = await getJson<{ query: { search: { title: string }[] } }>(url);
  return res.query.search.map((s) => s.title);
}

/** Wikidata ids of the museum's items whose text matches the query. */
async function searchIds(config: WikidataConfig, query: string): Promise<string[]> {
  // Wikidata's search takes one filter at a time, so a museum with no id property needs one query per collection.
  const filters = config.idProperty
    ? [`haswbstatement:${config.idProperty}`]
    : config.collections.map((q) => `haswbstatement:P195=${q}`);
  const settled = await Promise.allSettled(filters.map((f) => searchOne(f, query)));
  const ok = settled.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  if (ok.length === 0) throw new Error("Wikidata search failed");
  return [...new Set(ok.flat())];
}

async function getEntities(ids: string[], props: string, languages: string[]): Promise<Record<string, Entity>> {
  const out: Record<string, Entity> = {};
  for (let i = 0; i < ids.length; i += 50) {
    const url =
      `${API}?action=wbgetentities&ids=${ids.slice(i, i + 50).join("|")}&props=${props}` +
      `&languages=${languages.join("|")}&sitefilter=enwiki|zhwiki&format=json`;
    const res = await getJson<{ entities?: Record<string, Entity> }>(url);
    Object.assign(out, res.entities ?? {});
  }
  return out;
}

async function wikipediaIntro(wiki: string, title: string): Promise<string | undefined> {
  const url =
    `https://${wiki}.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1` +
    `&redirects=1&titles=${encodeURIComponent(title)}&format=json`;
  const res = await getJson<{ query?: { pages?: Record<string, { extract?: string }> } }>(url);
  const extract = Object.values(res.query?.pages ?? {})[0]?.extract?.trim();
  return extract ? clipText(extract) : undefined;
}

const FREE_LICENSE = /^(public domain|pd\b|cc0)/i;

async function commonsImage(file: string): Promise<Found["image"]> {
  const url =
    `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent("File:" + file)}` +
    `&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=900&format=json`;
  const res = await getJson<{
    query?: {
      pages?: Record<
        string,
        { imageinfo?: { thumburl?: string; descriptionurl?: string; extmetadata?: Record<string, { value: string }> }[] }
      >;
    };
  }>(url);
  const info = Object.values(res.query?.pages ?? {})[0]?.imageinfo?.[0];
  const rawLicense = info?.extmetadata?.LicenseShortName?.value;
  const license = rawLicense ? stripHtml(rawLicense) : "";
  if (!info?.thumburl || !FREE_LICENSE.test(license)) return undefined;
  return { src: info.thumburl, sourceUrl: info.descriptionurl ?? "https://commons.wikimedia.org", license };
}

export const searchWikidata: Adapter = async ({ query, language, source }) => {
  const config = source.config as unknown as WikidataConfig;
  if (!config.idProperty && !(Array.isArray(config.collections) && config.collections.length > 0)) return [];
  const langs: string[] = language === "zh" ? ["zh", "en"] : ["en"];
  // Titles can exist in the museum's own language only, so those labels are fetched and searched too.
  const fetched = [...new Set([...langs, "mul", config.native ?? "fr", "fr", "es", "it", "de", "nl"])];
  const labelOf = (e: Entity | undefined) => {
    for (const l of [...langs, "mul", config.native ?? "", ...fetched]) {
      const v = l && e?.labels?.[l]?.value;
      if (v) return v;
    }
    return undefined;
  };

  const ids = await searchIds(config, query);
  if (ids.length === 0) return [];
  const entities = await getEntities(ids, "labels|claims|sitelinks", fetched);

  // The full-text search is loose; keep only items with a title (in any language) containing the phrase.
  const byId = new Map<string, Entity>();
  const stubs: Found[] = [];
  const matchedLabel = new Map<string, string>();
  for (const id of ids) {
    const e = entities[id];
    const title = labelOf(e);
    if (!e || !title) continue;
    byId.set(id, e);
    const best = Object.values(e.labels ?? {})
      .map((l) => ({ v: l.value, rank: titleRank(l.value, query) }))
      .filter((x): x is { v: string; rank: number } => x.rank !== undefined)
      .sort((x, y) => x.rank - y.rank)[0];
    if (best && best.v !== title) matchedLabel.set(id, best.v);
    stubs.push({ sourceId: id, title, subtitle: best && best.v !== title ? best.v : undefined, facts: [] });
  }
  // Among equally good title matches, the well-documented items (image, Wikipedia article) go first;
  // Wikidata also holds many bare records for copies and studies with the same title.
  const richness = (id: string) => {
    const e = byId.get(id)!;
    return Object.keys(e.sitelinks ?? {}).length + (values(e, "P18").length ? 1 : 0);
  };
  stubs.sort((a, b) => richness(b.sourceId) - richness(a.sourceId));
  const chosen = pickTitleMatches(stubs, query, MAX_MATCHES).map((f) => byId.get(f.sourceId)!);
  if (chosen.length === 0) return [];

  // Resolve the linked items (creator, material, type) to names in one go.
  const linked = [...new Set(chosen.flatMap((e) => ["P170", "P186", "P31"].flatMap((p) => itemIds(e, p))))];
  const names = linked.length ? await getEntities(linked, "labels", fetched) : {};
  const named = (e: Entity, prop: string, max = 3) =>
    itemIds(e, prop)
      .slice(0, max)
      .flatMap((id) => labelOf(names[id]) ?? [])
      .join(", ") || undefined;

  const wikis = langs.map((l) => `${l}wiki`);
  const all = await Promise.all(
    chosen.map(async (e): Promise<Found> => {
      const title = labelOf(e)!;
      const facts: { key: FactKey; value: string }[] = [];
      const date = formatTime(values(e, "P571")[0]);
      if (date) facts.push({ key: "date", value: date });
      const material = named(e, "P186");
      if (material) facts.push({ key: "medium", value: material });
      const h = dimension(e, "P2048");
      const w = dimension(e, "P2049");
      if (h && w) facts.push({ key: "dimensions", value: `${h} × ${w} cm` });
      const type = named(e, "P31", 1);
      if (type) facts.push({ key: "type", value: type });
      const accession = strings(e, "P217")[0];
      if (accession) facts.push({ key: "accession", value: accession });

      const file = strings(e, "P18")[0];
      const wikiKey = wikis.find((k) => e.sitelinks?.[k]);
      const wiki = wikiKey?.replace(/wiki$/, "");
      const articleTitle = wikiKey ? e.sitelinks![wikiKey].title : undefined;
      const arkId = config.idProperty ? strings(e, config.idProperty)[0] : undefined;
      const [image, text, official] = await Promise.all([
        file ? commonsImage(file).catch(() => undefined) : undefined,
        wiki && articleTitle ? wikipediaIntro(wiki, articleTitle).catch(() => undefined) : undefined,
        config.enrich === "louvre" && arkId ? louvreRecord(arkId, language) : undefined,
      ]);
      if (official?.location) facts.push({ key: "location", value: official.location });

      // The museum's own name for the work: the label the phrase matched, else the native-language label.
      const native = config.native ? e.labels?.[config.native]?.value : undefined;
      const subtitle = [matchedLabel.get(e.id), native].find((v) => v && v !== title);
      return {
        sourceId: e.id,
        title,
        subtitle,
        artist: named(e, "P170"),
        facts,
        objectUrl: official?.url ?? strings(e, "P856")[0],
        image: image && { ...image, sourceLabel: "Wikimedia Commons" },
        text,
        textCredit: text ? `Text: Wikipedia, “${articleTitle}” (CC BY-SA 4.0).` : undefined,
      };
    }),
  );
  // A bare record (no image, no text) that repeats an earlier result's title adds nothing.
  const seen = new Set<string>();
  return all.filter((f) => {
    const bare = !f.image && !f.text;
    const dup = seen.has(f.title);
    seen.add(f.title);
    return !(bare && dup);
  });
};
