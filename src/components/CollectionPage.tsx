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
