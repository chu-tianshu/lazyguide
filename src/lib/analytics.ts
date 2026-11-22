/**
 * Usage telemetry: one row per event in `events` (supabase/analytics.sql), written as the
 * signed-in visitor (anonymous guests included). Fire-and-forget; never breaks the app.
 */
import { track as vercelTrack } from "@vercel/analytics";
import { supabase } from "./supabaseClient";

export type EventName = "app_open" | "work_view" | "play" | "replay" | "complete" | "expand" | "question";

export async function track(
  event: EventName,
  where: { museumId?: string; workId?: string; language?: string } = {},
): Promise<void> {
  try {
    vercelTrack(event, {
      museum: where.museumId ?? null,
      work: where.workId ?? null,
      language: where.language ?? null,
    });
  } catch {
    // Best effort.
  }
  try {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    const userId = data.session?.user.id;
    if (!userId) return;
    await supabase.from("events").insert({
      user_id: userId,
      event,
      museum_id: where.museumId ?? null,
      work_id: where.workId ?? null,
      language: where.language ?? null,
    });
  } catch {
    // Telemetry is best effort.
  }
}
