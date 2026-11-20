"use client";

import { useEffect, useMemo, useState } from "react";
import type { Museum } from "@/data/museums";
import { fetchMuseums } from "@/lib/catalogApi";
import { useAuth } from "@/lib/auth";
import { fetchVisits, type Visit } from "@/lib/visits";

interface MuseumVisit {
  museumId: string;
  name: string;
  firstVisited: string;
  lastVisited: string;
  workCount: number;
}

function groupByMuseum(visits: Visit[], museums: Museum[]): MuseumVisit[] {
  const byMuseum = new Map<string, Visit[]>();
  for (const v of visits) {
    const list = byMuseum.get(v.museumId) ?? [];
    list.push(v);
    byMuseum.set(v.museumId, list);
  }
  return Array.from(byMuseum.entries())
    .map(([museumId, list]) => ({
      museumId,
      name: museums.find((m) => m.id === museumId)?.name ?? museumId,
      firstVisited: list[0].visitedAt,
      lastVisited: list[list.length - 1].visitedAt,
      workCount: new Set(list.map((v) => v.workId)).size,
    }))
    .sort((a, b) => a.firstVisited.localeCompare(b.firstVisited));
}

export function VisitsPage({ onBack }: { onBack: () => void }) {
  const { user, loading: authLoading } = useAuth();
  const [visits, setVisits] = useState<Visit[] | null>(null);
  const [museums, setMuseums] = useState<Museum[]>([]);

  useEffect(() => {
    if (!user) {
      setVisits([]);
      return;
    }
    fetchVisits().then(setVisits);
  }, [user]);

  useEffect(() => {
    // Only used to show museum names; ids are shown if this fails.
    fetchMuseums().then(setMuseums, () => {});
  }, []);

  const grouped = useMemo(() => groupByMuseum(visits ?? [], museums), [visits, museums]);

  return (
    <main className="shell" lang="en">
      <button className="back" onClick={onBack}>
        ← All museums
      </button>

      <header className="masthead">
        <h1>My visits</h1>
      </header>

      {authLoading || visits === null ? (
        <p className="muted">Loading…</p>
      ) : !user ? (
        <p className="muted">Sign in to track the museums and works you've viewed.</p>
      ) : grouped.length === 0 ? (
        <p className="muted">No visits yet — explore a museum and open a guide.</p>
      ) : (
        <ul className="visit-list">
          {grouped.map((m) => (
            <li key={m.museumId} className="visit-item">
              <span className="result-title">{m.name}</span>
              <span className="result-meta">
                {m.workCount} work{m.workCount === 1 ? "" : "s"} viewed · first visited{" "}
                {new Date(m.firstVisited).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
