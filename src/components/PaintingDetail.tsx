"use client";

import { useMemo, useState } from "react";
import type { Work } from "@/data/catalog";
import { strings, type LanguageCode } from "@/lib/i18n";
import { GuidePlayer, type Section } from "./GuidePlayer";
import { FollowUpPanel } from "./FollowUpPanel";

type Effort = "low" | "high";

export function PaintingDetail({
  work,
  museumId,
  language,
  onBack,
}: {
  work: Work;
  museumId: string;
  language: LanguageCode;
  onBack: () => void;
}) {
  const t = strings[language];
  const [effort, setEffort] = useState<Effort | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [listenedText, setListenedText] = useState("");

  const sections: Section[] | null = useMemo(() => {
    if (effort === "high") return [{ text: work.guide.long }];
    if (effort === "low") {
      const list: Section[] = [{ text: work.guide.short }];
      if (expanded) list.push({ heading: t.anotherAngle, text: work.guide.expansion });
      return list;
    }
    return null;
  }, [effort, expanded, work, t.anotherAngle]);

  const chooseEffort = (next: Effort) => {
    setEffort(next);
    setExpanded(false);
  };

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
              {t.commons}
            </a>{" "}
            · {work.image.license}
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

        {sections && (
          <>
            <GuidePlayer
              key={`${work.id}-${effort}-${expanded}`}
              sections={sections}
              language={language}
              onListenedChange={setListenedText}
            />
            {effort === "low" && !expanded && (
              <button className="expand" onClick={() => setExpanded(true)}>
                {t.expand}
              </button>
            )}
          </>
        )}
      </section>

      {effort && (
        <FollowUpPanel
          museumId={museumId}
          language={language}
          workId={work.id}
          effort={effort}
          listenedText={listenedText}
        />
      )}
    </article>
  );
}
