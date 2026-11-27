"use client";

import { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabaseClient";

type Row = { label: string; value: number; note?: string };
interface Data {
  users: { total_users: number; signed_in_users: number; guest_users: number };
  topMuseumsByVisitors: Row[];
  preferences: { length: Row[]; style: Row[]; topic: Row[]; language: Row[] };
  followUps: { clicks: number; questions: number; clickUsers: number; clicksByMuseum: Row[] };
  favorites: { total: number; byMuseum: Row[] };
  summary: { total_users: number; dau: number; wau: number; mau: number; work_views: number; plays: number; replays: number; completes: number; questions: number };
  usage: { guide_generations: number; questions: number; tts_requests: number; audio_minutes: number; tts_chars: number; input_tokens: number; output_tokens: number };
  usageDaily: { label: string; audioMinutes: number; guides: number }[];
  daily: Row[]; views: Row[]; replays: Row[]; questions: Row[]; museums: Row[]; completion: Row[];
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


const shell: React.CSSProperties = { padding: 32, fontFamily: "system-ui, sans-serif" };

function Dashboard() {
  const { user, loading, signInWithGoogle, signOut } = useAuth();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user || !supabase) return;
    let current = true;
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      const res = await fetch("/api/admin/analytics", {
        headers: { Authorization: `Bearer ${session.session?.access_token ?? ""}` },
      });
      const json = await res.json().catch(() => ({}));
      if (!current) return;
      if (res.ok) setData(json as Data);
      else setError((json as { error?: string }).error ?? "Failed to load.");
    })();
    return () => {
      current = false;
    };
  }, [user]);

  if (loading) return <main style={shell}>Loading…</main>;
  if (!user) {
    return (
      <main style={shell}>
        <p>Sign in to see the analytics.</p>
        <button onClick={() => signInWithGoogle()}>Sign in with Google</button>
        <p style={{ color: "#777", fontSize: 13 }}>You'll land on the home page after signing in; come back to this address.</p>
      </main>
    );
  }
  if (error) {
    return (
      <main style={shell}>
        <p>{error}</p>
        <button onClick={() => signOut()}>Sign out</button>
      </main>
    );
  }
  if (!data) return <main style={shell}>Loading…</main>;

  const { summary: s, usage: u } = data;
  return (
    <main style={{ maxWidth: 900, margin: "0 auto", padding: "24px 20px 60px", fontFamily: "system-ui, sans-serif", color: "#222" }}>
      <h1 style={{ fontSize: 24 }}>LazyGuide analytics</h1>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 12 }}>
        <Card label="Unique users" value={data.users.total_users} />
        <Card label="Signed in" value={data.users.signed_in_users} />
        <Card label="Guests" value={data.users.guest_users} />
        <Card label="Follow-up clicks" value={data.followUps.clicks} />
        <Card label="Favorites" value={data.favorites.total} />
      </div>
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
        <Bars rows={data.usageDaily.map((d) => ({ label: d.label, value: d.audioMinutes }))} unit="min" />
      </Section>
      <Section title="Guides generated per day (last 30 days)">
        <Bars rows={data.usageDaily.map((d) => ({ label: d.label, value: d.guides }))} unit="guides" />
      </Section>

      <Section title="Top visited museums (unique visitors)"><Bars rows={data.topMuseumsByVisitors} unit="visitors" /></Section>
      <Section title="Language picks"><Bars rows={data.preferences.language} unit="users" /></Section>
      <Section title="Preference: guide length"><Bars rows={data.preferences.length} unit="users" /></Section>
      <Section title="Preference: style"><Bars rows={data.preferences.style} unit="users" /></Section>
      <Section title="Preference: topics"><Bars rows={data.preferences.topic} unit="users" /></Section>
      <Section title={`Follow-up clicks by museum (plus ${data.followUps.questions} typed questions)`}>
        <Bars rows={data.followUps.clicksByMuseum} unit="clicks" />
      </Section>
      <Section title="Favorite museums"><Bars rows={data.favorites.byMuseum} unit="favorites" /></Section>

      <Section title="Daily active users (last 30 days)">
        <Bars rows={data.daily} unit="users" />
      </Section>
      <Section title="Most viewed places"><Bars rows={data.views} unit="views" /></Section>
      <Section title="Most replayed works"><Bars rows={data.replays} unit="replays" /></Section>
      <Section title="Most questions asked"><Bars rows={data.questions} unit="asked" /></Section>
      <Section title="Views by museum"><Bars rows={data.museums} unit="views" /></Section>
      <Section title="Listen-through rate (works with 3+ plays)"><Bars rows={data.completion} unit="%" /></Section>
    </main>
  );
}

export default function AnalyticsPage() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}
