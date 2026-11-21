import type { WorkSummary } from "@/data/catalog";
import { isLanguageCode } from "@/lib/i18n";
import { searchSources, toWorkRow } from "@/lib/sourceSearch";
import type { MuseumSource } from "@/lib/sourceSearch/types";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

const MAX_QUERY_CHARS = 100;

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

/**
 * POST { museumId, language, query }: looks the title up in the museum's sources, stores any
 * matches in the catalog and returns them. Needs a signed-in user (guests count) so that
 * anonymous traffic cannot write to the database or spend the sources' rate limits.
 * Responds { status: "found", works, source } | { status: "none", source names } | { status: "unavailable" }.
 */
export async function POST(request: Request) {
  const admin = supabaseAdmin();
  if (!admin) return json({ error: "not-configured" }, 503);

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "unauthorized" }, 401);
  const { data: auth } = await admin.auth.getUser(token);
  if (!auth.user) return json({ error: "unauthorized" }, 401);

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return json({ error: "invalid" }, 400);
  }
  const b = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const query = typeof b.query === "string" ? b.query.trim() : "";
  if (
    typeof b.museumId !== "string" ||
    !isLanguageCode(b.language) ||
    query.length < 2 ||
    query.length > MAX_QUERY_CHARS
  ) {
    return json({ error: "invalid" }, 400);
  }
  const { museumId, language } = b;

  const [catalog, sourceRows] = await Promise.all([
    admin.from("catalogs").select("museum_id").eq("museum_id", museumId).eq("language", language).maybeSingle(),
    admin.from("museum_sources").select("kind, name, url, priority, config").eq("museum_id", museumId),
  ]);
  if (catalog.error || sourceRows.error) return json({ error: "failed" }, 502);
  if (!catalog.data) return json({ error: "unknown-museum" }, 404);
  const sources = sourceRows.data as MuseumSource[];
  if (sources.length === 0) return json({ status: "no-source" });

  const result = await searchSources(sources, query, language);
  if (result.found.length === 0) {
    // Only claim "no match" if at least one source actually answered.
    return json(result.answered > 0 ? { status: "none" } : { status: "unavailable" });
  }
  const source = result.source!;

  const rows = result.found.map((f) => toWorkRow(f, source, museumId, language));
  const existing = await admin
    .from("works")
    .select("id")
    .eq("museum_id", museumId)
    .eq("language", language)
    .in("id", rows.map((r) => r.id));
  if (existing.error) return json({ error: "failed" }, 502);
  const known = new Set(existing.data.map((r) => r.id as string));

  const fresh = rows.filter((r) => !known.has(r.id));
  if (fresh.length > 0) {
    const last = await admin
      .from("works")
      .select("position")
      .eq("museum_id", museumId)
      .eq("language", language)
      .order("position", { ascending: false })
      .limit(1);
    if (last.error) return json({ error: "failed" }, 502);
    const start = (last.data[0]?.position ?? -1) + 1;
    // ignoreDuplicates: a concurrent search for the same title may have stored it first.
    const { error } = await admin
      .from("works")
      .upsert(
        fresh.map((r, i) => ({ ...r, position: start + i })),
        { onConflict: "museum_id,language,id", ignoreDuplicates: true },
      );
    if (error) {
      console.error("storing found works failed:", error.code);
      return json({ error: "failed" }, 502);
    }
  }

  const works: WorkSummary[] = rows.map((r) => ({
    id: r.id,
    title: r.title,
    subtitle: r.subtitle ?? undefined,
    artist: r.artist ?? undefined,
    facts: r.facts,
    objectUrl: r.object_url ?? undefined,
    image: r.image ?? undefined,
  }));
  return json({ status: "found", works, source: source.name });
}
