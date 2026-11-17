"use client";

import { useState } from "react";
import type { Painting } from "@/data/paintings";

type Effort = "low" | "high";

export function PaintingDetail({ painting, onBack }: { painting: Painting; onBack: () => void }) {
  const [effort, setEffort] = useState<Effort | null>(null);

  return (
    <article>
      <button className="back" onClick={onBack}>
        ← Back to collection
      </button>

      <div className="placeholder-art" aria-hidden="true" />

      <header className="detail-head">
        <h1>{painting.title}</h1>
        <p className="artist">{painting.artist}</p>
        {painting.isFixture && <p className="notice">Test fixture, not a real artwork.</p>}
      </header>

      <dl className="meta">
        {painting.date && (
          <>
            <dt>Date</dt>
            <dd>{painting.date}</dd>
          </>
        )}
        {painting.medium && (
          <>
            <dt>Medium</dt>
            <dd>{painting.medium}</dd>
          </>
        )}
        {painting.dimensions && (
          <>
            <dt>Dimensions</dt>
            <dd>{painting.dimensions}</dd>
          </>
        )}
      </dl>

      {painting.description && <p className="description">{painting.description}</p>}
      {painting.museumObjectUrl && (
        <p>
          <a href={painting.museumObjectUrl} target="_blank" rel="noreferrer">
            View on the museum&rsquo;s website ↗
          </a>
        </p>
      )}

      <section className="guide" aria-labelledby="guide-heading">
        <h2 id="guide-heading">Audio guide</h2>
        <div className="effort-choice" role="group" aria-label="Guide depth">
          <button aria-pressed={effort === "low"} onClick={() => setEffort("low")}>
            <strong>Low effort</strong>
            <span>A short, approachable guide · ~1–2 min</span>
          </button>
          <button aria-pressed={effort === "high"} onClick={() => setEffort("high")}>
            <strong>High effort</strong>
            <span>Deeper history and interpretation · ~4–6 min</span>
          </button>
        </div>

        {effort && (
          <div className="guide-placeholder">
            <p className="eyebrow">{effort === "low" ? "Low effort" : "High effort"} guide</p>
            <p>Guide generation is coming in the next milestone.</p>
          </div>
        )}
      </section>

      <section className="followup" aria-labelledby="followup-heading">
        <h2 id="followup-heading">Ask a question</h2>
        <p className="muted">Follow-up questions will be available once a guide is generated.</p>
      </section>
    </article>
  );
}
