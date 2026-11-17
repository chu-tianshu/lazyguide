"use client";

import { useMemo, useState } from "react";
import { searchWorks, type Catalog } from "@/data/catalog";
import { strings } from "@/lib/i18n";

export function CollectionPage({
  catalog,
  onSelect,
  onChangeMuseum,
}: {
  catalog: Catalog;
  onSelect: (id: string) => void;
  onChangeMuseum: () => void;
}) {
  const t = strings[catalog.language];
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchWorks(catalog.works, query), [catalog.works, query]);
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

        {results.length > 0 && (
          <ul className="results">
            {results.map((w) => (
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
        )}
      </section>
    </>
  );
}
