"use client";

import type { Museum } from "@/data/museums";
import { uiStrings, type LanguageCode } from "@/lib/i18n";

/** Favorite museums, newest first, with a link on to the world map. Shared by the front page and the Favorites tab. */
export function FavoritesList({
  museums,
  language,
  onSelect,
  onExplore,
}: {
  museums: Museum[];
  language: LanguageCode;
  onSelect: (id: string) => void;
  onExplore: () => void;
}) {
  const ui = uiStrings[language];
  return (
    <>
      <h2>{ui.favoritesHeading}</h2>
      {museums.length > 0 && (
        <ul className="visit-list">
          {museums.map((m) => (
            <li key={m.id}>
              <button className="result visit-item" onClick={() => onSelect(m.id)}>
                <span className="result-title">{m.name}</span>
                <span className="result-meta">{m.subtitle || `${m.place.city}, ${m.place.country}`}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      <button className="fav-more" onClick={onExplore}>
        {ui.favoritesMore} →
      </button>
    </>
  );
}
