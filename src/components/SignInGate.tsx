"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { htmlLang, uiStrings, type LanguageCode } from "@/lib/i18n";

/** Shown before anything else: a visitor must sign in with Google or continue as a guest. */
export function SignInGate({ language }: { language: LanguageCode }) {
  const { signInWithGoogle, continueAsGuest } = useAuth();
  const [error, setError] = useState<string>();
  const ui = uiStrings[language];

  return (
    <main className="map-shell" lang={htmlLang(language)}>
      <div className="gate-screen">
        <header className="brand map-brand">
          <h1>Lazy Guide</h1>
          <p className="brand-tag">{ui.tagline}</p>
        </header>
        <div className="gate-choice">
          <button className="gate-primary" onClick={() => signInWithGoogle()}>
            {ui.signInGoogle}
          </button>
          <button className="gate-secondary" onClick={async () => setError(await continueAsGuest())}>
            {ui.continueGuest}
          </button>
        </div>
        {error && (
          <p className="muted" role="alert">
            {ui.guestFailed(error)}
          </p>
        )}
      </div>
    </main>
  );
}
