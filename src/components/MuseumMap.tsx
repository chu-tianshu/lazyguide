"use client";

import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";
import type { Marker } from "leaflet";
import type { Museum } from "@/data/museums";

/** From this zoom on, individual museum icons replace the count badges. */
const ICON_ZOOM = 8;

interface Level {
  /** Zoom below which this grouping is used. */
  below: number;
  key: (m: Museum) => string;
}

// Coarse to fine: continents, then countries, then cities, then icons.
const LEVELS: Level[] = [
  { below: 3, key: (m) => m.place.continent },
  { below: 5, key: (m) => m.place.country },
  { below: ICON_ZOOM, key: (m) => `${m.place.city}, ${m.place.country}` },
];

const WORLD: [[number, number], [number, number]] = [
  [-85, -180],
  [85, 180],
];

const levelFor = (zoom: number) => LEVELS.find((l) => zoom < l.below);

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

/**
 * World map of museums. Zoomed out it shows a count per continent, country, or
 * city; zoomed in, each museum's own icon. The first click on an icon shows the
 * museum's name, the second selects it.
 */
export function MuseumMap({
  museums,
  onSelect,
}: {
  museums: Museum[];
  onSelect: (id: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      const L = (await import("leaflet")).default;
      if (disposed) return;

      const map = L.map(container, {
        zoomControl: false,
        zoomSnap: 0.5,
        worldCopyJump: false,
        maxBoundsViscosity: 1,
        maxBounds: WORLD,
      });
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 18,
        noWrap: true,
        bounds: WORLD,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);

      // Never zoom out past the point where the world fills the view's width.
      // On a tall phone screen the poles may leave a band of sea at the top and bottom.
      const minZoom = Math.ceil(Math.log2(map.getSize().x / 256) * 2) / 2;
      map.setMinZoom(minZoom);
      map.fitBounds(L.latLngBounds(museums.map((m) => [m.place.lat, m.place.lng] as [number, number])).pad(0.3), {
        animate: false,
      });
      if (map.getZoom() < minZoom) map.setZoom(minZoom, { animate: false });
      container.setAttribute("aria-label", "World map of museums. Use plus and minus to zoom.");

      const layer = L.layerGroup().addTo(map);
      const pins = new Map<string, Marker>();
      let previewId: string | null = null;

      const setPreview = (id: string | null) => {
        previewId = id;
        pins.forEach((marker, mid) => {
          marker.getElement()?.querySelector(".map-pin")?.classList.toggle("is-active", mid === id);
          marker.setZIndexOffset(mid === id ? 1000 : 0);
        });
      };

      const draw = () => {
        layer.clearLayers();
        pins.clear();
        const level = levelFor(map.getZoom());

        if (!level) {
          for (const m of museums) {
            const icon = L.divIcon({
              className: "map-pin-wrap",
              iconSize: [48, 48],
              iconAnchor: [24, 24],
              html:
                `<div class="map-pin${previewId === m.id ? " is-active" : ""}">` +
                `<span class="map-pin-glyph"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
                `stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${m.icon}</svg></span>` +
                `<span class="map-pin-label"><strong>${esc(m.name)}</strong>` +
                `<em>${esc(m.subtitle)}</em><small>Click again to enter</small></span></div>`,
            });
            const marker = L.marker([m.place.lat, m.place.lng], {
              icon,
              title: m.name,
              zIndexOffset: previewId === m.id ? 1000 : 0,
            });
            marker.on("click", () => {
              if (previewId === m.id) onSelectRef.current(m.id);
              else setPreview(m.id);
            });
            marker.addTo(layer);
            pins.set(m.id, marker);
          }
          return;
        }

        const groups = new Map<string, Museum[]>();
        for (const m of museums) {
          const key = level.key(m);
          groups.set(key, [...(groups.get(key) ?? []), m]);
        }
        for (const [name, members] of groups) {
          const lat = members.reduce((a, m) => a + m.place.lat, 0) / members.length;
          const lng = members.reduce((a, m) => a + m.place.lng, 0) / members.length;
          const label = `${name}: ${members.length} ${members.length === 1 ? "museum" : "museums"}`;
          const marker = L.marker([lat, lng], {
            title: label,
            icon: L.divIcon({
              className: "map-group-wrap",
              iconSize: [46, 46],
              iconAnchor: [23, 23],
              html: `<div class="map-group"><span>${members.length}</span></div>`,
            }),
          });
          marker.on("click", () => {
            const bounds = L.latLngBounds(members.map((m) => [m.place.lat, m.place.lng] as [number, number]));
            const fitted = map.getBoundsZoom(bounds.pad(0.4));
            const zoom = members.length === 1 ? ICON_ZOOM + 1 : Math.max(level.below, Math.min(fitted, 16));
            map.flyTo(bounds.getCenter(), zoom, { duration: 0.8 });
          });
          marker.addTo(layer);
        }
        previewId = null;
      };

      map.on("zoomend", draw);
      map.on("click", () => setPreview(null));
      map.on("keydown", (e) => {
        if ((e.originalEvent as KeyboardEvent).key === "Escape") setPreview(null);
      });
      draw();

      cleanup = () => map.remove();
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, [museums]);

  return <div ref={containerRef} className="map-canvas" />;
}
