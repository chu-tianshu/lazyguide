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
  const { user, signOut } = useAuth();
  const ui = uiStrings[language];
  if (!user) return null;

  const name = user.is_anonymous
    ? ui.guest
    : (user.user_metadata?.full_name as string | undefined) ?? user.email ?? ui.signedIn;
  const avatar = user.user_metadata?.avatar_url as string | undefined;

  return (
    <div className="user-bar">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {avatar ? <img className="user-avatar" src={avatar} alt="" /> : null}
      <span className="user-name">{name}</span>
      <button className="user-link" onClick={onShowVisits}>
        {ui.myVisits}
      </button>
      <button className="user-link" onClick={onShowFavorites}>
        {ui.favoritesTab}
      </button>
      <button className="user-link" onClick={onShowSettings}>
        {ui.settings}
      </button>
      <button className="user-link" onClick={() => signOut()}>
        {ui.signOut}
      </button>
    </div>
  );
}
