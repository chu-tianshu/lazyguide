"use client";

import { useState } from "react";
import { languages } from "@/data/languages";
import { browserLanguage, uiStrings } from "@/lib/i18n";
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
    language: browserLanguage(),
    ...initial,
  }));
  const ui = uiStrings[prefs.language];
  const labels = OPTION_LABELS[prefs.language];
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
      setError(uiStrings[prefs.language].saveFailed);
      setSaving(false);
    }
  }

  return (
    <main className="shell" lang={prefs.language === "zh" ? "zh-Hans" : "en"}>
      {!onboarding && onBack && (
        <button className="back" onClick={onBack}>
          {ui.allMuseums}
        </button>
      )}

      <header className="masthead">
        <h1>{onboarding ? ui.prefsOnboardingTitle : ui.prefsSettingsTitle}</h1>
        <p className="muted">
          {onboarding ? ui.prefsOnboardingNote : ui.prefsSettingsNote}
        </p>
      </header>

      <section className="pref-section" aria-labelledby="pref-language">
        <h2 id="pref-language">{ui.prefLanguage}</h2>
        <p className="muted">{ui.prefLanguageNote}</p>
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
        <h2 id="pref-length">{ui.prefLength}</h2>
        <div className="pref-grid" role="radiogroup" aria-labelledby="pref-length">
          {LENGTHS.map((v) => (
            <button
              key={v}
              role="radio"
              aria-checked={prefs.length === v}
              onClick={() => setPrefs((p) => ({ ...p, length: v }))}
            >
              <strong>{labels.length[v].title}</strong>
              <span>{labels.length[v].desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="pref-section" aria-labelledby="pref-style">
        <h2 id="pref-style">{ui.prefStyle}</h2>
        <div className="pref-grid" role="radiogroup" aria-labelledby="pref-style">
          {STYLES.map((v) => (
            <button
              key={v}
              role="radio"
              aria-checked={prefs.style === v}
              onClick={() => setPrefs((p) => ({ ...p, style: v }))}
            >
              <strong>{labels.style[v].title}</strong>
              <span>{labels.style[v].desc}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="pref-section" aria-labelledby="pref-topics">
        <h2 id="pref-topics">{ui.prefTopics}</h2>
        <p className="muted">{ui.prefTopicsNote}</p>
        <div className="pref-grid" role="group" aria-labelledby="pref-topics">
          {TOPICS.map((v) => (
            <button key={v} role="checkbox" aria-checked={prefs.topics.includes(v)} onClick={() => toggleTopic(v)}>
              <strong>{labels.topic[v].title}</strong>
              <span>{labels.topic[v].desc}</span>
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
        {saving ? ui.saving : onboarding ? ui.saveContinue : ui.save}
      </button>
      {prefs.topics.length === 0 && <p className="muted">{ui.prefTopicsMin}</p>}
    </main>
  );
}
