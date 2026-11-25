"use client";

/**
 * Room-by-room way into the Prado's collection: rooms are listed collapsed, and opening one shows its works. Which room a work hangs
 * in comes from the Prado's own room listings (collected in a browser, see scripts/prado/ and research/prado/). There
 * is no floor or plan data from any open source, so unlike the Louvre there are no floors.
 */
import { useEffect, useMemo, useState } from "react";
import type { WorkSummary } from "@/data/catalog";
import hallData from "@/data/prado/halls.json";

const HALLS = hallData.halls as Record<string, string>;
const WORK_HALLS = hallData.workHalls as Record<string, string>;
const hallSort = (a: string, b: string) => {
  const [na, nb] = [parseInt(a, 10), parseInt(b, 10)];
  return na - nb || a.localeCompare(b);
};
const hideBroken = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.visibility = "hidden";
};
const dateOf = (w: WorkSummary) => w.facts.find((f) => f.label === "Date")?.value;

// The visitor's place survives opening a work and coming back, scroll position included.
let saved: { open: string[]; scrollY: number } = { open: [], scrollY: 0 };

function Card({ w, visited, onSelect }: { w: WorkSummary; visited: Set<string>; onSelect: (id: string) => void }) {
  return (
    <li>
      <button className="x-card" onClick={() => onSelect(w.id)}>
        <span className="x-thumb">
          {w.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={w.image.src} alt="" loading="lazy" decoding="async" onError={hideBroken} />
          ) : (
            <span className="x-noimg" aria-hidden="true" />
          )}
        </span>
        <span className="x-card-title">
          {w.title}
          {visited.has(w.id) && (
            <span className="x-visited" role="img" aria-label="Visited" title="Visited">
              ✓
            </span>
          )}
        </span>
        <span className="x-card-meta">{[w.artist?.replace(/\s*\(.*\)$/, ""), dateOf(w)].filter(Boolean).join(" · ")}</span>
      </button>
    </li>
  );
}

const NOT_RECORDED = "none";

export function PradoExplorer({
  works,
  visited,
  onSelect: openWork,
}: {
  works: WorkSummary[];
  visited: Set<string>;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState<Set<string>>(new Set(saved.open));
  useEffect(() => {
    saved = { ...saved, open: [...open] };
  }, [open]);
  const onSelect = (id: string) => {
    saved.scrollY = window.scrollY;
    openWork(id);
  };
  useEffect(() => {
    const y = saved.scrollY;
    saved.scrollY = 0;
    if (y) requestAnimationFrame(() => window.scrollTo({ top: y }));
  }, []);
  const toggle = (key: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(key)) next.add(key);
      return next;
    });

  const groups = useMemo(() => {
    const m = new Map<string, WorkSummary[]>();
    for (const w of works) {
      const k = WORK_HALLS[w.id] ?? NOT_RECORDED;
      m.set(k, [...(m.get(k) ?? []), w]);
    }
    const halls = [...m.keys()].filter((k) => k !== NOT_RECORDED).sort(hallSort);
    return [...halls, ...(m.has(NOT_RECORDED) ? [NOT_RECORDED] : [])].map((key) => ({
      key,
      name: key === NOT_RECORDED ? "Room not recorded" : HALLS[key],
      works: m.get(key)!,
    }));
  }, [works]);

  return (
    <div className="explorer x-prado">
      <p className="x-credit muted">Room numbers: Museo del Prado collection pages. No floor plan is available from open sources.</p>
      {groups.map((g) => {
        const isOpen = open.has(g.key);
        return (
          <div className="category" key={g.key}>
            <h3 className="category-heading">
              <button className="category-toggle" aria-expanded={isOpen} onClick={() => toggle(g.key)}>
                <span className="category-chevron" aria-hidden="true">
                  {isOpen ? "▾" : "▸"}
                </span>
                {g.name} <span className="category-count">{g.works.length}</span>
              </button>
            </h3>
            {isOpen && (
              <ul className="x-cards">
                {g.works.map((w) => (
                  <Card key={w.id} w={w} visited={visited} onSelect={onSelect} />
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
}
