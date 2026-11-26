"use client";

import { useEffect, useMemo, useState } from "react";
import type { Museum } from "@/data/museums";
import { fetchMuseums, localizeMuseums } from "@/lib/catalogApi";
import { htmlLang, uiStrings, type LanguageCode } from "@/lib/i18n";
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

export function VisitsPage({
  language,
  onBack,
  onSelectMuseum,
}: {
  language: LanguageCode;
  onBack: () => void;
  onSelectMuseum: (museumId: string) => void;
}) {
  const ui = uiStrings[language];
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
    let current = true;
    fetchMuseums().then(
      (list) => current && setMuseums(localizeMuseums(list, language)),
      () => {},
    );
    return () => {
      current = false;
    };
  }, [language]);

  const grouped = useMemo(() => groupByMuseum(visits ?? [], museums), [visits, museums]);

  return (
    <main className="shell" lang={htmlLang(language)}>
      <button className="back" onClick={onBack}>
        {ui.allMuseums}
      </button>

      <header className="masthead">
        <h1>{ui.myVisits}</h1>
      </header>

      {authLoading || visits === null ? (
        <p className="muted">{ui.loading}</p>
      ) : !user ? (
        <p className="muted">{ui.visitsSignIn}</p>
      ) : grouped.length === 0 ? (
        <p className="muted">{ui.visitsNone}</p>
      ) : (
        <ul className="visit-list">
          {grouped.map((m) => (
            <li key={m.museumId}>
              <button className="result visit-item" onClick={() => onSelectMuseum(m.museumId)}>
                <span className="result-title">{m.name}</span>
                <span className="result-meta">
                  {ui.worksViewed(m.workCount)} · {ui.firstVisited(new Date(m.firstVisited).toLocaleDateString(ui.dateLocale))}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
