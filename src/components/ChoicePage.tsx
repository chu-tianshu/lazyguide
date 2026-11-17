"use client";

import type { ReactNode } from "react";

export interface ChoiceOption {
  id: string;
  title: string;
  subtitle?: string;
  visual: ReactNode;
}

export function ChoicePage({
  heading,
  options,
  onChoose,
  onBack,
}: {
  heading?: string;
  options: ChoiceOption[];
  onChoose: (id: string) => void;
  onBack?: () => void;
}) {
  return (
    <div className="gate">
      {onBack && (
        <button className="back" onClick={onBack}>
          ← Back
        </button>
      )}

      <header className="brand">
        <h1>Lazy Guide</h1>
        <p className="brand-tag">Audio guides, at your own pace</p>
      </header>

      {heading && <h2 className="gate-heading">{heading}</h2>}

      <ul className="gate-list">
        {options.map((o) => (
          <li key={o.id}>
            <button className="gate-item" onClick={() => onChoose(o.id)}>
              <span className="gate-visual">{o.visual}</span>
              <span className="gate-text">
                <span className="gate-title">{o.title}</span>
                {o.subtitle && <span className="gate-sub">{o.subtitle}</span>}
              </span>
              <span className="gate-arrow" aria-hidden="true">
                →
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
