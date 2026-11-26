"use client";

import { useEffect, useState } from "react";
import { languages } from "@/data/languages";
import { uiStrings, htmlLang, type LanguageCode } from "@/lib/i18n";
import { LanguageFlag } from "./LanguageFlag";

/** A random index other than `not`, so the heading never shows the same word twice in a row. */
function nextIndex(not: number): number {
  const n = languages.length;
  return (not + 1 + Math.floor(Math.random() * (n - 1))) % n;
}

/**
 * First-run screen: the visitor picks a language and nothing else. It carries no text of its own
 * language: the heading cycles through the word "language" in every supported language, and each
 * choice is named in its own script.
 */
export function LanguageSelect({
  onChoose,
}: {
  /** Saves the choice. Rejects when it could not be saved. */
  onChoose: (language: LanguageCode) => Promise<void>;
}) {
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState<LanguageCode | null>(null);
  // Shown in the language that was just chosen, so it is readable.
  const [failed, setFailed] = useState<LanguageCode | null>(null);

  useEffect(() => {
    // Start from a random word, then rotate.
    setIndex(Math.floor(Math.random() * languages.length));
    const id = setInterval(() => setIndex((i) => nextIndex(i)), 2200);
    return () => clearInterval(id);
  }, []);

  const word = languages[index];

  async function choose(code: LanguageCode) {
    if (busy) return;
    setBusy(code);
    setFailed(null);
    try {
      await onChoose(code);
    } catch {
      setFailed(code);
      setBusy(null);
    }
  }

  return (
    <main className="shell lang-select">
      <h1 className="lang-word" aria-live="off">
        <span key={word.code} lang={htmlLang(word.code)} className="lang-word-text">
          {word.word}
        </span>
      </h1>
      <div className="pref-grid lang-grid" role="group">
        {languages.map((l) => (
          <button key={l.code} lang={htmlLang(l.code)} disabled={busy !== null} aria-busy={busy === l.code} onClick={() => choose(l.code)}>
            <LanguageFlag code={l.code} className="flag" />
            <strong>{l.label}</strong>
          </button>
        ))}
      </div>
      {failed && (
        <p className="notice" role="alert" lang={htmlLang(failed)}>
          {uiStrings[failed].saveFailed}
        </p>
      )}
    </main>
  );
}
