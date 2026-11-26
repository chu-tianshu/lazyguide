"use client";

import { useEffect, useMemo, useState } from "react";
import { searchWorks, type Catalog, type WorkSummary } from "@/data/catalog";
import { museumLocation, museumName } from "@/data/museumNames";
import { factLabel } from "@/data/factLabels";
import { fetchSourceNames, searchSources } from "@/lib/catalogApi";
import { strings, uiStrings, type LanguageCode } from "@/lib/i18n";
import { fetchVisits } from "@/lib/visits";
import { museumHeader } from "@/data/museumImages";
import { LouvreExplorer } from "./LouvreExplorer";
import { PradoExplorer } from "./PradoExplorer";

export function CollectionPage({
  catalog,
  uiLanguage,
  onSelect,
  onAddWorks,
  favorite,
  onToggleFavorite,
}: {
  catalog: Catalog;
  /** The visitor's language: the page's own text. The catalog may be in another one. */
  uiLanguage: LanguageCode;
  onSelect: (id: string) => void;
  onAddWorks: (works: WorkSummary[]) => void;
  favorite: boolean;
  onToggleFavorite: () => void;
}) {
  const t = strings[uiLanguage];
  const ui = uiStrings[uiLanguage];
  const title = museumName(catalog.museumId, uiLanguage) ?? catalog.museumName;
  const location = museumLocation(catalog.museumId, uiLanguage) ?? catalog.museumLocation;
  const header = museumHeader(catalog.museumId);
  const [query, setQuery] = useState("");
  // Works the signed-in visitor has already opened a guide for.
  const [visited, setVisited] = useState<Set<string>>(new Set());
  useEffect(() => {
    let current = true;
    fetchVisits().then(
      (vs) =>
        current && setVisited(new Set(vs.filter((v) => v.museumId === catalog.museumId).map((v) => v.workId))),
      () => {},
    );
    return () => {
      current = false;
    };
  }, [catalog.museumId]);
  const results = useMemo(() => searchWorks(catalog.works, query), [catalog.works, query]);

  // Online search, offered when the typed phrase matches nothing in the cached catalog.
  const [sourceNames, setSourceNames] = useState<string[] | null>(null);
  const [online, setOnline] = useState<{ query: string; phase: "searching" | "none" | "unavailable" } | null>(null);
  useEffect(() => {
    let current = true;
    fetchSourceNames(catalog.museumId).then(
      (names) => current && setSourceNames(names),
      () => current && setSourceNames([]),
    );
    return () => {
      current = false;
    };
  }, [catalog.museumId]);

  const phrase = query.trim();
  // An outcome belongs to the phrase it was for; typing something else makes the offer fresh.
  const outcome = online && online.query === phrase ? online.phase : null;
  const sourceList = (sourceNames ?? []).join(ui.listSeparator);

  const searchOnline = async () => {
    setOnline({ query: phrase, phase: "searching" });
    try {
      const res = await searchSources(catalog.museumId, catalog.language, phrase);
      if (res.status === "found") {
        const have = new Set(catalog.works.map((w) => w.id));
        if (res.works.every((w) => have.has(w.id))) {
          // Everything found is already listed, so nothing is added.
          setOnline({ query: phrase, phase: "none" });
        } else {
          onAddWorks(res.works);
          setOnline(null);
        }
      } else {
        setOnline({ query: phrase, phase: res.status === "none" ? "none" : "unavailable" });
      }
    } catch {
      setOnline({ query: phrase, phase: "unavailable" });
    }
  };

  // Works grouped under their category, in the catalog's order. Empty groups are hidden.
  const groups = useMemo(() => {
    // Categories that came with newly searched works are listed after the catalog's own.
    const all = [...catalog.categories];
    for (const w of catalog.works) if (w.category && !all.includes(w.category)) all.push(w.category);
    const named = all
      .map((name) => ({ name, works: results.filter((w) => w.category === name) }))
      .filter((g) => g.works.length > 0);
    const uncategorized = results.filter((w) => !w.category);
    return uncategorized.length ? [...named, { name: "", works: uncategorized }] : named;
  }, [catalog.categories, catalog.works, results]);
  // Categories are collapsed until clicked; a search shows its matches expanded.
  const [open, setOpen] = useState<Set<string>>(new Set());
  const toggle = (name: string) =>
    setOpen((prev) => {
      const next = new Set(prev);
      if (!next.delete(name)) next.add(name);
      return next;
    });
  const hasArtists = catalog.works.some((w) => w.artist);
  const placeholder = hasArtists ? t.searchPlaceholderTitleArtist : t.searchPlaceholderTitle;

  return (
    <>
      {header && (
        <figure className="museum-header">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={header.src} alt={title} loading="eager" />
          <figcaption>
            <a href={header.creditUrl} target="_blank" rel="noreferrer">
              {ui.photoCredit}
            </a>
          </figcaption>
        </figure>
      )}

      <header className="masthead">
        <p className="eyebrow">{location}</p>
        <h1>
          {title}
          <button
            className={`fav-btn${favorite ? " on" : ""}`}
            aria-pressed={favorite}
            aria-label={favorite ? ui.removeFavorite : ui.addFavorite}
            title={favorite ? ui.removeFavorite : ui.addFavorite}
            onClick={onToggleFavorite}
          >
            <svg viewBox="0 0 24 24" width="22" height="22" fill={favorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />
            </svg>
          </button>
        </h1>
      </header>

      {/* The Louvre explorer's wing and level controls render here, under the title. */}
      {catalog.museumId === "louvre" && !phrase && <div id="louvre-controls" />}

      <section aria-labelledby="collection-heading">
        <h2 id="collection-heading">{t.collectionHeading}</h2>
        <label className="search">
          <span className="visually-hidden">{placeholder}</span>
          <input
            type="search"
            placeholder={placeholder}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        {phrase && sourceNames && (results.length === 0 || sourceNames.length > 0) && (
          <div className="online-search" role="status">
            <p className="online-title">{results.length === 0 ? t.noCachedMatch(phrase) : t.moreMatches(phrase)}</p>
            {sourceNames.length === 0 ? (
              <p className="muted">{t.searchNoSource}</p>
            ) : outcome === "none" ? (
              <p className="muted">{t.searchNone(phrase, sourceList)}</p>
            ) : (
              <>
                <p className="muted">{outcome === "unavailable" ? t.searchUnavailable : t.searchOffer(sourceList)}</p>
                <button className="online-button" onClick={searchOnline} disabled={outcome === "searching"}>
                  {outcome === "searching" ? t.searching : t.searchOnline}
                </button>
              </>
            )}
          </div>
        )}

        {/* The Louvre and the Prado are browsed by room; a search falls back to the plain list below. */}
        {catalog.museumId === "louvre" && !phrase && (
          <LouvreExplorer language={uiLanguage} works={catalog.works} visited={visited} onSelect={onSelect} />
        )}

        {catalog.museumId === "prado" && !phrase && (
          <PradoExplorer language={uiLanguage} works={catalog.works} visited={visited} onSelect={onSelect} />
        )}

        {!((catalog.museumId === "louvre" || catalog.museumId === "prado") && !phrase) && groups.map((group) => (
          <div className="category" key={group.name || "other"}>
            {group.name && (
              <h3 className="category-heading">
                <button
                  className="category-toggle"
                  aria-expanded={open.has(group.name) || !!phrase}
                  onClick={() => toggle(group.name)}
                >
                  <span className="category-chevron" aria-hidden="true">
                    {open.has(group.name) || phrase ? "▾" : "▸"}
                  </span>
                  {group.name} <span className="category-count">{group.works.length}</span>
                </button>
              </h3>
            )}
            {(!group.name || open.has(group.name) || phrase) && <ul className="results">
              {group.works.map((w) => (
                <li key={w.id}>
                  <button className="result" onClick={() => onSelect(w.id)}>
                    <span className="result-title">
                      {w.title}
                      {visited.has(w.id) && (
                        <span className="visited-mark" role="img" aria-label={ui.visited} title={ui.visited}>
                          ✓
                        </span>
                      )}
                    </span>
                    <span className="result-meta">
                      {[w.artist, w.facts[0]?.value].filter(Boolean).join(" · ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>}
          </div>
        ))}
      </section>
    </>
  );
}
