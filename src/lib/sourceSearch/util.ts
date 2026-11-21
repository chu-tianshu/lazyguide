import { normalizeText } from "@/data/catalog";
import type { Found } from "./types";

export const USER_AGENT = "LazyGuide/0.1 (https://github.com/chu-tianshu/lazyguide)";
const TIMEOUT_MS = 8_000;

export async function getJson<T>(url: string, headers: Record<string, string> = {}): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Accept: "application/json", ...headers },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`${new URL(url).host} answered ${res.status}`);
  return (await res.json()) as T;
}

const ENTITIES: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };

/** Plain text from the HTML snippets museums put in description fields. */
export function stripHtml(html: string): string {
  return html
    .replace(/<\/p>|<br\s*\/?>/gi, "\n\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === "#") {
        const code = e[1].toLowerCase() === "x" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : m;
      }
      return ENTITIES[e.toLowerCase()] ?? m;
    })
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Keeps a text to whole paragraphs under a limit, so the speech player does not stop mid-sentence. */
export function clipText(text: string, max = 3_500): string {
  if (text.length <= max) return text;
  const paragraphs = text.split(/\n{2,}/);
  let out = "";
  for (const p of paragraphs) {
    if (out && out.length + p.length > max) break;
    out += (out ? "\n\n" : "") + p;
  }
  return out.length > max ? out.slice(0, max).replace(/\s+\S*$/, "") + "…" : out;
}

/** 0 = the title is the query, 1 = starts with it, 2 = contains it, undefined = no title match. */
export function titleRank(title: string, query: string): number | undefined {
  const t = normalizeText(title);
  const q = normalizeText(query);
  if (!q || !t.includes(q)) return undefined;
  return t === q ? 0 : t.startsWith(q) ? 1 : 2;
}

/** Keeps the works whose title contains the phrase, best match first, at most `limit`. */
export function pickTitleMatches(found: Found[], query: string, limit: number): Found[] {
  const seen = new Set<string>();
  return found
    .map((f) => {
      // The title, or the other-language name the phrase matched. Ties go to the shorter matching name,
      // which is the one closest to what was typed.
      const field = titleRank(f.title, query) !== undefined ? f.title : f.subtitle;
      return { f, rank: field ? titleRank(field, query) : undefined, len: field?.length ?? 0 };
    })
    .filter((x): x is { f: Found; rank: number; len: number } => {
      if (x.rank === undefined || seen.has(x.f.sourceId)) return false;
      seen.add(x.f.sourceId);
      return true;
    })
    .sort((a, b) => a.rank - b.rank || a.len - b.len)
    .slice(0, limit)
    .map((x) => x.f);
}
