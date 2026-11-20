/**
 * Visit tracking: a signed-in visitor's own rows in the `visits` table
 * (supabase/schema.sql). Row-level security scopes every query to the
 * current user, so these are plain client-side calls, no API route needed.
 */
import { supabase } from "./supabaseClient";

export interface Visit {
  museumId: string;
  workId: string;
  visitedAt: string;
}

/** Records that the signed-in visitor has seen a work's guide. Idempotent. */
export async function recordVisit(museumId: string, workId: string): Promise<void> {
  if (!supabase) return;
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return;

  await supabase
    .from("visits")
    .upsert(
      { user_id: userId, museum_id: museumId, work_id: workId, visited_at: new Date().toISOString() },
      { onConflict: "user_id,museum_id,work_id" },
    );
}

/** All of the signed-in visitor's visits, oldest first. Empty if signed out or unconfigured. */
export async function fetchVisits(): Promise<Visit[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("visits")
    .select("museum_id, work_id, visited_at")
    .order("visited_at", { ascending: true });
  if (error || !data) return [];
  return data.map((row) => ({ museumId: row.museum_id, workId: row.work_id, visitedAt: row.visited_at }));
}
