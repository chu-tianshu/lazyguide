"use client";

import { useEffect, useMemo, useState } from "react";
import type { Work } from "@/data/catalog";
import { strings, type LanguageCode } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { recordVisit } from "@/lib/visits";
import { track } from "@/lib/analytics";
import { cachedGuide, exploreTopic, generateGuide, lookupGuide, type GeneratedGuide } from "@/lib/generatedGuides";
import { OPTION_LABELS, topicsKey, type Preferences } from "@/lib/preferences";
import { GuidePlayer, type Section } from "./GuidePlayer";
import { FollowUpPanel } from "./FollowUpPanel";

type Effort = "low" | "high";
/** "full" is a museum's own single text; it has no depths or expansion. */
type Mode = Effort | "full" | "custom";

function prefsSummary(p: Preferences): string {
  return [
    OPTION_LABELS.length[p.length].title,
    OPTION_LABELS.style[p.style].title,
    ...p.topics.map((x) => OPTION_LABELS.topic[x].title),
  ].join(" · ");
}

export function PaintingDetail({
  work,
  museumId,
  language,
  textCredit,
  preferences,
  onChangePreferences,
  onBack,
}: {
  work: Work;
  museumId: string;
  language: LanguageCode;
  textCredit?: string;
  /** The visitor's saved preferences; null when they could not be loaded. */
  preferences: Preferences | null;
  onChangePreferences: () => void;
  onBack: () => void;
}) {
  const t = strings[language];
  const { user } = useAuth();
  const [effort, setEffort] = useState<Effort | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [expandToken, setExpandToken] = useState(0);
  const [listenedText, setListenedText] = useState("");
  // A generated guide, with the preferences it was written for.
  const [custom, setCustom] = useState<(GeneratedGuide & { summary: string }) | null>(() => {
    const g = preferences ? cachedGuide(museumId, work.id, language, preferences) : null;
    return g && preferences ? { ...g, summary: prefsSummary(preferences) } : null;
  });
  // Extra segments the visitor asked for from the suggested angles, in the order they were requested.
  const [explored, setExplored] = useState<Array<{ topic: string; text: string }>>([]);
  const [exploring, setExploring] = useState<string | null>(null);
  const [exploreError, setExploreError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [customShown, setCustomShown] = useState(() => custom !== null);

  const guide = work.guide;
  const isSingle = "text" in guide;
  const unavailable = "unavailable" in guide && guide.unavailable === true;
  const mode: Mode | null = customShown && custom ? "custom" : isSingle ? "full" : effort;

  const sections: Section[] | null = useMemo(() => {
    if (customShown && custom) return [{ text: custom.text }];
    if (unavailable) return null;
    if ("text" in guide) return [{ text: guide.text }];
    if (effort === "high") return [{ text: guide.long }];
    if (effort === "low") {
      const list: Section[] = [{ text: guide.short }];
      if (expanded) list.push({ heading: t.anotherAngle, text: guide.expansion });
      return list;
    }
    return null;
  }, [effort, expanded, guide, unavailable, t.anotherAngle, customShown, custom]);

  const chooseEffort = (next: Effort) => {
    setCustomShown(false);
    setEffort(next);
    setExpanded(false);
    setExpandToken(0);
  };

  const expand = () => {
    track("expand", { museumId, workId: work.id, language });
    setExpanded(true);
    setExpandToken((n) => n + 1);
  };

  const prefsKey = preferences
    ? `${preferences.length}|${preferences.style}|${topicsKey(preferences.topics)}`
    : null;

  // If a guide was already generated for exactly these preferences, show it without a click.
  useEffect(() => {
    if (!preferences || !user) return;
    let cancelled = false;
    lookupGuide(museumId, work.id, preferences.language, preferences)
      .then((g) => {
        if (cancelled || !g) return;
        setCustom({ ...g, summary: prefsSummary(preferences) });
        setExplored([]);
        setCustomShown(true);
        setExpanded(false);
        setExpandToken(0);
      })
      .catch((err) => {
        // Best effort: the visitor can still press the generate button.
        console.warn("guide lookup failed:", err);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefsKey, museumId, work.id, user]);

  // Reuses the stored guide for the visitor's exact combination, or has one written.
  async function generate() {
    if (!preferences || generating) return;
    setGenerating(true);
    setGenError(null);
    try {
      const g = await generateGuide(museumId, work.id, preferences.language, preferences);
      setCustom({ ...g, summary: prefsSummary(preferences) });
      setExplored([]);
      setCustomShown(true);
      setExpanded(false);
      setExpandToken(0);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : t.errors.failed);
    } finally {
      setGenerating(false);
    }
  }

  async function explore(topic: string) {
    if (!custom || exploring || !preferences) return;
    setExploring(topic);
    setExploreError(null);
    // Everything heard so far, so the model does not repeat it.
    const covered = [custom.text, ...explored.map((x) => `[${x.topic}]\n${x.text}`)].join("\n\n");
    try {
      const text = await exploreTopic(museumId, work.id, preferences.language, topic, covered);
      track("explore_topic", { museumId, workId: work.id, language: preferences.language });
      setExplored((prev) => [...prev, { topic, text }]);
    } catch (err) {
      setExploreError(err instanceof Error ? err.message : t.errors.failed);
    } finally {
      setExploring(null);
    }
  }

  const currentSummary = preferences ? prefsSummary(preferences) : null;
  // The button is only needed until a guide exists for the current preferences.
  const hasGuideForPrefs = custom !== null && custom.summary === currentSummary;
  const remainingTopics = custom
    ? custom.suggestions.filter((s) => !explored.some((x) => x.topic === s))
    : [];

  // Counts as "visited" once the guide actually has something to show.
  useEffect(() => {
    if (!sections || !user) return;
    recordVisit(museumId, work.id);
  }, [sections, user, museumId, work.id]);

  useEffect(() => {
    if (user) track("work_view", { museumId, workId: work.id, language });
    // One view per time the work is opened.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, museumId, work.id]);

  return (
    <article>
      <div className="back-bar">
        <button className="back-large" onClick={onBack}>
          {t.backToCollection}
        </button>
      </div>

      {work.image ? (
        <figure className="artwork">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={work.image.src}
            alt={work.artist ? `${work.title} — ${work.artist}` : work.title}
          />
          <figcaption>
            {t.imageCredit}:{" "}
            <a href={work.image.sourceUrl} target="_blank" rel="noreferrer">
              {work.image.sourceLabel ?? t.commons}
            </a>{" "}
            {work.image.author && <> · {work.image.author}</>} · {work.image.license}
          </figcaption>
        </figure>
      ) : (
        <div className="placeholder-art" aria-hidden="true" />
      )}

      <header className="detail-head">
        <h1>{work.title}</h1>
        {work.subtitle && (
          <p className="native-title" lang={/[\u3400-\u9fff]/.test(work.subtitle) ? "zh-Hans" : undefined}>
            {work.subtitle}
          </p>
        )}
        {work.artist && <p className="artist">{work.artist}</p>}
      </header>

      {work.facts.length > 0 && (
        <dl className="meta">
          {work.facts.map((f) => (
            <div key={f.label}>
              <dt>{f.label}</dt>
              <dd>{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {work.objectUrl && (
        <p className="object-link">
          <a href={work.objectUrl} target="_blank" rel="noreferrer">
            {t.viewOnMuseum}
          </a>
        </p>
      )}

      <section className="guide" aria-labelledby="guide-heading">
        <h2 id="guide-heading">{t.audioGuide}</h2>
        {unavailable && !custom && <p className="invite-note">{t.guideUnavailable}</p>}
        {!isSingle && (
        <div className="effort-choice" role="group" aria-label={t.guideDepth}>
          <button aria-pressed={effort === "low"} onClick={() => chooseEffort("low")}>
            <strong>{t.lowTitle}</strong>
            <span>{t.lowDesc}</span>
          </button>
          <button aria-pressed={effort === "high"} onClick={() => chooseEffort("high")}>
            <strong>{t.highTitle}</strong>
            <span>{t.highDesc}</span>
          </button>
        </div>
        )}

        {sections && (
          <>
            <GuidePlayer
              key={`${work.id}-${mode}-${mode === "custom" ? custom?.text.length : ""}`}
              sections={sections}
              language={mode === "custom" && preferences ? preferences.language : language}
              track={{ museumId, workId: work.id }}
              onListenedChange={setListenedText}
              jumpTo={expandToken ? { section: 1, token: expandToken } : undefined}
            />
            {isSingle && (guide.credit ?? textCredit) && (
              <p className="text-credit">{guide.credit ?? textCredit}</p>
            )}
            {mode === "custom" && custom && <p className="text-credit">{t.yourGuideNote(custom.summary)}</p>}
            {mode === "low" && !expanded && (
              <button className="expand" onClick={expand}>
                {t.expand}
              </button>
            )}
          </>
        )}

        {preferences && (
          <div className={`personal-guide${unavailable && !custom ? " invite" : ""}`}>
            <div className="personal-actions">
              {!hasGuideForPrefs && (
                <button className="expand" onClick={generate} disabled={generating}>
                  {generating ? t.generating : unavailable ? t.generateGuide : t.rewriteGuide}
                </button>
              )}
              {custom && !unavailable && (
                <button className="user-link" onClick={() => setCustomShown((v) => !v)}>
                  {customShown ? t.showOriginal : t.showYours}
                </button>
              )}
              <button className="user-link" onClick={onChangePreferences}>
                {t.changePrefs}
              </button>
            </div>
            {generating && (
              <p className="muted" role="status">
                {t.generatingNote}
              </p>
            )}
            {genError && (
              <p className="notice" role="alert">
                {genError}
              </p>
            )}
          </div>
        )}
      </section>

      {custom && (explored.length > 0 || remainingTopics.length > 0) && (
        <section className="explore" aria-labelledby="explore-heading">
          <h2 id="explore-heading">{t.exploreHeading}</h2>
          {explored.map((x) => (
            <div key={x.topic} className="explored">
              <h3>{x.topic}</h3>
              <GuidePlayer sections={[{ text: x.text }]} language={preferences?.language ?? language} autoPlay={x === explored[explored.length - 1]} />
            </div>
          ))}
          {remainingTopics.length > 0 && (
            <div className="explore-chips" role="group" aria-label={t.exploreHeading}>
              {remainingTopics.map((topic) => (
                <button key={topic} onClick={() => explore(topic)} disabled={exploring !== null}>
                  {exploring === topic ? t.exploring : topic}
                </button>
              ))}
            </div>
          )}
          {exploreError && (
            <p className="notice" role="alert">
              {exploreError}
            </p>
          )}
        </section>
      )}

      {mode && (!unavailable || mode === "custom") && (
        <FollowUpPanel
          museumId={museumId}
          language={mode === "custom" && preferences ? preferences.language : language}
          workId={work.id}
          effort={mode}
          listenedText={listenedText}
        />
      )}
    </article>
  );
}
