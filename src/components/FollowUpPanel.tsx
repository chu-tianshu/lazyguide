"use client";

import { useState, type FormEvent } from "react";

interface Turn {
  question: string;
  answer: string;
}

const MAX_QUESTION = 500;

export function FollowUpPanel({
  paintingId,
  effort,
  listenedText,
}: {
  paintingId: string;
  effort: "low" | "high";
  /** The guide text the visitor has heard so far. */
  listenedText: string;
}) {
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

    const history = turns.flatMap((t) => [
      { role: "user" as const, content: t.question },
      { role: "assistant" as const, content: t.answer },
    ]);

    try {
      const res = await fetch("/api/ask-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ paintingId, effort, listenedText, history, question: q }),
      });
      const data = (await res.json().catch(() => ({}))) as { answer?: string; error?: string };
      if (!res.ok || !data.answer) {
        setError(data.error ?? "The guide couldn't answer right now. Please try again.");
        return;
      }
      setTurns((prev) => [...prev, { question: q, answer: data.answer as string }]);
      setQuestion("");
    } catch {
      setError("Couldn't reach the guide. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="followup" aria-labelledby="followup-heading">
      <h2 id="followup-heading">Ask about this work</h2>

      {turns.length > 0 && (
        <ol className="turns" aria-live="polite">
          {turns.map((t, i) => (
            <li key={i}>
              <p className="turn-q">{t.question}</p>
              <p className="turn-a">{t.answer}</p>
            </li>
          ))}
        </ol>
      )}

      <form className="ask-form" onSubmit={submit}>
        <label htmlFor="question-input" className="visually-hidden">
          Your question about this work
        </label>
        <input
          id="question-input"
          type="text"
          placeholder="e.g. Why is the sky so dark?"
          value={question}
          maxLength={MAX_QUESTION}
          onChange={(e) => setQuestion(e.target.value)}
          disabled={pending}
        />
        <button type="submit" disabled={pending || !question.trim()}>
          {pending ? "Thinking…" : "Ask"}
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
