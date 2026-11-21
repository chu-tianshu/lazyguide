/**
 * Server-only Supabase client with the service-role key, which bypasses row-level security.
 * Used by the search route to store works found online. Never import it from client code,
 * and never give the key a NEXT_PUBLIC_ name.
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | undefined;

export function supabaseAdmin(): SupabaseClient | undefined {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return undefined;
  client ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return client;
}
