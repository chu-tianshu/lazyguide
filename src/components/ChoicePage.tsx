"use client";

export interface ChoiceOption {
  id: string;
  title: string;
  subtitle?: string;
}

export function ChoicePage({
  eyebrow,
  heading,
  options,
  onChoose,
  onBack,
}: {
  eyebrow: string;
  heading: string;
  options: ChoiceOption[];
  onChoose: (id: string) => void;
  onBack?: () => void;
}) {
  return (
    <>
      {onBack && (
        <button className="back" onClick={onBack}>
          ← Back
        </button>
      )}
      <header className="masthead">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{heading}</h1>
      </header>
      <ul className="results">
        {options.map((o) => (
          <li key={o.id}>
            <button className="result" onClick={() => onChoose(o.id)}>
              <span className="result-title">{o.title}</span>
              {o.subtitle && <span className="result-meta">{o.subtitle}</span>}
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
