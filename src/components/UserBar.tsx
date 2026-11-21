"use client";

import { useAuth } from "@/lib/auth";

/** Only ever rendered once AppContent has confirmed a user is signed in (Google or guest). */
export function UserBar({ onShowVisits, onShowSettings }: { onShowVisits: () => void; onShowSettings: () => void }) {
  const { user, signOut } = useAuth();
  if (!user) return null;

  const name = user.is_anonymous
    ? "Guest"
    : (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Signed in";
  const avatar = user.user_metadata?.avatar_url as string | undefined;

  return (
    <div className="user-bar">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {avatar ? <img className="user-avatar" src={avatar} alt="" /> : null}
      <span className="user-name">{name}</span>
      <button className="user-link" onClick={onShowVisits}>
        My visits
      </button>
      <button className="user-link" onClick={onShowSettings}>
        Settings
      </button>
      <button className="user-link" onClick={() => signOut()}>
        Sign out
      </button>
    </div>
  );
}
