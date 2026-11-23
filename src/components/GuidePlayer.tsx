"use client";

import { track } from "@/lib/analytics";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { chunkText } from "@/lib/speech";
import { speechUrl } from "@/lib/tts";
import { strings, type LanguageCode } from "@/lib/i18n";

export interface Section {
  heading?: string;
  text: string;
}

type Status = "idle" | "playing" | "paused" | "ended";
// Tiny silent clip played inside a click so mobile browsers allow later, asynchronous playback.
const SILENT =
  "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=";
const RATES = [1, 1.2, 1.5, 2] as const;
type Rate = (typeof RATES)[number];

// Only one guide plays at a time: starting one pauses whichever was playing before.
let interruptActive: (() => void) | null = null;

function pickVoice(speechLang: string): SpeechSynthesisVoice | undefined {
  // An empty voice list is fine: the browser falls back to its default voice.
  const voices = window.speechSynthesis.getVoices();
  const exact = speechLang.toLowerCase();
  const base = exact.split("-")[0];
  return (
    voices.find((v) => v.lang.toLowerCase().replace("_", "-") === exact) ??
    voices.find((v) => v.lang.toLowerCase().startsWith(base))
  );
}

/**
 * Browser-native audio player with captions. The displayed text is the source
 * of truth; speech is queued one sentence at a time so that pause, restart and
 * speed changes can resume from the current sentence.
 *
 * Remount (via `key`) to reset playback when the work or depth changes. Sections
 * may be appended while mounted (the expansion); `jumpTo` then starts playing
 * from the first sentence of that section.
 */
