"use client";

/**
 * Interactive way into the Louvre's collection: pick a floor or a wing, click a room on the
 * floor plan (or in the list) and then an artwork. Rooms and which work hangs where come from the Louvre's
 * own collection database; the room outlines are OpenStreetMap indoor data. See scripts/louvre/.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import type { WorkSummary } from "@/data/catalog";
import { uiStrings, type LanguageCode } from "@/lib/i18n";
import roomsData from "@/data/louvre/rooms.json";

interface RoomInfo {
  level: number;
  wing: string;
  name: string;
  shape?: string;
}
interface PlanLevel {
  shapes: { id: string; d: string; n?: string }[];
  corridors: string[];
  walls: string[];
}
interface Plan {
  bounds: [number, number, number, number];
  levels: Record<string, PlanLevel>;
  wingLabels: Record<string, [number, number]>;
}

const ROOMS = roomsData.rooms as unknown as Record<string, RoomInfo>;
const WORK_ROOMS = roomsData.workRooms as Record<string, string>;

const LEVELS = [2, 1, 0, -1, -2];
const WINGS = ["Denon", "Sully", "Richelieu"];

/** One colour (hue) per wing, so the plan reads by geometry rather than by what hangs in a room. */
const WING_HUE: Record<string, number> = { Denon: 25, Sully: 205, Richelieu: 145 };
const hueOf = (wing: string) => WING_HUE[wing] ?? 280;

interface Group {
  key: string; // an outline's id, or r<number> for a room with no outline
  rooms: string[]; // room numbers, sorted
  level: number;
  wing: string;
  name: string;
  shape?: string;
}

const roomNumber = (n: string) => parseInt(n.replace(/\D/g, ""), 10) || 0;

/** Rooms that share an outline (e.g. the three sections of the Grande Galerie) form one group. */
const GROUPS: Map<string, Group> = (() => {
  const map = new Map<string, Group>();
  for (const [num, r] of Object.entries(ROOMS)) {
    const key = r.shape ?? `r${num}`;
    const g = map.get(key);
    if (g) g.rooms.push(num);
    else map.set(key, { key, rooms: [num], level: r.level, wing: r.wing, name: r.name, shape: r.shape });
  }
  for (const g of map.values()) {
    g.rooms.sort((a, b) => roomNumber(a) - roomNumber(b));
    const first = ROOMS[g.rooms[0]];
    g.name = first.name;
  }
  return map;
})();

const groupOfWork = (id: string): Group | undefined => {
  const num = WORK_ROOMS[id];
  const r = num && ROOMS[num];
  return r ? GROUPS.get(r.shape ?? `r${num}`) : undefined;
};


const factValue = (w: WorkSummary, label: string) => w.facts.find((f) => f.label === label)?.value;

