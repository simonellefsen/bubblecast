"use client";

import { getSupabaseBrowserClient, isSupabaseConfigured } from "./client";

export type AuthInfo = {
  userId: string | null;
  email: string | null;
  isAnonymous: boolean;
};

export async function getAuthInfo(): Promise<AuthInfo> {
  if (!isSupabaseConfigured()) {
    return { userId: null, email: null, isAnonymous: true };
  }
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { userId: null, email: null, isAnonymous: true };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { userId: null, email: null, isAnonymous: true };
  }

  const isAnonymous =
    Boolean(user.is_anonymous) ||
    !user.email ||
    user.app_metadata?.provider === "anonymous";

  return {
    userId: user.id,
    email: user.email ?? null,
    isAnonymous,
  };
}

/**
 * Send a magic link email. Enable Email provider in Supabase Auth.
 * Redirect returns to /settings by default.
 */
export async function sendMagicLink(
  email: string,
  redirectTo?: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured" };
  }
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured" };

  const trimmed = email.trim().toLowerCase();
  if (!trimmed.includes("@")) {
    return { ok: false, error: "Enter a valid email address" };
  }

  const origin =
    typeof window !== "undefined" ? window.location.origin : "https://bubblecast.vercel.app";
  const { error } = await supabase.auth.signInWithOtp({
    email: trimmed,
    options: {
      emailRedirectTo: redirectTo ?? `${origin}/settings`,
      shouldCreateUser: true,
    },
  });

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOutBubblecast(): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) return { ok: true };
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: true };
  const { error } = await supabase.auth.signOut();
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
