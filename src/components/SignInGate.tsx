"use client";

import { useAuth } from "@/lib/auth";

/** Shown before anything else: a visitor must sign in with Google or continue as a guest. */
export function SignInGate() {
  const { signInWithGoogle, continueAsGuest } = useAuth();

  return (
    <main className="map-shell" lang="en">
      <div className="gate-screen">
        <header className="brand map-brand">
          <h1>Lazy Guide</h1>
          <p className="brand-tag">Audio guides, at your own pace</p>
        </header>
        <div className="gate-choice">
          <button className="gate-primary" onClick={() => signInWithGoogle()}>
            Sign in with Google
          </button>
          <button className="gate-secondary" onClick={() => continueAsGuest()}>
            Continue without an account
          </button>
        </div>
      </div>
    </main>
  );
}
