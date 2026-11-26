/**
 * Favorite museums: a signed-in visitor's own rows in the `favorites` table
 * (supabase/favorites.sql). Row-level security scopes every query to the user.
 */
import { supabase } from "./supabaseClient";

/** Museum ids, most recently added first. Empty if signed out or unconfigured. */
export async function fetchFavorites(): Promise<string[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("favorites")
    .select("museum_id")
    .order("created_at", { ascending: false });
  if (error || !data) return [];
  return data.map((r) => r.museum_id);
}

export async function addFavorite(museumId: string): Promise<boolean> {
  if (!supabase) return false;
  const { data } = await supabase.auth.getSession();
  const userId = data.session?.user.id;
  if (!userId) return false;
  const { error } = await supabase
    .from("favorites")
    .upsert({ user_id: userId, museum_id: museumId }, { onConflict: "user_id,museum_id", ignoreDuplicates: true });
  return !error;
}

export async function removeFavorite(museumId: string): Promise<boolean> {
  if (!supabase) return false;
  const { error } = await supabase.from("favorites").delete().eq("museum_id", museumId);
  return !error;
}
