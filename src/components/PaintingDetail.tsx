"use client";

import { useEffect, useMemo, useState } from "react";
import type { Work } from "@/data/catalog";
import { strings, type LanguageCode } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { recordVisit } from "@/lib/visits";
import { GuidePlayer, type Section } from "./GuidePlayer";
import { FollowUpPanel } from "./FollowUpPanel";

type Effort = "low" | "high";
/** "full" is a museum's own single text; it has no depths or expansion. */
type Mode = Effort | "full";

export function PaintingDetail({
  work,
  museumId,
  language,
  textCredit,
  onBack,
}: {
  work: Work;
  museumId: string;
  language: LanguageCode;
  textCredit?: string;
  onBack: () => void;
}) {
  const t = strings[language];
  const { user } = useAuth();
  const [effort, setEffort] = useState<Effort | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [expandToken, setExpandToken] = useState(0);
  const [listenedText, setListenedText] = useState("");

  const guide = work.guide;
  const isSingle = "text" in guide;
  const unavailable = "unavailable" in guide && guide.unavailable === true;
  const mode: Mode | null = isSingle ? "full" : effort;

  const sections: Section[] | null = useMemo(() => {
    if (unavailable) return null;
    if ("text" in guide) return [{ text: guide.text }];
    if (effort === "high") return [{ text: guide.long }];
    if (effort === "low") {
      const list: Section[] = [{ text: guide.short }];
      if (expanded) list.push({ heading: t.anotherAngle, text: guide.expansion });
      return list;
    }
    return null;
  }, [effort, expanded, guide, unavailable, t.anotherAngle]);

  const chooseEffort = (next: Effort) => {
    setEffort(next);
    setExpanded(false);
    setExpandToken(0);
  };

  const expand = () => {
    setExpanded(true);
    setExpandToken((n) => n + 1);
  };

  // Counts as "visited" once the guide actually has something to show.
  useEffect(() => {
    if (!sections || !user) return;
    recordVisit(museumId, work.id);
  }, [sections, user, museumId, work.id]);

  return (
    <article>
      <button className="back" onClick={onBack}>
        {t.backToCollection}
      </button>

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
          <p className="native-title" lang="zh-Hans">
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
        {unavailable && <p className="muted">{t.guideUnavailable}</p>}
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
              key={`${work.id}-${mode}`}
              sections={sections}
              language={language}
              onListenedChange={setListenedText}
              jumpTo={expandToken ? { section: 1, token: expandToken } : undefined}
            />
            {textCredit && isSingle && <p className="text-credit">{textCredit}</p>}
            {effort === "low" && !expanded && (
              <button className="expand" onClick={expand}>
                {t.expand}
              </button>
            )}
          </>
        )}
      </section>

      {mode && !unavailable && (
        <FollowUpPanel
          museumId={museumId}
          language={language}
          workId={work.id}
          effort={mode}
          listenedText={listenedText}
        />
      )}
    </article>
  );
}
