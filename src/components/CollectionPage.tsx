"use client";

import { useMemo, useState } from "react";
import { paintings, searchPaintings } from "@/data/paintings";
import type { Museum } from "@/data/museums";

export function CollectionPage({
  museum,
  onSelect,
}: {
  museum: Museum;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchPaintings(paintings, query), [query]);
  const hasFixtures = paintings.some((p) => p.isFixture);

  return (
    <>
      <header className="masthead">
        <p className="eyebrow">{museum.location}</p>
        <h1>{museum.name}</h1>
        <p className="lede">
          An audio guide to a curated selection of paintings, not the museum&rsquo;s full
          collection.
        </p>
      </header>

      {hasFixtures && (
        <p className="notice" role="note">
          Prototype: the catalog currently contains test placeholders, not real collection objects.
        </p>
      )}

      <section aria-labelledby="collection-heading">
        <h2 id="collection-heading">Selected paintings</h2>
        <label className="search">
          <span className="visually-hidden">Search by title or artist</span>
          <input
            type="search"
            placeholder="Search by title or artist"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>

        {paintings.length === 0 ? (
          <p className="empty">The catalog hasn&rsquo;t been added yet.</p>
        ) : results.length === 0 ? null : (
          <ul className="results">
            {results.map((p) => (
              <li key={p.id}>
                <button className="result" onClick={() => onSelect(p.id)}>
                  <span className="result-title">{p.title}</span>
                  <span className="result-meta">
                    {p.artist}
                    {p.date ? ` · ${p.date}` : ""}
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
