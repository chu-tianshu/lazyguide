"use client";

import { useEffect, useMemo, useState } from "react";
import { searchWorks, type Catalog, type WorkSummary } from "@/data/catalog";
import { fetchSourceNames, searchSources } from "@/lib/catalogApi";
import { strings } from "@/lib/i18n";

export function CollectionPage({
  catalog,
  onSelect,
  onChangeMuseum,
  onAddWorks,
}: {
  catalog: Catalog;
  onSelect: (id: string) => void;
  onChangeMuseum: () => void;
  onAddWorks: (works: WorkSummary[]) => void;
}) {
  const t = strings[catalog.language];
  const [query, setQuery] = useState("");
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
  const sourceList = (sourceNames ?? []).join(catalog.language === "zh" ? "、" : ", ");

  const searchOnline = async () => {
    setOnline({ query: phrase, phase: "searching" });
    try {
      const res = await searchSources(catalog.museumId, catalog.language, phrase);
      if (res.status === "found") {
        onAddWorks(res.works);
        setOnline(null);
      } else {
        setOnline({ query: phrase, phase: res.status === "none" ? "none" : "unavailable" });
      }
    } catch {
      setOnline({ query: phrase, phase: "unavailable" });
    }
  };

  // Works grouped under their category, in the catalog's order. Empty groups are hidden.
  const groups = useMemo(() => {
    const named = catalog.categories
      .map((name) => ({ name, works: results.filter((w) => w.category === name) }))
      .filter((g) => g.works.length > 0);
    const uncategorized = results.filter((w) => !w.category || !catalog.categories.includes(w.category));
    return uncategorized.length ? [...named, { name: "", works: uncategorized }] : named;
  }, [catalog.categories, results]);
  const hasArtists = catalog.works.some((w) => w.artist);
  const placeholder = hasArtists ? t.searchPlaceholderTitleArtist : t.searchPlaceholderTitle;

  return (
    <>
      <button className="back" onClick={onChangeMuseum}>
        {t.changeMuseum}
      </button>

      <header className="masthead">
        <p className="eyebrow">{catalog.museumLocation}</p>
        <h1>{catalog.museumName}</h1>
        <p className="lede">{t.collectionLede}</p>
      </header>

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

        {results.length === 0 && phrase && sourceNames && (
          <div className="online-search" role="status">
            <p className="online-title">{t.noCachedMatch(phrase)}</p>
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

        {groups.map((group) => (
          <div className="category" key={group.name || "other"}>
            {group.name && (
              <h3 className="category-heading">
                {group.name} <span className="category-count">{group.works.length}</span>
              </h3>
            )}
            <ul className="results">
              {group.works.map((w) => (
                <li key={w.id}>
                  <button className="result" onClick={() => onSelect(w.id)}>
                    <span className="result-title">{w.title}</span>
                    <span className="result-meta">
                      {[w.artist, w.facts[0]?.value].filter(Boolean).join(" · ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </section>
    </>
  );
}
