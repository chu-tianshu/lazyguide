/**
 * High Museum of Art collection, through the museum's own website: https://high.org/collection/.
 * The site is WordPress and publishes its whole collection (about 17,000 objects, synced from the
 * museum's collection database) at /wp-json/wp/v2/collection. Its robots.txt allows this.
 *
 * Only public fields are used. The records also carry internal curatorial notes (acquisition
 * rationales, staff comments in `curatorialRemarks`, `notes`); those are never read.
 */
import type { LanguageCode } from "@/lib/i18n";
import type { Adapter, Found } from "./types";
import { getJson, getJsonResponse, stripHtml, clipText, pickTitleMatches } from "./util";

interface HighRecord {
  title: { rendered: string };
  link: string;
  acf: Record<string, unknown>;
}

interface Maker {
  DisplayName?: string;
  DisplayDate?: string;
  EndDate?: number;
  Role?: string;
}

const str = (v: unknown): string => (typeof v === "string" || typeof v === "number" ? String(v).trim() : "");
const text = (v: unknown): string => stripHtml(str(v));
/** For single-line facts: the records sometimes carry line breaks. */
const line = (v: unknown): string => text(v).replace(/\s*\n+\s*/g, "; ");

function makers(acf: Record<string, unknown>): Maker[] {
  try {
    const parsed: unknown = JSON.parse(str(acf.collectionArtists) || "[]");
    return Array.isArray(parsed) ? (parsed as Maker[]) : [];
  } catch {
    return [];
  }
}

function artistLine(acf: Record<string, unknown>, list: Maker[]): string | undefined {
  const first = list.find((m) => m.DisplayName && (!m.Role || /artist|maker/i.test(m.Role))) ?? list[0];
  if (first?.DisplayName) {
    return first.DisplayDate ? `${first.DisplayName} (${first.DisplayDate})` : first.DisplayName;
  }
  return text(acf.displayName) || undefined;
}

/**
 * The records carry no usable rights field, so an image is shown only when it is clearly public
 * domain: made before 1931 (public domain in the US) by artists who all died before 1956 (life + 70).
 */
function clearlyPublicDomain(acf: Record<string, unknown>, list: Maker[]): boolean {
  const made = Number(acf.dateEnd);
  if (!Number.isFinite(made) || made <= 0 || made >= 1931) return false;
  return list.length > 0 && list.every((m) => typeof m.EndDate === "number" && m.EndDate > 0 && m.EndDate < 1956);
}

function location(raw: string, language: LanguageCode): string | undefined {
  if (!raw) return undefined;
  if (/not on view/i.test(raw)) return language === "zh" ? "未展出" : "Not on view";
  return raw.replace(/^On View\s*-\s*/i, "") || undefined;
}

/** Result pages read for one search (100 hits each). The site's search is fuzzy and matches body text. */
const MAX_PAGES = 8;
const MAX_MATCHES = 3;

export const searchHigh: Adapter = async ({ query, language, source }) => {
  const api = `${source.url}/wp-json/wp/v2/collection?search=${encodeURIComponent(query)}&per_page=100`;

  // 1. Titles only, over every result page: a single word can match hundreds of records through their
  //    text, with the records whose title has the word far down the list.
  const first = await getJsonResponse<{ id: number; title: { rendered: string } }[]>(`${api}&_fields=id,title`);
  const pages = Math.min(Number(first.headers.get("x-wp-totalpages")) || 1, MAX_PAGES);
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, i) =>
      getJson<typeof first.data>(`${api}&page=${i + 2}&_fields=id,title`).catch(() => []),
    ),
  );
  const stubs: Found[] = [first.data, ...rest].flat().map((r) => ({
    sourceId: String(r.id),
    title: text(r.title.rendered),
    facts: [],
  }));
  const best = pickTitleMatches(stubs, query, MAX_MATCHES);
  if (best.length === 0) return [];

  // 2. Full records for the best title matches only.
  const records = await getJson<(HighRecord & { id: number })[]>(
    `${source.url}/wp-json/wp/v2/collection?include=${best.map((b) => b.sourceId).join(",")}` +
      `&per_page=${best.length}&_fields=id,title,link,acf`,
  );

  return records.map((r): Found => {
    const a = r.acf;
    const list = makers(a);
    const facts: Found["facts"] = [];
    if (str(a.dated)) facts.push({ key: "date", value: line(a.dated) });
    const medium = str(a.medium) || str(a.objectMedium);
    if (medium) facts.push({ key: "medium", value: line(medium) });
    if (str(a.dimensions)) facts.push({ key: "dimensions", value: line(a.dimensions) });
    if (str(a.culture)) facts.push({ key: "culture", value: line(a.culture) });
    if (str(a.classification)) facts.push({ key: "type", value: line(a.classification) });
    if (str(a.objectNumber)) facts.push({ key: "accession", value: str(a.objectNumber) });
    const where = location(str(a.locationDescription), language);
    if (where) facts.push({ key: "location", value: where });
    const credit = str(a.creditLine) || str(a.objectCreditLine);
    if (credit) facts.push({ key: "credit", value: line(credit) });

    // `chat` is the museum's public gallery text for the work.
    const gallery = text(a.chat);
    const image = str(a.webImage) || str(a.dlcsImage1);
    return {
      sourceId: String(r.id),
      title: text(r.title.rendered),
      category: line(a.classification) || undefined,
      artist: artistLine(a, list),
      facts,
      objectUrl: r.link,
      image:
        a.hasImage && image && clearlyPublicDomain(a, list)
          ? { src: image, sourceUrl: r.link, license: "Public domain", sourceLabel: "High Museum of Art" }
          : undefined,
      text: gallery ? clipText(gallery) : undefined,
      textCredit: gallery ? "Text: High Museum of Art." : undefined,
    };
  });
};
