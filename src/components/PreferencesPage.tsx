"use client";

import { useState } from "react";
import { languages } from "@/data/languages";
import { CnFlag } from "./CnFlag";
import { UsFlag } from "./UsFlag";
import {
  DEFAULT_PREFERENCES,
  LENGTHS,
  OPTION_LABELS,
  STYLES,
  TOPICS,
  savePreferences,
  type GuideTopic,
  type Preferences,
} from "@/lib/preferences";

/**
 * Length, style and topics for generated guides. Shown once after a visitor's first sign-in
 * (`onboarding`), and any time later from the settings link.
 */
export function PreferencesPage({
  initial,
  onboarding,
  onSaved,
  onBack,
}: {
  initial: Partial<Preferences> | null;
  onboarding: boolean;
  onSaved: (prefs: Preferences) => void;
  onBack?: () => void;
}) {
  const [prefs, setPrefs] = useState<Preferences>(() => ({
    ...DEFAULT_PREFERENCES,
    // A first-time visitor starts from their browser's language.
    language: typeof navigator !== "undefined" && navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en",
    ...initial,
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string>();

  const toggleTopic = (topic: GuideTopic) =>
    setPrefs((p) => ({
      ...p,
      topics: p.topics.includes(topic) ? p.topics.filter((t) => t !== topic) : [...p.topics, topic],
    }));

  async function save() {
    setSaving(true);
    setError(undefined);
    try {
      await savePreferences(prefs);
      onSaved(prefs);
    } catch {
      setError("Couldn’t save your preferences. Please try again.");
      setSaving(false);
    }
  }

  return (
    <main className="shell" lang="en">
      {!onboarding && onBack && (
        <button className="back" onClick={onBack}>
          ← All museums
        </button>
      )}

      <header className="masthead">
        <h1>{onboarding ? "How would you like your guides?" : "Settings"}</h1>
        <p className="muted">
          {onboarding
            ? "Choose once; you can change this any time. These shape the guides we write for you."
            : "Guide preferences. They apply to guides you generate or rewrite."}
        </p>
      </header>

      <section className="pref-section" aria-labelledby="pref-language">
        <h2 id="pref-language">Language · 语言</h2>
        <p className="muted">For guide pages and guides. If a museum has no guides in this language, we show what it has.</p>
        <div className="pref-grid" role="radiogroup" aria-labelledby="pref-language">
          {languages.map((l) => (
            <button
              key={l.code}
              role="radio"
              aria-checked={prefs.language === l.code}
              onClick={() => setPrefs((p) => ({ ...p, language: l.code }))}
              lang={l.code === "zh" ? "zh-Hans" : "en"}
            >
              {l.code === "zh" ? <CnFlag className="flag" /> : <UsFlag className="flag" />}
              <strong>{l.label}</strong>
              <span>{l.subtitle}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="pref-section" aria-labelledby="pref-length">
        <h2 id="pref-length">Length</h2>
        <div className="pref-grid" role="radiogroup" aria-labelledby="pref-length">
          {LENGTHS.map((v) => (
            <button
              key={v}
              role="radio"
              aria-checked={prefs.length === v}
              onClick={() => setPrefs((p) => ({ ...p, length: v }))}
            >
              <strong>{OPTION_LABELS.length[v].title}</strong>
              <span>{OPTION_LABELS.length[v].desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="pref-section" aria-labelledby="pref-style">
        <h2 id="pref-style">Style</h2>
        <div className="pref-grid" role="radiogroup" aria-labelledby="pref-style">
          {STYLES.map((v) => (
            <button
              key={v}
              role="radio"
              aria-checked={prefs.style === v}
              onClick={() => setPrefs((p) => ({ ...p, style: v }))}
            >
              <strong>{OPTION_LABELS.style[v].title}</strong>
              <span>{OPTION_LABELS.style[v].desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="pref-section" aria-labelledby="pref-topics">
        <h2 id="pref-topics">Topics</h2>
        <p className="muted">Pick one or more.</p>
        <div className="pref-grid" role="group" aria-labelledby="pref-topics">
          {TOPICS.map((v) => (
            <button key={v} role="checkbox" aria-checked={prefs.topics.includes(v)} onClick={() => toggleTopic(v)}>
              <strong>{OPTION_LABELS.topic[v].title}</strong>
              <span>{OPTION_LABELS.topic[v].desc}</span>
            </button>
          ))}
        </div>
      </section>

      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}

      <button className="gate-primary pref-save" onClick={save} disabled={saving || prefs.topics.length === 0}>
        {saving ? "Saving…" : onboarding ? "Save and continue" : "Save"}
      </button>
      {prefs.topics.length === 0 && <p className="muted">Choose at least one topic.</p>}
    </main>
  );
}
