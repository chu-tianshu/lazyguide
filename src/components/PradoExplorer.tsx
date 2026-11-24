"use client";

/**
 * Hall-by-hall way into the Prado's collection: pick a sub-area or a hall, then an artwork. Which hall a work hangs
 * in comes from Wikidata (CC0); only about 70 works have one recorded. There is no floor or plan data from any open
 * source (the Prado's site blocks bots and OpenStreetMap has no indoor map), so unlike the Louvre there are no floors.
 * See scripts/prado/.
 */
import { useEffect, useMemo, useState } from "react";
import type { WorkSummary } from "@/data/catalog";
import hallData from "@/data/prado/halls.json";

const HALLS = hallData.halls as Record<string, string>;
const WORK_HALLS = hallData.workHalls as Record<string, string>;
const WORK_AREAS = hallData.workAreas as Record<string, string>;
const AREA_ORDER = hallData.areaOrder as string[];

const hueOf = (area: string) => ((Math.max(AREA_ORDER.indexOf(area), 0) * 137.5 + 20) % 360);
const hallSort = (a: string, b: string) => {
  const [na, nb] = [parseInt(a, 10), parseInt(b, 10)];
  return na - nb || a.localeCompare(b);
};
const worksLabel = (n: number) => `${n} ${n === 1 ? "work" : "works"}`;
const hideBroken = (e: React.SyntheticEvent<HTMLImageElement>) => {
  e.currentTarget.style.visibility = "hidden";
};
const dateOf = (w: WorkSummary) => w.facts.find((f) => f.label === "Date")?.value;

// The visitor's place survives opening a work and coming back, scroll position included.
let saved: { area: string | null; hall: string | null; scrollY: number } = { area: null, hall: null, scrollY: 0 };

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

export function PradoExplorer({
  works,
  visited,
  onSelect: openWork,
}: {
  works: WorkSummary[];
  visited: Set<string>;
  onSelect: (id: string) => void;
}) {
  const [area, setArea] = useState<string | null>(saved.area);
  const [hall, setHall] = useState<string | null>(saved.hall);
  useEffect(() => {
    saved = { ...saved, area, hall };
  }, [area, hall]);
  const onSelect = (id: string) => {
    saved.scrollY = window.scrollY;
    openWork(id);
  };
  useEffect(() => {
    const y = saved.scrollY;
    saved.scrollY = 0;
    if (y) requestAnimationFrame(() => window.scrollTo({ top: y }));
  }, []);

  const placed = useMemo(() => works.filter((w) => WORK_HALLS[w.id]), [works]);
  const unplaced = works.filter((w) => !WORK_HALLS[w.id]);

  const inArea = (w: WorkSummary) => !area || WORK_AREAS[w.id] === area;
  const areaCounts = useMemo(() => {
    const c = new Map<string, number>();
    for (const w of placed) if (!hall || WORK_HALLS[w.id] === hall) c.set(WORK_AREAS[w.id], (c.get(WORK_AREAS[w.id]) ?? 0) + 1);
    return c;
  }, [placed, hall]);
  const hallCounts = useMemo(() => {
    const c = new Map<string, number>();
    for (const w of placed) if (inArea(w)) c.set(WORK_HALLS[w.id], (c.get(WORK_HALLS[w.id]) ?? 0) + 1);
    return c;
  }, [placed, area]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeHall = hall && hallCounts.has(hall) ? hall : null;
  const shownHalls = (activeHall ? [activeHall] : [...hallCounts.keys()]).sort(hallSort);
  const byHall = (h: string) => placed.filter((w) => WORK_HALLS[w.id] === h && inArea(w));
  const total = shownHalls.reduce((n, h) => n + (hallCounts.get(h) ?? 0), 0);
  const dominantArea = (h: string) => {
    const c = new Map<string, number>();
    for (const w of placed) if (WORK_HALLS[w.id] === h) c.set(WORK_AREAS[w.id], (c.get(WORK_AREAS[w.id]) ?? 0) + 1);
    return [...c.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
  };

  return (
    <div className="explorer">
      <div className="x-controls">
        <div className="x-row" role="group" aria-label="Sub-area">
          <button className="x-chip" aria-pressed={area === null} onClick={() => setArea(null)}>
            All areas
          </button>
          {AREA_ORDER.filter((a) => areaCounts.get(a) || a === area).map((a) => (
            <button key={a} className="x-chip" aria-pressed={area === a} onClick={() => setArea(area === a ? null : a)}>
              <span className="x-dot" style={{ background: `hsl(${hueOf(a)} 55% 52%)` }} aria-hidden="true" />
              {a} <span className="x-count">{areaCounts.get(a) ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="x-row" role="group" aria-label="Hall">
          <button className="x-chip" aria-pressed={hall === null} onClick={() => setHall(null)}>
            All halls
          </button>
          {Object.keys(HALLS)
            .sort(hallSort)
            .map((h) => (
              <button
                key={h}
                className="x-chip"
                aria-pressed={hall === h}
                onClick={() => setHall(hall === h ? null : h)}
                disabled={!hallCounts.get(h) && hall !== h}
              >
                <span className="x-dot" style={{ background: `hsl(${hueOf(dominantArea(h))} 55% 52%)` }} aria-hidden="true" />
                {HALLS[h]} <span className="x-count">{hallCounts.get(h) ?? 0}</span>
              </button>
            ))}
        </div>
        <p className="x-credit muted">
          Hall locations: Wikidata (CC0), recorded for about {placed.length} works. No floor plan is available from open sources.
        </p>
      </div>

      <div className="x-list x-list-full">
        <h2 className="x-heading">
          {activeHall ? HALLS[activeHall] : "Works by hall"}
          {area ? ` · ${area}` : ""}
          <span className="x-total"> {worksLabel(total)}</span>
        </h2>
        {activeHall && (
          <button className="x-back" onClick={() => setHall(null)}>
            ← All halls
          </button>
        )}
        {shownHalls.length === 0 && <p className="empty">No works match these filters.</p>}
        {shownHalls.map((h) => (
          <section key={h} className="x-group">
            {!activeHall && (
              <h3 className="x-group-title">
                <button onClick={() => setHall(h)}>
                  <span className="x-dot" style={{ background: `hsl(${hueOf(dominantArea(h))} 55% 52%)` }} aria-hidden="true" />
                  {HALLS[h]}
                  <span className="x-count"> {hallCounts.get(h)}</span>
                </button>
              </h3>
            )}
            <ul className="x-cards">
              {byHall(h).map((w) => (
                <Card key={w.id} w={w} visited={visited} onSelect={onSelect} />
              ))}
            </ul>
          </section>
        ))}
        {!activeHall && !area && unplaced.length > 0 && (
          <details className="x-off">
            <summary>Hall not recorded ({unplaced.length})</summary>
            <ul className="x-cards">
              {unplaced.map((w) => (
                <Card key={w.id} w={w} visited={visited} onSelect={onSelect} />
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
