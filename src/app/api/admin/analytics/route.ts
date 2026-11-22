import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";

interface Daily { day: string; active_users: number; plays: number; replays: number; questions: number }
interface WorkStat {
  museum_id: string; work_id: string; views: number; viewers: number;
  plays: number; replays: number; completes: number; expands: number; questions: number;
}
interface UsageDaily { day: string; guide_generations: number; questions: number; tts_requests: number; audio_minutes: number }
interface UsageTotal {
  guide_generations: number; questions: number; tts_requests: number; audio_minutes: number;
  tts_chars: number; input_tokens: number; output_tokens: number;
}
interface Summary {
  total_users: number; dau: number; wau: number; mau: number;
  work_views: number; plays: number; replays: number; completes: number; questions: number;
}


/** Emails allowed to see usage data: ADMIN_EMAILS, comma separated. Verified by the Supabase session token. */
function allowedEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean);
}

export async function GET(request: Request) {
  const db = supabaseAdmin();
  if (!db) return Response.json({ error: "Supabase service role is not configured." }, { status: 503 });

  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return Response.json({ error: "Sign in required." }, { status: 401 });
  const { data: auth } = await db.auth.getUser(token);
  const email = auth.user?.email?.toLowerCase();
  if (!email || !allowedEmails().includes(email)) return Response.json({ error: "Not authorized." }, { status: 403 });

  const [summaryRes, dailyRes, worksRes, titlesRes, museumsRes, usageTotalRes, usageDailyRes] = await Promise.all([
    db.from("analytics_summary").select("*").single(),
    db.from("analytics_daily").select("*").order("day"),
    db.from("analytics_works").select("*"),
    db.from("works").select("museum_id, id, title").eq("language", "en"),
    db.from("catalogs").select("museum_id, museum_name").eq("language", "en"),
    db.from("analytics_usage_total").select("*").single(),
    db.from("analytics_usage_daily").select("*").order("day"),
  ]);
  const err = summaryRes.error ?? dailyRes.error ?? worksRes.error ?? usageTotalRes.error ?? usageDailyRes.error;
  if (err) {
    return Response.json({ error: `Query failed: ${err.message}. Has supabase/analytics.sql been run?` }, { status: 500 });
  }

  const s = summaryRes.data as Summary;
  const u = usageTotalRes.data as UsageTotal;
  const usageDaily = (usageDailyRes.data ?? []) as UsageDaily[];
  const daily = (dailyRes.data ?? []) as Daily[];
  const works = (worksRes.data ?? []) as WorkStat[];
  const titles = new Map((titlesRes.data ?? []).map((w) => [`${w.museum_id}/${w.id}`, w.title as string]));
  const museumNames = new Map((museumsRes.data ?? []).map((m) => [m.museum_id as string, m.museum_name as string]));
  const nameOf = (w: WorkStat) => titles.get(`${w.museum_id}/${w.work_id}`) ?? `${w.museum_id}/${w.work_id}`;

  const top = (f: (w: WorkStat) => number, n = 10) =>
    [...works].sort((a, b) => f(b) - f(a)).filter((w) => f(w) > 0).slice(0, n)
      .map((w) => ({ label: nameOf(w), value: f(w), note: museumNames.get(w.museum_id) }));

  const byMuseum = new Map<string, number>();
  for (const w of works) byMuseum.set(w.museum_id, (byMuseum.get(w.museum_id) ?? 0) + w.views);
  const museumRows = [...byMuseum].sort((a, b) => b[1] - a[1]).map(([id, value]) => ({ label: museumNames.get(id) ?? id, value }));

  const completion = works
    .filter((w) => w.plays >= 3)
    .map((w) => ({ label: nameOf(w), value: Math.round((w.completes / (w.plays + w.replays)) * 100), note: `${w.completes} completes` }))
    .sort((a, b) => b.value - a.value).slice(0, 10);

  return Response.json({
    summary: s,
    usage: u,
    usageDaily: usageDaily.map((d) => ({ label: d.day, audioMinutes: Math.round(Number(d.audio_minutes) * 10) / 10, guides: d.guide_generations })),
    daily: daily.map((d) => ({ label: d.day, value: d.active_users })),
    views: top((w) => w.views),
    replays: top((w) => w.replays),
    questions: top((w) => w.questions),
    museums: museumRows,
    completion,
  });
}
