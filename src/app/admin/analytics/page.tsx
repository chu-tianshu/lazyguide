import { timingSafeEqual } from "node:crypto";
import type { Metadata } from "next";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "LazyGuide analytics", robots: { index: false, follow: false } };

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

function authorized(key: string | undefined): boolean {
  const expected = process.env.ADMIN_DASHBOARD_TOKEN;
  if (!expected || !key) return false;
  const a = Buffer.from(key);
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

function Bars({ rows, unit }: { rows: { label: string; value: number; note?: string }[]; unit: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <div style={{ display: "grid", gap: 6 }}>
      {rows.length === 0 && <p style={{ color: "#777" }}>No data yet.</p>}
      {rows.map((r) => (
        <div key={r.label} style={{ display: "grid", gridTemplateColumns: "minmax(120px, 280px) 1fr 70px", gap: 10, alignItems: "center", fontSize: 14 }}>
          <span title={r.note} style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.label}</span>
          <div style={{ background: "#eee", borderRadius: 3, height: 14 }}>
            <div style={{ width: `${(r.value / max) * 100}%`, background: "#2f6f5e", height: "100%", borderRadius: 3 }} />
          </div>
          <span style={{ textAlign: "right", fontVariantNumeric: "tabular-nums" }}>{r.value} {unit}</span>
        </div>
      ))}
    </div>
  );
}

function Card({ label, value }: { label: string; value: string | number }) {
  return (
    <div style={{ border: "1px solid #ddd", borderRadius: 8, padding: "12px 16px", minWidth: 120 }}>
      <div style={{ fontSize: 26, fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{value}</div>
      <div style={{ fontSize: 13, color: "#666" }}>{label}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ margin: "32px 0" }}>
      <h2 style={{ fontSize: 18, margin: "0 0 12px" }}>{title}</h2>
      {children}
    </section>
  );
}

export default async function AnalyticsPage({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const { key } = await searchParams;
  if (!authorized(key)) {
    return <main style={{ padding: 32, fontFamily: "system-ui" }}><p>Not found.</p></main>;
  }
  const db = supabaseAdmin();
  if (!db) return <main style={{ padding: 32, fontFamily: "system-ui" }}><p>Supabase service role is not configured.</p></main>;

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
    return <main style={{ padding: 32, fontFamily: "system-ui" }}><p>Query failed: {err.message}. Has supabase/analytics.sql been run?</p></main>;
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

  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 60px", fontFamily: "system-ui, sans-serif", color: "#222" }}>
      <h1 style={{ fontSize: 24 }}>LazyGuide analytics</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <Card label="Active today" value={s.dau} />
        <Card label="Active 7 days" value={s.wau} />
        <Card label="Active 30 days" value={s.mau} />
        <Card label="Users ever" value={s.total_users} />
        <Card label="Work views" value={s.work_views} />
        <Card label="Plays" value={s.plays} />
        <Card label="Replays" value={s.replays} />
        <Card label="Completions" value={s.completes} />
        <Card label="Questions" value={s.questions} />
      </div>

      <h2 style={{ fontSize: 18, margin: "32px 0 12px" }}>Usage of paid services</h2>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <Card label="Guides generated" value={u.guide_generations} />
        <Card label="Questions answered" value={u.questions} />
        <Card label="Audio generated (min)" value={Number(u.audio_minutes).toFixed(1)} />
        <Card label="Voice requests" value={u.tts_requests} />
        <Card label="Voice characters" value={u.tts_chars} />
        <Card label="Claude tokens in / out" value={`${u.input_tokens} / ${u.output_tokens}`} />
      </div>

      <Section title="Audio generated per day (minutes, last 30 days)">
        <Bars rows={usageDaily.map((d) => ({ label: d.day, value: Math.round(Number(d.audio_minutes) * 10) / 10 }))} unit="min" />
      </Section>
      <Section title="Guides generated per day (last 30 days)">
        <Bars rows={usageDaily.map((d) => ({ label: d.day, value: d.guide_generations }))} unit="guides" />
      </Section>

      <Section title="Daily active users (last 30 days)">
        <Bars rows={daily.map((d) => ({ label: d.day, value: d.active_users }))} unit="users" />
      </Section>
      <Section title="Most viewed places"><Bars rows={top((w) => w.views)} unit="views" /></Section>
      <Section title="Most replayed works"><Bars rows={top((w) => w.replays)} unit="replays" /></Section>
      <Section title="Most questions asked"><Bars rows={top((w) => w.questions)} unit="asked" /></Section>
      <Section title="Views by museum"><Bars rows={museumRows} unit="views" /></Section>
      <Section title="Listen-through rate (works with 3+ plays)"><Bars rows={completion} unit="%" /></Section>
    </main>
  );
}
