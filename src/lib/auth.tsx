"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";

interface AuthValue {
  user: User | null;
  loading: boolean;
  /** No-op (with a console warning) if Supabase isn't configured. */
  signInWithGoogle: () => Promise<void>;
  /** Signs in as a new anonymous Supabase user and logs the signup (see supabase/schema.sql). */
  continueAsGuest: () => Promise<string | undefined>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(supabase));

  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setLoading(false);
    });
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.subscription.unsubscribe();
  }, []);

  const value: AuthValue = {
    user,
    loading,
    signInWithGoogle: async () => {
      if (!supabase) {
        console.warn("Supabase isn't configured; sign-in is unavailable.");
        return;
      }
      await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { redirectTo: window.location.origin },
      });
    },
    continueAsGuest: async () => {
      if (!supabase) {
        console.warn("Supabase isn't configured; guest sign-in is unavailable.");
        return "Guest sign-in isn't set up on this server.";
      }
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error || !data.user) return error?.message ?? "Guest sign-in failed.";
      // Documents how many anonymous users have signed in; ignored if it somehow runs twice for the same user.
      await supabase
        .from("anonymous_logins")
        .upsert({ user_id: data.user.id }, { onConflict: "user_id", ignoreDuplicates: true });
    },
    signOut: async () => {
      await supabase?.auth.signOut();
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