export function GuidePlayer({
  sections,
  language,
  onListenedChange,
  jumpTo,
  autoPlay = false,
  track: trackWork,
}: {
  /** Start speaking as soon as the player mounts. */
  autoPlay?: boolean;
  sections: Section[];
  language: LanguageCode;
  /** When set, plays, replays and completions of this guide are logged as telemetry. */
  track?: { museumId: string; workId: string };
  /** Reports the text the visitor has heard so far (sentences up to the current one). */
  onListenedChange?: (text: string) => void;
  /** Start playing from this section when `token` changes. */
  jumpTo?: { section: number; token: number };
}) {
  const t = strings[language];

  const flat = useMemo(() => {
    const items: { text: string; section: number }[] = [];
    sections.forEach((s, si) => {
      chunkText(s.text, language).forEach((text) => items.push({ text, section: si }));
    });
    return items;
  }, [sections, language]);

  const lengths = useMemo(() => flat.map((f) => f.text.length), [flat]);
  const totalChars = useMemo(() => lengths.reduce((a, b) => a + b, 0) || 1, [lengths]);

  const [supported, setSupported] = useState(true);
  const [noVoice, setNoVoice] = useState(false);
  const [status, setStatus] = useState<Status>("idle");
  const [current, setCurrent] = useState(0);
  const [within, setWithin] = useState(0); // 0–1 progress through the current sentence
  const [rate, setRate] = useState<Rate>(1);
  const [heard, setHeard] = useState<ReadonlySet<number>>(() => new Set());

  const runRef = useRef(0); // increments on every restart; stale callbacks check it
  const captionRefs = useRef<Array<HTMLSpanElement | null>>([]);
  const lastJump = useRef(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const aiFailed = useRef(false); // neural voice unavailable: use the browser voice from now on
  const hasPlayed = useRef(false); // later starts from the top count as replays
  const aiIndex = useRef(0); // sentence the audio element is on
  const interrupted = useRef(false); // paused because another guide started; browser speech was cancelled

  /** Pause this player because another one is starting. */
  const interruptSelf = () => {
    audioRef.current?.pause();
    interrupted.current = true;
    setStatus((s) => (s === "playing" ? "paused" : s));
  };
  const interruptRef = useRef(interruptSelf);
  interruptRef.current = interruptSelf;
  const claimPlayback = () => {
    const mine = () => interruptRef.current();
    if (interruptActive && interruptActive !== lastClaim.current) interruptActive();
    lastClaim.current = mine;
    interruptActive = mine;
    interrupted.current = false;
  };
  const lastClaim = useRef<(() => void) | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
    return () => {
      runRef.current++;
      if (interruptActive === lastClaim.current) interruptActive = null;
      audioRef.current?.pause();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  const speakFrom = useCallback(
    (start: number, r: Rate, keepHeard = false) => {
      if (flat.length === 0) return;
      if (!aiFailed.current) {
        speakAi(start, r, keepHeard);
        return;
      }
      speakBrowser(start, r, keepHeard);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [flat, supported, t.speechLang, language],
  );

  /** Neural voice: audio is requested one sentence at a time (the next is fetched while one plays). */
  function speakAi(start: number, r: Rate, keepHeard: boolean) {
    const audio = (audioRef.current ??= new Audio());
    claimPlayback();
    window.speechSynthesis?.cancel();
    const runId = ++runRef.current;
    const isCurrent = () => runId === runRef.current;

    // Unlock playback within the user's click; the real sources are set once they arrive.
    audio.src = SILENT;
    audio.play().catch(() => {});

    setNoVoice(false);
    setStatus("playing");
    setCurrent(start);
    setWithin(0);
    if (!keepHeard) setHeard(new Set());

    const fail = (index: number, why = "audio element error") => {
      if (!isCurrent()) return;
      aiFailed.current = true;
      audio.pause();
      speakBrowser(index, r, true);
    };

    const playIndex = (index: number) => {
      aiIndex.current = index;
      speechUrl(flat[index].text, language).then(
        (url) => {
          if (!isCurrent()) return;
          if (interrupted.current) {
            // Another guide took over while this sentence was loading: stay quiet; resuming restarts from here.
            audio.src = SILENT;
            return;
          }
          audio.src = url;
          audio.playbackRate = r;
          audio.onplay = () => {
            if (!isCurrent()) return;
            setCurrent(index);
            setWithin(0);
            setHeard((prev) => (prev.has(index) ? prev : new Set(prev).add(index)));
          };
          audio.ontimeupdate = () => {
            if (isCurrent() && audio.duration) setWithin(Math.min(1, audio.currentTime / audio.duration));
          };
          audio.onended = () => {
            if (!isCurrent()) return;
            if (index === flat.length - 1) {
              setStatus("ended");
              setWithin(1);
            } else {
              playIndex(index + 1);
            }
          };
          audio.onerror = () => fail(index, `audio failed to load ${url} (${audio.error?.message ?? audio.error?.code ?? "?"})`);
          audio.play().catch(() => {
            // Blocked or failed to start: pause rather than skipping ahead.
            if (isCurrent()) {
              setStatus("paused");
            }
          });
          if (index + 1 < flat.length) speechUrl(flat[index + 1].text, language).catch(() => {});
        },
        (err) => fail(index, String(err instanceof Error ? err.message : err)),
      );
    };
    playIndex(start);
  }

  function speakBrowser(start: number, r: Rate, keepHeard: boolean) {
    {
      if (!supported) return;
      const synth = window.speechSynthesis;
      claimPlayback();
      synth.cancel();

      const runId = ++runRef.current;
      const isCurrent = () => runId === runRef.current;
      const voice = pickVoice(t.speechLang);
      // Only warn once voices have loaded and none matches the guide's language.
      setNoVoice(!voice && synth.getVoices().length > 0);

      setStatus("playing");
      setCurrent(start);
      setWithin(0);
      if (!keepHeard) setHeard(new Set());

      for (let index = start; index < flat.length; index++) {
        const item = flat[index];
        const utterance = new SpeechSynthesisUtterance(item.text);
        utterance.rate = r;
        utterance.lang = voice?.lang ?? t.speechLang;
        if (voice) utterance.voice = voice;

        utterance.onstart = () => {
          if (!isCurrent()) return;
          setCurrent(index);
          setWithin(0);
          setHeard((prev) => (prev.has(index) ? prev : new Set(prev).add(index)));
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
    }
  }

  // Only read on mount; the player is remounted for new content.
  useEffect(() => {
    if (autoPlay) {
      logPlay(false);
      speakFrom(0, rate);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const logPlay = (replay: boolean) => {
    if (!trackWork) return;
    track(replay || hasPlayed.current ? "replay" : "play", { ...trackWork, language });
    hasPlayed.current = true;
  };

  useEffect(() => {
    if (status === "ended" && trackWork) track("complete", { ...trackWork, language });
    // Only the transition to "ended" matters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const togglePlay = () => {
    const ai = !aiFailed.current;
    if (!ai && !supported) return;
    const synth = window.speechSynthesis;
    if (status === "playing") {
      if (ai) audioRef.current?.pause();
      else synth.pause();
      setStatus("paused");
    } else if (status === "paused") {
      if (ai) {
        const audio = audioRef.current;
        if (audio?.src && audio.src !== SILENT) {
          claimPlayback();
          audio.play().catch(() => {});
        }
        else speakFrom(current, rate, true); // never got going (e.g. blocked autoplay)
      } else if (interrupted.current) speakFrom(current, rate, true);
      else {
        claimPlayback();
        synth.resume();
      }
      setStatus("playing");
    } else {
      if (status === "ended" || current === 0) logPlay(status === "ended");
      speakFrom(status === "ended" ? 0 : current, rate, status !== "ended");
    }
  };

  const restart = () => {
    logPlay(true);
    speakFrom(0, rate);
  };

  const changeRate = (r: Rate) => {
    setRate(r);
    if (!aiFailed.current) {
      // Recorded audio can change speed on the fly.
      if (audioRef.current) audioRef.current.playbackRate = r;
      return;
    }
    if (status === "playing" || status === "paused") {
      // Browsers cannot change the speed of a running utterance, so the
      // current sentence is re-spoken at the new speed.
      const wasPaused = status === "paused";
      speakFrom(current, r, true);
      if (wasPaused) {
        window.speechSynthesis.pause();
        setStatus("paused");
      }
    }
  };

  const isActive = status === "playing" || status === "paused";

  // Only sentences that were actually spoken count as heard, so jumping ahead
  // to the expansion does not claim the skipped part of the first story.
  const listened = useMemo(
    () =>
      flat
        .filter((_, i) => heard.has(i))
        .map((f) => f.text)
        .join(t.joiner),
    [flat, heard, t.joiner],
  );

  useEffect(() => {
    onListenedChange?.(listened);
    // onListenedChange is a stable state setter from the parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listened]);

  useEffect(() => {
    if (!jumpTo || jumpTo.token === lastJump.current) return;
    const start = flat.findIndex((item) => item.section === jumpTo.section);
    if (start < 0) return;
    lastJump.current = jumpTo.token;
    speakFrom(start, rate, true);
  }, [jumpTo, flat, rate, speakFrom]);

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

  // Where each later section begins on the bar, so the expansion is visible as a segment.
  const sectionMarks = useMemo(() => {
    const marks: number[] = [];
    let chars = 0;
    flat.forEach((item, i) => {
      if (i > 0 && item.section !== flat[i - 1].section) marks.push(chars / totalChars);
      chars += item.text.length;
    });
    return marks;
  }, [flat, totalChars]);

  const playLabel =
    status === "playing"
      ? t.pause
      : status === "paused"
        ? t.resume
        : status === "ended"
          ? t.playAgain
          : t.play;

  return (
    <div className="player">
      <div className="controls">
        <button className="primary" onClick={togglePlay} disabled={!supported}>
          {playLabel}
        </button>
        <button onClick={restart} disabled={!supported}>
          {t.restart}
        </button>
        <div className="speed" role="group" aria-label={t.speedLabel}>
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
        aria-label={t.progressLabel}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={percent}
      >
        <div className="progress-fill" style={{ width: `${percent}%` }} />
        {sectionMarks.map((m) => (
          <div key={m} className="progress-mark" style={{ left: `${m * 100}%` }} />
        ))}
      </div>

      {!supported && (
        <p className="notice" role="note">
          {t.noSpeech}
        </p>
      )}
      {supported && noVoice && (
        <p className="notice" role="note">
          {t.noVoice}
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
                    {item.text}
                    {t.joiner}
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
