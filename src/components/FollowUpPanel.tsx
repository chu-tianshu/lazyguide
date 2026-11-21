"use client";

import { useState, type FormEvent } from "react";
import { strings, type LanguageCode } from "@/lib/i18n";

interface Turn {
  question: string;
  answer: string;
}

const MAX_QUESTION = 500;

export function FollowUpPanel({
  museumId,
  language,
  workId,
  effort,
  listenedText,
}: {
  museumId: string;
  language: LanguageCode;
  workId: string;
  effort: "low" | "high" | "full" | "custom";
  /** The guide text the visitor has heard so far. */
  listenedText: string;
}) {
  const t = strings[language];
  const [question, setQuestion] = useState("");
  const [turns, setTurns] = useState<Turn[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const q = question.trim();
    if (!q || pending) return;

    setPending(true);
    setError(null);

    // The server accepts at most 6 history messages, i.e. the last 3 exchanges.
    const history = turns.slice(-3).flatMap((turn) => [
      { role: "user" as const, content: turn.question },
      { role: "assistant" as const, content: turn.answer },
    ]);

    try {
      const res = await fetch("/api/ask-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          museumId,
          language,
          workId,
          effort,
          listenedText,
          history,
          question: q,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as { answer?: string; error?: string };
      if (!res.ok || !data.answer) {
        setError(data.error ?? t.errors.failed);
        return;
      }
      setTurns((prev) => [...prev, { question: q, answer: data.answer as string }]);
      setQuestion("");
    } catch {
      setError(t.errors.network);
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="followup" aria-labelledby="followup-heading">
      <h2 id="followup-heading">{t.askHeading}</h2>

      {turns.length > 0 && (
        <ol className="turns" aria-live="polite">
          {turns.map((turn, i) => (
            <li key={i}>
              <p className="turn-q">{turn.question}</p>
              <p className="turn-a">{turn.answer}</p>
            </li>
          ))}
        </ol>
      )}

      <form className="ask-form" onSubmit={submit}>
        <label htmlFor="question-input" className="visually-hidden">
          {t.askLabel}
        </label>
        <input
          id="question-input"
          type="text"
          placeholder={t.askPlaceholder}
          value={question}
          maxLength={MAX_QUESTION}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={pending}
        />
        <button type="submit" disabled={pending || !question.trim()}>
          {pending ? t.thinking : t.ask}
        </button>
      </form>

      {error && (
        <p className="notice" role="alert">
          {error}
        </p>
      )}
    </section>
  );
}
