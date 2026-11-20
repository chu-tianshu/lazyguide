/**
 * Browser-only Supabase client. Safe to use client-side: the anon key only
 * grants what Postgres row-level security (see supabase/schema.sql) allows.
 * Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel
 * (or .env.local locally).
 */
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Undefined when the env vars aren't set, so sign-in fails gracefully instead of crashing the app. */
export const supabase = url && anonKey ? createClient(url, anonKey) : undefined;
