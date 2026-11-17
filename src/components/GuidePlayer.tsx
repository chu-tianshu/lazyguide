"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chunkText } from "@/lib/speech";

export interface Section {
  heading?: string;
  text: string;
}

type Status = "idle" | "playing" | "paused" | "ended";
const RATES = [1, 1.5, 2] as const;
type Rate = (typeof RATES)[number];

function pickVoice(): SpeechSynthesisVoice | undefined {
  // An empty voice list is fine: the browser falls back to its default voice.
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang.toLowerCase().startsWith("en-us")) ??
    voices.find((v) => v.lang.toLowerCase().startsWith("en"))
  );
}

/**
 * Browser-native audio player with captions. The displayed text is the source
 * of truth; speech is queued one sentence at a time so that pause, restart and
 * speed changes can resume from the current sentence.
 *
 * Remount (via `key`) to reset playback when the guide text changes.
 */
export function GuidePlayer({
  sections,
  onListenedChange,
}: {
  sections: Section[];
  /** Reports the text the visitor has heard so far (sentences up to the current one). */
  onListenedChange?: (text: string) => void;
}) {
  const flat = useMemo(() => {
    const items: { text: string; section: number }[] = [];
    sections.forEach((s, si) => {
      chunkText(s.text).forEach((text) => items.push({ text, section: si }));
    });
    return items;
  }, [sections]);

  const lengths = useMemo(() => flat.map((f) => f.text.length), [flat]);
  const totalChars = useMemo(() => lengths.reduce((a, b) => a + b, 0) || 1, [lengths]);

  const [supported, setSupported] = useState(true);
  const [status, setStatus] = useState<Status>("idle");
  const [current, setCurrent] = useState(0);
  const [within, setWithin] = useState(0); // 0–1 progress through the current sentence
  const [rate, setRate] = useState<Rate>(1);

  const runRef = useRef(0); // increments on every restart; stale callbacks check it
  const captionRefs = useRef<Array<HTMLSpanElement | null>>([]);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      runRef.current++;
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const speakFrom = useCallback(
    (start: number, r: Rate) => {
      if (!supported || flat.length === 0) return;
      const synth = window.speechSynthesis;
      synth.cancel();

      const runId = ++runRef.current;
      const isCurrent = () => runId === runRef.current;
      const voice = pickVoice();

      setStatus("playing");
      setCurrent(start);
      setWithin(0);

      for (let index = start; index < flat.length; index++) {
        const item = flat[index];
        const utterance = new SpeechSynthesisUtterance(item.text);
        utterance.rate = r;
        utterance.lang = voice?.lang ?? "en-US";
        if (voice) utterance.voice = voice;

        utterance.onstart = () => {
          if (!isCurrent()) return;
          setCurrent(index);
          setWithin(0);
        };
        utterance.onboundary = (e) => {
          if (!isCurrent()) return;
          setWithin(Math.min(1, e.charIndex / item.text.length));
        };
        utterance.onend = () => {
          if (!isCurrent()) return;
          if (index === flat.length - 1) {
            setStatus("ended");
            setWithin(1);
          }
        };
        utterance.onerror = (e) => {
          if (!isCurrent()) return;
          if (e.error === "interrupted" || e.error === "canceled") return;
          setStatus("idle");
        };
        synth.speak(utterance);
      }
    },
    [flat, supported],
  );

  const togglePlay = () => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    if (status === "playing") {
      synth.pause();
      setStatus("paused");
    } else if (status === "paused") {
      synth.resume();
      setStatus("playing");
    } else {
      speakFrom(status === "ended" ? 0 : current, rate);
    }
  };

  const restart = () => speakFrom(0, rate);

  const changeRate = (r: Rate) => {
    setRate(r);
    if (status === "playing" || status === "paused") {
      // Browsers cannot change the speed of a running utterance, so the
      // current sentence is re-spoken at the new speed.
      const wasPaused = status === "paused";
      speakFrom(current, r);
      if (wasPaused) {
        window.speechSynthesis.pause();
        setStatus("paused");
      }
    }
  };

  const isActive = status === "playing" || status === "paused";

  const listened = useMemo(() => {
    if (status === "ended") return flat.map((f) => f.text).join(" ");
    if (status === "idle") return "";
    return flat
      .slice(0, current + 1)
      .map((f) => f.text)
      .join(" ");
  }, [flat, current, status]);

  useEffect(() => {
    onListenedChange?.(listened);
    // onListenedChange is a stable state setter from the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listened]);

  // Keep the sentence being spoken in view.
  useEffect(() => {
    if (status === "playing") {
      captionRefs.current[current]?.scrollIntoView({ block: "center", behavior: "smooth" });
    }
  }, [current, status]);

  const elapsedChars = lengths.slice(0, current).reduce((a, b) => a + b, 0);
  const progress =
    status === "ended"
      ? 1
      : status === "idle"
        ? 0
        : Math.min(1, (elapsedChars + within * (lengths[current] ?? 0)) / totalChars);
  const percent = Math.round(progress * 100);

  const playLabel =
    status === "playing" ? "Pause" : status === "paused" ? "Resume" : status === "ended" ? "Play again" : "Play";

  return (
    <div className="player">
      <div className="controls">
        <button className="primary" onClick={togglePlay} disabled={!supported}>
          {playLabel}
        </button>
        <button onClick={restart} disabled={!supported}>
          Restart
        </button>
        <div className="speed" role="group" aria-label="Playback speed">
          {RATES.map((r) => (
            <button
              key={r}
              aria-pressed={rate === r}
              onClick={() => changeRate(r)}
              disabled={!supported}
            >
              {r}×
            </button>
          ))}
        </div>
      </div>

      <div
        className="progress"
        role="progressbar"
        aria-label="Playback progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
      </div>

      {!supported && (
        <p className="notice" role="note">
          Audio playback isn&rsquo;t available in this browser. The captions below still work.
        </p>
      )}

      <div className="captions">
        {sections.map((section, si) => (
          <div className="caption-section" key={si}>
            {section.heading && <h3>{section.heading}</h3>}
            <p>
              {flat.map((item, i) => {
                if (item.section !== si) return null;
                const cls =
                  i === current && isActive
                    ? "cap current"
                    : i < current || status === "ended"
                      ? "cap past"
                      : "cap";
                return (
                  <span
                    key={i}
                    ref={(el) => {
                      captionRefs.current[i] = el;
                    }}
                    className={cls}
                  >
                    {item.text}{" "}
                  </span>
                );
              })}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
