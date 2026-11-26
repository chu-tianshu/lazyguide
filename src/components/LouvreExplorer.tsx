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

const LEVELS = [-2, -1, 0, 1, 2];
const DEFAULT_LEVEL = 0; // the ground level
const levelChip = (l: number) => (l < 0 ? `−${-l}` : String(l));
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
let saved: { level: number | null; wing: string | null; selected: string | null; open: string[]; scrollY: number } = {
  level: null,
  wing: null,
  selected: null,
  open: [],
  scrollY: 0,
};

const MAX_ZOOM = 8;
/** Room numbers appear on the plan once the visible width is below this many metres. */
const LABEL_BELOW = 240;

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
  const [pickedLevel, setLevel] = useState<number | null>(saved.level);
  const level = pickedLevel ?? DEFAULT_LEVEL;
  const [wing, setWing] = useState<string | null>(saved.wing);
  const [selected, setSelected] = useState<string | null>(saved.selected);
  const [open, setOpen] = useState<Set<string>>(new Set(saved.open));
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<[number, number]>([0, 0]);
  const [hover, setHover] = useState<string | null>(null);
  const [plan, setPlan] = useState<Plan | null>(null);
  useEffect(() => {
    saved = { ...saved, level: pickedLevel, wing, selected, open: [...open] };
  }, [pickedLevel, wing, selected, open]);
  // A new floor or wing starts from the whole framed view.
  useEffect(() => {
    setZoom(1);
    setPan([0, 0]);
  }, [level, wing]);
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
  const wingTotals = useMemo(() => {
    const c = new Map<string, number>();
    for (const p of placed) if (p.group) c.set(p.group.wing, (c.get(p.group.wing) ?? 0) + 1);
    return c;
  }, [placed]);
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

  const planLevel = plan?.levels[String(level)];
  // The plan is framed on this floor's outlined rooms (this wing's, when one is chosen); zoom and pan work inside that frame.
  const baseBox = useMemo((): [number, number, number, number] => {
    if (!plan || !planLevel) return [-310, -197, 604, 376];
    const ids = new Set(
      [...GROUPS.values()].filter((g) => g.level === level && g.shape && (!wing || g.wing === wing)).map((g) => g.shape!),
    );
    const box = bboxOf(planLevel.shapes.filter((s) => ids.has(s.id)).map((s) => s.d));
    const [x0, y0, x1, y1] = box ?? plan.bounds;
    const pad = 20;
    return [x0 - pad, y0 - pad, x1 - x0 + pad * 2, y1 - y0 + pad * 2];
  }, [plan, planLevel, wing, level]);
  const view = useMemo(() => {
    const [bx, by, bw, bh] = baseBox;
    const w = bw / zoom;
    const h = bh / zoom;
    const cx = bx + bw / 2 + pan[0];
    const cy = by + bh / 2 + pan[1];
    return { x: cx - w / 2, y: cy - h / 2, w, h };
  }, [baseBox, zoom, pan]);
  const viewBox = `${view.x} ${view.y} ${view.w} ${view.h}`;
  const showNumbers = view.w < LABEL_BELOW;
  // Where each outlined room's number goes: the centre of its outline.
  const centres = useMemo(() => {
    const m = new Map<string, [number, number]>();
    if (!planLevel) return m;
    for (const sh of planLevel.shapes) {
      const b = bboxOf([sh.d]);
      if (b) m.set(sh.id, [(b[0] + b[2]) / 2, (b[1] + b[3]) / 2]);
    }
    return m;
  }, [planLevel]);
  const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
  // Zoom to level z2 so that plan point P sits at fraction (fx, fy) of the visible area.
  const zoomTo = (z2: number, P: [number, number], fx: number, fy: number) => {
    z2 = clamp(z2, 1, MAX_ZOOM);
    const [bx, by, bw, bh] = baseBox;
    const w2 = bw / z2;
    const h2 = bh / z2;
    const cx = P[0] - fx * w2 + w2 / 2;
    const cy = P[1] - fy * h2 + h2 / 2;
    setZoom(z2);
    setPan(z2 === 1 ? [0, 0] : [clamp(cx - (bx + bw / 2), -bw / 2, bw / 2), clamp(cy - (by + bh / 2), -bh / 2, bh / 2)]);
  };
  // Zooming in goes to something worth seeing: the marked room, else the room with works nearest the middle of the view
  // (the middle itself can be empty, e.g. the Sully courtyard).
  const focusPoint = (): [number, number] => {
    const mid: [number, number] = [view.x + view.w / 2, view.y + view.h / 2];
    const marked = activeKey ? GROUPS.get(activeKey)?.shape : undefined;
    if (marked && centres.has(marked)) return centres.get(marked)!;
    let best: [number, number] | null = null;
    let bestD = Infinity;
    for (const g of GROUPS.values()) {
      if (!g.shape || g.level !== level || !byGroup.has(g.key)) continue;
      const c = centres.get(g.shape);
      if (!c) continue;
      const d = Math.hypot(c[0] - mid[0], c[1] - mid[1]);
      if (d < bestD) {
        bestD = d;
        best = c;
      }
    }
    return best ?? mid;
  };
  const changeZoom = (factor: number) => {
    if (factor > 1) zoomTo(zoom * factor, focusPoint(), 0.5, 0.5);
    else zoomTo(zoom * factor, [view.x + view.w / 2, view.y + view.h / 2], 0.5, 0.5);
  };
  // Pinch (and Cmd/Ctrl + scroll) zooms under the pointer; a plain scroll still scrolls the page.
  const svgRef = useRef<SVGSVGElement>(null);
  const wheelZoom = useRef<(e: WheelEvent) => void>(() => {});
  wheelZoom.current = (e) => {
    if (!e.ctrlKey && !e.metaKey) return;
    const el = svgRef.current;
    if (!el) return;
    e.preventDefault();
    const r = el.getBoundingClientRect();
    const scale = Math.min(r.width / view.w, r.height / view.h);
    const offX = (r.width - view.w * scale) / 2;
    const offY = (r.height - view.h * scale) / 2;
    const fx = clamp((e.clientX - r.left - offX) / (view.w * scale), 0, 1);
    const fy = clamp((e.clientY - r.top - offY) / (view.h * scale), 0, 1);
    zoomTo(zoom * (e.deltaY < 0 ? 1.25 : 0.8), [view.x + fx * view.w, view.y + fy * view.h], fx, fy);
  };
  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const h = (e: WheelEvent) => wheelZoom.current(e);
    el.addEventListener("wheel", h, { passive: false });
    return () => el.removeEventListener("wheel", h);
  }, [plan, planLevel]);
  // Drag to pan. A drag that moved is not a click on a room.
  const drag = useRef<{ x: number; y: number; moved: boolean } | null>(null);
  const moved = useRef(false);
  const onPointerDown = (e: React.PointerEvent<SVGSVGElement>) => {
    drag.current = { x: e.clientX, y: e.clientY, moved: false };
    moved.current = false;
  };
  const onPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d || zoom === 1) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < 5) return;
    d.moved = moved.current = true;
    const rect = e.currentTarget.getBoundingClientRect();
    const unitsPerPx = Math.max(view.w / rect.width, view.h / rect.height);
    d.x = e.clientX;
    d.y = e.clientY;
    const [, , bw, bh] = baseBox;
    setPan(([px, py]) => [
      Math.max(-bw / 2, Math.min(bw / 2, px - dx * unitsPerPx)),
      Math.max(-bh / 2, Math.min(bh / 2, py - dy * unitsPerPx)),
    ]);
  };
  const endDrag = () => {
    drag.current = null;
  };

  const focus = hover ?? activeKey;
  const focusGroup = focus ? GROUPS.get(focus) : undefined;
  const unoutlined = listedGroups.filter((g) => !g.shape);

  const drawRank = (id: string) => {
    const g = GROUPS.get(id);
    if (!g || g.level !== level) return 0;
    if (id === activeKey) return 3;
    return byGroup.has(id) ? 2 : 1;
  };

  // Wing first, then level. Choosing a wing asks for a level; going back to the wings clears both.
  const chooseWing = (next: string | null) => {
    setWing(next);
    setLevel(null);
    setSelected(null);
    setOpen(new Set());
    window.scrollTo({ top: 0 });
  };
  const chooseLevel = (l: number) => {
    setLevel(l);
    setSelected(null);
  };
  // Rooms are collapsed until opened. Opening one (here or on the plan) also marks it on the plan; closing clears the mark.
  const toggleRoom = (key: string) => {
    const opening = !open.has(key);
    setOpen((prev) => {
      const next = new Set(prev);
      if (opening) next.add(key);
      else next.delete(key);
      return next;
    });
    setSelected(opening ? key : selected === key ? null : selected);
    if (opening) {
      // On a narrow screen the list is below the plan, and on a wide one the room may be scrolled out of sight.
      requestAnimationFrame(() => {
        const el = document.getElementById(`room-${key}`);
        if (el && (window.matchMedia("(max-width: 55.99rem)").matches || el.getBoundingClientRect().top < 0)) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      });
    }
  };

  if (!wing || pickedLevel === null) {
    const stepWing = !wing;
    return (
      <div className="explorer x-pick">
        {!stepWing && (
          <button className="x-back" onClick={() => chooseWing(null)}>
            ← {x.changeWing}
          </button>
        )}
        <h2 className="x-pick-title">{stepWing ? x.pickWing : `${x.wingSuffix(wing)} · ${x.pickFloor}`}</h2>
        <div className="x-pick-grid">
          {stepWing
            ? WINGS.map((w) => (
                <button key={w} className="x-pick-card" onClick={() => chooseWing(w)}>
                  <span className="x-dot" style={{ background: `hsl(${hueOf(w)} 55% 52%)` }} aria-hidden="true" />
                  <strong>{x.wingName(w)}</strong>
                  <span className="x-count">{worksLabel(wingTotals.get(w) ?? 0)}</span>
                </button>
              ))
            : [...LEVELS].reverse().map((l) => (
                <button key={l} className="x-pick-card" onClick={() => chooseLevel(l)}>
                  <strong>{LEVEL_NAME[l]}</strong>
                  <span className="x-count">{worksLabel(levelCounts.get(l) ?? 0)}</span>
                </button>
              ))}
        </div>
      </div>
    );
  }

  return (
    <div className="explorer">
      <div className="x-controls">
        <div className="x-axis">
          <span className="x-axis-label" aria-hidden="true">
            {x.wing}
          </span>
          <div className="x-row">
            <button className="x-back" onClick={() => chooseWing(null)}>
              ← {x.changeWing}
            </button>
            <span className="x-current">
              <span className="x-dot" style={{ background: `hsl(${hueOf(wing)} 55% 52%)` }} aria-hidden="true" />
              {x.wingSuffix(wing)}
            </span>
          </div>
        </div>
        <div className="x-axis">
          <span className="x-axis-label" aria-hidden="true">
            {x.floor}
          </span>
          <div className="x-row" role="group" aria-label={x.floor}>
            {LEVELS.map((l) => (
              <button
                key={l}
                className="x-chip x-floor"
                aria-pressed={l === level}
                aria-label={LEVEL_NAME[l]}
                onClick={() => chooseLevel(l)}
              >
                {levelChip(l)} <span className="x-count">{levelCounts.get(l) ?? 0}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="x-body">
        <div className="x-mapcol">
          <figure className="x-map">
            {plan && planLevel ? (
              <svg
                ref={svgRef}
                viewBox={viewBox}
                className={[activeKey ? "x-picked" : "", zoom > 1 ? "x-zoomed" : ""].join(" ").trim() || undefined}
                role="group"
                aria-label={x.floorPlan(LEVEL_NAME[level])}
                onMouseLeave={() => {
                  setHover(null);
                  endDrag();
                }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
              >
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
                      onClick={() => {
                        if (moved.current) return;
                        toggleRoom(g.key);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          toggleRoom(g.key);
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
                {showNumbers &&
                  [...GROUPS.values()]
                    .filter((g) => g.shape && g.level === level && (!wing || g.wing === wing) && centres.has(g.shape))
                    .map((g) => {
                      const [cx, cy] = centres.get(g.shape!)!;
                      const text = g.rooms.length === 1 ? g.rooms[0] : `${g.rooms[0]}–${g.rooms[g.rooms.length - 1]}`;
                      return (
                        <text key={`n-${g.key}`} x={cx} y={cy} className="x-roomnum" textAnchor="middle" dominantBaseline="central" style={{ fontSize: view.w / 38 }}>
                          {text}
                        </text>
                      );
                    })}
                {!showNumbers &&
                Object.entries(plan.wingLabels)
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
            {plan && planLevel && (
              <div className="x-zoom">
                <button onClick={() => changeZoom(1.6)} aria-label={x.zoomIn} disabled={zoom >= MAX_ZOOM}>
                  +
                </button>
                <button onClick={() => changeZoom(1 / 1.6)} aria-label={x.zoomOut} disabled={zoom <= 1}>
                  −
                </button>
                <button
                  onClick={() => {
                    setZoom(1);
                    setPan([0, 0]);
                  }}
                  aria-label={x.zoomReset}
                  disabled={zoom === 1}
                >
                  ⟲
                </button>
              </div>
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
                  <button key={g.key} className="x-chip" aria-pressed={activeKey === g.key} onClick={() => toggleRoom(g.key)}>
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

        <div className="x-list">
          <h2 className="x-heading">
            {LEVEL_NAME[level]}
            {wing ? ` · ${x.wingSuffix(wing)}` : ""}
            <span className="x-total"> {worksLabel(total)}</span>
          </h2>
          {listedGroups.length === 0 && <p className="empty">{x.noMatch}</p>}
          {listedGroups.map((g) => {
            const isOpen = open.has(g.key);
            return (
              <section key={g.key} id={`room-${g.key}`} className={`x-group${activeKey === g.key ? " x-group-selected" : ""}`}>
                <h3 className="x-group-title">
                  <button
                    aria-expanded={isOpen}
                    onClick={() => toggleRoom(g.key)}
                    onMouseEnter={() => setHover(g.key)}
                    onMouseLeave={() => setHover(null)}
                  >
                    <span className="category-chevron" aria-hidden="true">
                      {isOpen ? "▾" : "▸"}
                    </span>
                    <span className="x-dot" style={{ background: `hsl(${hueOf(g.wing)} 55% 52%)` }} aria-hidden="true" />
                    {roomLabel(g)} · {g.name}
                    <span className="x-count"> {x.wingName(g.wing)} · {byGroup.get(g.key)?.length}</span>
                  </button>
                </h3>
                {isOpen && (
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
                )}
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
}
