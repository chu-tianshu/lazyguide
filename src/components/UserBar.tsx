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
      <path d="M9.75 4.74 L10.27 1.95 L13.73 1.95 L14.25 4.74 L15.55 5.28 L17.89 3.67 L20.33 6.11 L18.72 8.45 L19.26 9.75 L22.05 10.27 L22.05 13.73 L19.26 14.25 L18.72 15.55 L20.33 17.89 L17.89 20.33 L15.55 18.72 L14.25 19.26 L13.73 22.05 L10.27 22.05 L9.75 19.26 L8.45 18.72 L6.11 20.33 L3.67 17.89 L5.28 15.55 L4.74 14.25 L1.95 13.73 L1.95 10.27 L4.74 9.75 L5.28 8.45 L3.67 6.11 L6.11 3.67 L8.45 5.28z" />
      <circle cx="12" cy="12" r="3" />
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
      <IconButton icon="favorites" label={ui.favoritesTab} onClick={onShowFavorites} />
      <IconButton icon="visits" label={ui.myVisits} onClick={onShowVisits} />
      <IconButton icon="map" label={ui.mapTab} onClick={onShowMap} />
      <IconButton icon="settings" label={ui.settings} onClick={onShowSettings} />
    </div>
  );
}