function bboxOf(ds: string[]): [number, number, number, number] | null {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const d of ds) {
    const nums = d.match(/-?\d+(?:\.\d+)?/g);
    if (!nums) continue;
    for (let i = 0; i + 1 < nums.length; i += 2) {
      const x = +nums[i], y = +nums[i + 1];
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
  return x0 === Infinity ? null : [x0, y0, x1, y1];
}

// The visitor's place survives opening a work and coming back.
let saved: { level: number; wing: string | null; selected: string | null; scrollY: number } = {
  level: 1,
  wing: null,
  selected: null,
  scrollY: 0,
};

export function LouvreExplorer({
  language,
  works,
  visited,
  onSelect: openWork,
}: {
  language: LanguageCode;
  works: WorkSummary[];
  visited: Set<string>;
  onSelect: (id: string) => void;
}) {
  const x = uiStrings[language].explorer;
  const LEVEL_NAME = x.levels;
  const roomLabel = (g: Group) => (g.rooms.length === 1 ? x.room(g.rooms[0]) : x.rooms(g.rooms));
  const worksLabel = x.works;
  // Opening a work remembers the scroll position, so "back" lands exactly where the visitor was.
  const onSelect = (id: string) => {
    saved.scrollY = window.scrollY;
    openWork(id);
  };
  useEffect(() => {
    const y = saved.scrollY;
    saved.scrollY = 0;
    if (y) requestAnimationFrame(() => window.scrollTo({ top: y }));
  }, []);
  const [level, setLevel] = useState(saved.level);
  const [wing, setWing] = useState<string | null>(saved.wing);
  const [selected, setSelected] = useState<string | null>(saved.selected);
  const [hover, setHover] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  useEffect(() => {
    saved = { ...saved, level, wing, selected };
  }, [level, wing, selected]);
  useEffect(() => {
    let current = true;
    import("@/data/louvre/plan.json").then((m) => current && setPlan(m.default as unknown as Plan));
    return () => {
      current = false;
    };
  }, []);

  // Every work with the group (room or outline) it hangs in. Works that are off display have none.
  const placed = useMemo(
    () => works.map((work) => ({ work, group: groupOfWork(work.id) })),
    [works],
  );
  const offDisplay = placed.filter((p) => !p.group);

  const matches = (p: (typeof placed)[number], f: { level?: boolean; wing?: boolean }) =>
    !!p.group &&
    (!f.level || p.group.level === level) &&
    (!f.wing || !wing || p.group.wing === wing);

  // Counts shown on the controls: each ignores its own filter, so the choices stay visible.
  const levelCounts = useMemo(() => {
    const c = new Map<number, number>();
    for (const p of placed) if (matches(p, { wing: true })) c.set(p.group!.level, (c.get(p.group!.level) ?? 0) + 1);
    return c;
  }, [placed, wing]); // eslint-disable-line react-hooks/exhaustive-deps
  const wingCounts = useMemo(() => {
    const c = new Map<string, number>();
    for (const p of placed) if (matches(p, { level: true })) c.set(p.group!.wing, (c.get(p.group!.wing) ?? 0) + 1);
    return c;
  }, [placed, level]); // eslint-disable-line react-hooks/exhaustive-deps
  // What is listed: this level, narrowed by wing, grouped by room.
  const byGroup = useMemo(() => {
    const m = new Map<string, WorkSummary[]>();
    for (const p of placed) if (matches(p, { level: true, wing: true })) {
      const k = p.group!.key;
      m.set(k, [...(m.get(k) ?? []), p.work]);
    }
    return m;
  }, [placed, level, wing]); // eslint-disable-line react-hooks/exhaustive-deps
  const listedGroups = [...byGroup.keys()]
    .map((k) => GROUPS.get(k)!)
    .sort((a, b) => roomNumber(a.rooms[0]) - roomNumber(b.rooms[0]));
  const total = [...byGroup.values()].reduce((n, ws) => n + ws.length, 0);

  // A selected room that the filters no longer show is dropped.
  const activeKey = selected && byGroup.has(selected) ? selected : null;
  const shown = activeKey ? [GROUPS.get(activeKey)!] : listedGroups;

  const planLevel = plan?.levels[String(level)];
  // The plan is framed on this floor's outlined rooms (this wing's, when one is chosen).
  const viewBox = useMemo(() => {
    if (!plan || !planLevel) return "-310 -197 604 376";
    const ids = new Set(
      [...GROUPS.values()].filter((g) => g.level === level && g.shape && (!wing || g.wing === wing)).map((g) => g.shape!),
    );
    const box = bboxOf(planLevel.shapes.filter((s) => ids.has(s.id)).map((s) => s.d));
    const [x0, y0, x1, y1] = box ?? plan.bounds;
    const pad = 20;
    return `${x0 - pad} ${y0 - pad} ${x1 - x0 + pad * 2} ${y1 - y0 + pad * 2}`;
  }, [plan, planLevel, wing, level]);

  const focus = hover ?? activeKey;
  const focusGroup = focus ? GROUPS.get(focus) : undefined;
  const unoutlined = listedGroups.filter((g) => !g.shape);

  const drawRank = (id: string) => {
    const g = GROUPS.get(id);
    if (!g || g.level !== level) return 0;
    if (id === activeKey) return 3;
    return byGroup.has(id) ? 2 : 1;
  };

  const chooseLevel = (l: number) => {
    setLevel(l);
    setSelected(null);
  };
  const listRef = useRef<HTMLDivElement>(null);
  const toggleSelected = (key: string) => {
    setSelected((s) => (s === key ? null : key));
    // The list is below the map on a narrow screen, and may be scrolled out of sight on a wide one.
    requestAnimationFrame(() => {
      const el = listRef.current;
      if (el && (window.matchMedia("(max-width: 55.99rem)").matches || el.getBoundingClientRect().top < 0)) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  };

  return (
    <div className="explorer">
      <div className="x-controls">
        <div className="x-row" role="group" aria-label={x.floor}>
          {LEVELS.map((l) => (
            <button
              key={l}
              className="x-chip x-floor"
              aria-pressed={l === level}
              onClick={() => chooseLevel(l)}
              disabled={!levelCounts.get(l) && l !== level}
            >
              {LEVEL_NAME[l]} <span className="x-count">{levelCounts.get(l) ?? 0}</span>
            </button>
          ))}
        </div>
        <div className="x-row" role="group" aria-label={x.wing}>
          <button className="x-chip" aria-pressed={wing === null} onClick={() => setWing(null)}>
            {x.allWings}
          </button>
          {WINGS.map((w) => (
            <button
              key={w}
              className="x-chip"
              aria-pressed={wing === w}
              onClick={() => setWing(wing === w ? null : w)}
              disabled={!wingCounts.get(w) && wing !== w}
            >
              <span className="x-dot" style={{ background: `hsl(${hueOf(w)} 55% 52%)` }} aria-hidden="true" />
              {x.wingName(w)} <span className="x-count">{wingCounts.get(w) ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="x-body">
        <div className="x-mapcol">
          <figure className="x-map">
            {plan && planLevel ? (
              <svg viewBox={viewBox} className={activeKey ? "x-picked" : undefined} role="group" aria-label={x.floorPlan(LEVEL_NAME[level])} onMouseLeave={() => setHover(null)}>
                {planLevel.corridors.map((d, i) => (
                  <path key={i} d={d} className="x-corridor" />
                ))}
                {[...planLevel.shapes]
                  // Overlapping outlines: plain ones are drawn first so the clickable ones, and the selection, stay on top.
                  .sort((a, b) => drawRank(a.id) - drawRank(b.id))
                  .map((s) => {
                  const g = GROUPS.get(s.id);
                  const count = g ? (byGroup.get(g.key)?.length ?? 0) : 0;
                  if (!g || g.level !== level) return <path key={s.id} d={s.d} className="x-room" />;
                  const cls = ["x-room", count ? "x-has" : "x-dim", activeKey === g.key ? "x-selected" : ""].join(" ");
                  if (!count) return <path key={s.id} d={s.d} className={cls} style={{ ["--h" as string]: hueOf(g.wing) }} />;
                  return (
                    <path
                      key={s.id}
                      d={s.d}
                      className={cls}
                      style={{ ["--h" as string]: hueOf(g.wing) }}
                      role="button"
                      tabIndex={0}
                      aria-label={`${roomLabel(g)}, ${g.name}: ${worksLabel(count)}`}
                      aria-pressed={activeKey === g.key}
                      onClick={() => toggleSelected(g.key)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleSelected(g.key);
                        }
                      }}
                      onMouseEnter={() => setHover(g.key)}
                      onFocus={() => setHover(g.key)}
                      onBlur={() => setHover(null)}
                    >
                      <title>{`${roomLabel(g)} · ${g.name} (${worksLabel(count)})`}</title>
                    </path>
                  );
                })}
                {planLevel.walls.map((d, i) => (
                  <path key={i} d={d} className="x-wall" />
                ))}
                {Object.entries(plan.wingLabels)
                  .filter(([w]) => !wing || w === wing)
                  .map(([w, [px, py]]) => (
                    <text key={w} x={px} y={py} className="x-wing" textAnchor="middle">
                      {x.wingName(w).toUpperCase()}
                    </text>
                  ))}
              </svg>
            ) : (
              <p className="muted x-loading">{x.loadingPlan}</p>
            )}
            <figcaption className="x-caption" aria-live="polite">
              {focusGroup ? (
                <>
                  <strong>{roomLabel(focusGroup)}</strong> · {focusGroup.name} · {x.wingSuffix(focusGroup.wing)} ·{" "}
                  {worksLabel(byGroup.get(focusGroup.key)?.length ?? 0)}
                </>
              ) : (
                <>{x.clickHint}</>
              )}
            </figcaption>
          </figure>

          {unoutlined.length > 0 && (
            <div className="x-unoutlined">
              <p className="muted">{x.otherRooms}</p>
              <div className="x-row">
                {unoutlined.map((g) => (
                  <button key={g.key} className="x-chip" aria-pressed={activeKey === g.key} onClick={() => toggleSelected(g.key)}>
                    <span className="x-dot" style={{ background: `hsl(${hueOf(g.wing)} 55% 52%)` }} aria-hidden="true" />
                    {g.rooms[0]} · {g.name} <span className="x-count">{byGroup.get(g.key)?.length ?? 0}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
          <p className="x-credit muted">
            {x.credit}
          </p>
        </div>

        <div className="x-list" ref={listRef}>
          <h2 className="x-heading">
            {activeKey ? (
              <>
                {roomLabel(shown[0])} · {shown[0].name}
              </>
            ) : (
              <>
                {LEVEL_NAME[level]}
                {wing ? ` · ${x.wingSuffix(wing)}` : ""}
              </>
            )}
            <span className="x-total"> {worksLabel(activeKey ? (byGroup.get(activeKey)?.length ?? 0) : total)}</span>
          </h2>
          {activeKey && (
            <button className="x-back" onClick={() => setSelected(null)}>
              {x.allRoomsOnLevel}
            </button>
          )}
          {shown.length === 0 && <p className="empty">{x.noMatch}</p>}
          {shown.map((g) => (
            <section key={g.key} className="x-group">
              {!activeKey && (
                <h3 className="x-group-title">
                  <button onClick={() => toggleSelected(g.key)} onMouseEnter={() => setHover(g.key)} onMouseLeave={() => setHover(null)}>
                    <span className="x-dot" style={{ background: `hsl(${hueOf(g.wing)} 55% 52%)` }} aria-hidden="true" />
                    {roomLabel(g)} · {g.name}
                    <span className="x-count"> {x.wingName(g.wing)} · {byGroup.get(g.key)?.length}</span>
                  </button>
                </h3>
              )}
              <ul className="x-cards">
                {(byGroup.get(g.key) ?? []).map((w) => (
                  <li key={w.id}>
                    <button className="x-card" onClick={() => onSelect(w.id)}>
                      <span className="x-thumb">
                        {w.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={w.image.src} alt="" loading="lazy" decoding="async" />
                        ) : (
                          <span className="x-noimg" aria-hidden="true" />
                        )}
                      </span>
                      <span className="x-card-title">
                        {w.title}
                        {visited.has(w.id) && (
                          <span className="x-visited" role="img" aria-label={uiStrings[language].visited} title={uiStrings[language].visited}>
                            ✓
                          </span>
                        )}
                      </span>
                      <span className="x-card-meta">
                        {[w.artist?.replace(/\s*\(.*\)$/, ""), factValue(w, "Date")].filter(Boolean).join(" · ")}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {!activeKey && offDisplay.length > 0 && !wing && (
            <details className="x-off">
              <summary>{x.notOnDisplay(offDisplay.length)}</summary>
              <ul className="x-cards">
                {offDisplay.map(({ work: w }) => (
                  <li key={w.id}>
                    <button className="x-card" onClick={() => onSelect(w.id)}>
                      <span className="x-thumb">
                        {w.image ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={w.image.src} alt="" loading="lazy" decoding="async" />
                        ) : (
                          <span className="x-noimg" aria-hidden="true" />
                        )}
                      </span>
                      <span className="x-card-title">{w.title}</span>
                      <span className="x-card-meta">{w.artist?.replace(/\s*\(.*\)$/, "")}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
