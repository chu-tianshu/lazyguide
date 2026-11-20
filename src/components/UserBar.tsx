"use client";

import { useAuth } from "@/lib/auth";

export function UserBar({ onShowVisits }: { onShowVisits: () => void }) {
  const { user, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) return null;

  if (!user) {
    return (
      <div className="user-bar">
        <button className="user-signin" onClick={() => signInWithGoogle()}>
          Sign in with Google
        </button>
      </div>
    );
  }

  const name = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Signed in";
  const avatar = user.user_metadata?.avatar_url as string | undefined;

  return (
    <div className="user-bar">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {avatar ? <img className="user-avatar" src={avatar} alt="" /> : null}
      <span className="user-name">{name}</span>
      <button className="user-link" onClick={onShowVisits}>
        My visits
      </button>
      <button className="user-link" onClick={() => signOut()}>
        Sign out
      </button>
    </div>
  );
}
