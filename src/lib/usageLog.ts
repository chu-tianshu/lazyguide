/** Server-only: records paid-service usage (Claude calls, generated audio) in `usage_log`. Never throws. */
import { track as vercelTrack } from "@vercel/analytics/server";
import { supabaseAdmin } from "./supabaseAdmin";

export interface UsageRow {
  kind: "guide_generation" | "question" | "tts";
  user_id?: string | null;
  museum_id?: string;
  work_id?: string;
  language?: string;
  model?: string;
  input_tokens?: number;
  output_tokens?: number;
  chars?: number;
  audio_seconds?: number;
}

const EVENT_NAMES = { guide_generation: "guide_generated", question: "question_answered", tts: "audio_generated" } as const;

export async function logUsage(row: UsageRow): Promise<void> {
  // Also shows up under Events in the Vercel Analytics dashboard (custom events need a Pro plan).
  try {
    await vercelTrack(EVENT_NAMES[row.kind], {
      language: row.language ?? null,
      work: row.work_id ?? null,
      model: row.model ?? null,
      input_tokens: row.input_tokens ?? null,
      output_tokens: row.output_tokens ?? null,
      chars: row.chars ?? null,
      audio_seconds: row.audio_seconds === undefined ? null : Math.round(row.audio_seconds),
    });
  } catch {
    // Best effort.
  }
  try {
    const admin = supabaseAdmin();
    if (!admin) return;
    const { error } = await admin.from("usage_log").insert(row);
    if (error) console.error("usage log failed:", error.code);
  } catch {
    // Telemetry must never break a request.
  }
}

const BITRATES_V1_L3 = [0, 32, 40, 48, 56, 64, 80, 96, 112, 128, 160, 192, 224, 256, 320];
const BITRATES_V2_L3 = [0, 8, 16, 24, 32, 40, 48, 56, 64, 80, 96, 112, 128, 144, 160];

/**
 * Length of an MP3 in seconds, from its first frame header (constant bitrate assumed).
 * Falls back to ~14 characters per second of speech when the header cannot be read.
 */
export function mp3Seconds(audio: Uint8Array, text: string): number {
  for (let i = 0; i + 4 < Math.min(audio.length, 4096); i++) {
    if (audio[i] !== 0xff || (audio[i + 1] & 0xe0) !== 0xe0) continue;
    const version = (audio[i + 1] >> 3) & 3; // 3 = MPEG1, 2 = MPEG2, 0 = MPEG2.5
    const layer = (audio[i + 1] >> 1) & 3; // 1 = Layer III
    const index = audio[i + 2] >> 4;
    if (layer !== 1 || version === 1 || index === 0 || index === 15) continue;
    const kbps = (version === 3 ? BITRATES_V1_L3 : BITRATES_V2_L3)[index];
    return (audio.length * 8) / (kbps * 1000);
  }
  return text.length / 14;
}
