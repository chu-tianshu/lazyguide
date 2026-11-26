"use client";

import { useAuth } from "@/lib/auth";
import { uiStrings, type LanguageCode } from "@/lib/i18n";

/** Only ever rendered once AppContent has confirmed a user is signed in (Google or guest). */
export function UserBar({
  language,
  onShowVisits,
  onShowFavorites,
  onShowSettings,
}: {
  language: LanguageCode;
  onShowVisits: () => void;
  onShowFavorites: () => void;
  onShowSettings: () => void;
}) {
  const { user } = useAuth();
  const ui = uiStrings[language];
  if (!user) return null;

  return (
    <div className="user-bar">
      <button className="user-link" onClick={onShowVisits}>
        {ui.myVisits}
      </button>
      <button className="user-link" onClick={onShowFavorites}>
        {ui.favoritesTab}
      </button>
      <button className="user-link" onClick={onShowSettings}>
        {ui.settings}
      </button>
    </div>
  );
}
