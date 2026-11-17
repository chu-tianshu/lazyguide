"use client";

import { useMemo, useState } from "react";
import type { Painting } from "@/data/paintings";
import { GuidePlayer, type Section } from "./GuidePlayer";
import { FollowUpPanel } from "./FollowUpPanel";

type Effort = "low" | "high";

export function PaintingDetail({ painting, onBack }: { painting: Painting; onBack: () => void }) {
  const [effort, setEffort] = useState<Effort | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [listenedText, setListenedText] = useState("");

  const sections: Section[] | null = useMemo(() => {
    if (effort === "high") return [{ text: painting.guide.long }];
    if (effort === "low") {
      const list: Section[] = [{ text: painting.guide.short }];
      if (expanded) list.push({ heading: "Another angle", text: painting.guide.expansion });
      return list;
    }
    return null;
  }, [effort, expanded, painting]);

  const chooseEffort = (next: Effort) => {
    setEffort(next);
    setExpanded(false);
  };

  return (
    <article>
      <button className="back" onClick={onBack}>
        ← Back to collection
      </button>

      <div className="placeholder-art" aria-hidden="true" />

      <header className="detail-head">
        <h1>{painting.title}</h1>
        <p className="artist">{painting.artist}</p>
      </header>

      <dl className="meta">
        {painting.date && (
          <div>
            <dt>Date</dt>
            <dd>{painting.date}</dd>
          </div>
        )}
        {painting.medium && (
          <div>
            <dt>Medium</dt>
            <dd>{painting.medium}</dd>
          </div>
        )}
        {painting.accessionNumber && (
          <div>
            <dt>Accession</dt>
            <dd>{painting.accessionNumber}</dd>
          </div>
        )}
      </dl>

      {painting.museumObjectUrl && (
        <p className="object-link">
          <a href={painting.museumObjectUrl} target="_blank" rel="noreferrer">
            View on the museum&rsquo;s website ↗
          </a>
        </p>
      )}

      <section className="guide" aria-labelledby="guide-heading">
        <h2 id="guide-heading">Audio guide</h2>
        <div className="effort-choice" role="group" aria-label="Guide depth">
          <button aria-pressed={effort === "low"} onClick={() => chooseEffort("low")}>
            <strong>Low effort</strong>
            <span>A concise guide · about 1 min</span>
          </button>
          <button aria-pressed={effort === "high"} onClick={() => chooseEffort("high")}>
            <strong>High effort</strong>
            <span>Deeper history and interpretation · about 2–3 min</span>
          </button>
        </div>

        {sections && (
          <>
            <GuidePlayer
              key={`${painting.id}-${effort}-${expanded}`}
              sections={sections}
              onListenedChange={setListenedText}
            />
            {effort === "low" && !expanded && (
              <button className="expand" onClick={() => setExpanded(true)}>
                + Expand with another story
              </button>
            )}
          </>
        )}
      </section>

      {effort && (
        <FollowUpPanel paintingId={painting.id} effort={effort} listenedText={listenedText} />
      )}
    </article>
  );
}
