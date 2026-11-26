"use client";

import { useAuth } from "@/lib/auth";
import { uiStrings, type LanguageCode } from "@/lib/i18n";

const ICONS = {
  map: (
    <>
      <path d="M9 4 3 6v14l6-2 6 2 6-2V4l-6 2z" />
      <path d="M9 4v14M15 6v14" />
    </>
  ),
  visits: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  favorites: <path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z" />,
  settings: (
    <>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1 7 17M17 7l2.1-2.1" />
      <circle cx="12" cy="12" r="7" />
    </>
  ),
};

function IconButton({ icon, label, onClick }: { icon: keyof typeof ICONS; label: string; onClick: () => void }) {
  return (
    <button className="user-link" aria-label={label} title={label} onClick={onClick}>
      <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        {ICONS[icon]}
      </svg>
    </button>
  );
}

/** Only ever rendered once AppContent has confirmed a user is signed in (Google or guest). */
export function UserBar({
  language,
  onShowMap,
  onShowVisits,
  onShowFavorites,
  onShowSettings,
}: {
  language: LanguageCode;
  onShowMap: () => void;
  onShowVisits: () => void;
  onShowFavorites: () => void;
  onShowSettings: () => void;
}) {
  const { user } = useAuth();
  const ui = uiStrings[language];
  if (!user) return null;

  return (
    <div className="user-bar">
      <IconButton icon="map" label={ui.mapTab} onClick={onShowMap} />
      <IconButton icon="visits" label={ui.myVisits} onClick={onShowVisits} />
      <IconButton icon="favorites" label={ui.favoritesTab} onClick={onShowFavorites} />
      <IconButton icon="settings" label={ui.settings} onClick={onShowSettings} />
    </div>
  );
}
