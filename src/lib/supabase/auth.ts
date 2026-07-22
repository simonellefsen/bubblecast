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
    (!user.email && !user.phone);

  return {
    userId: user.id,
    email: user.email ?? null,
    isAnonymous,
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

/**
 * Convert the current anonymous session into a permanent email account
 * while keeping the same auth user id (and thus bubblecast.profiles row).
 */
export async function linkEmailToCurrentUser(
  email: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured" };
  }
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured" };

  const trimmed = normalizeEmail(email);
  if (!trimmed.includes("@")) {
    return { ok: false, error: "Enter a valid email address" };
  }

  // Ensure we have a session (anonymous) first
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    return {
      ok: false,
      error: "No active session. Refresh the page and try again.",
    };
  }

  const { error } = await supabase.auth.updateUser({ email: trimmed });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Magic link for signing in on another device (may be a different user id).
 * Use after export/import if you need to merge progress.
 */
export async function sendMagicLinkForSignIn(
  email: string,
  redirectTo?: string,
): Promise<{ ok: boolean; error?: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "Supabase is not configured" };
  }
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "Supabase is not configured" };

  const trimmed = normalizeEmail(email);
  if (!trimmed.includes("@")) {
    return { ok: false, error: "Enter a valid email address" };
  }

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://bubblecast.vercel.app";
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

/** @deprecated prefer linkEmailToCurrentUser or sendMagicLinkForSignIn */
export async function sendMagicLink(
  email: string,
  redirectTo?: string,
): Promise<{ ok: boolean; error?: string }> {
  const info = await getAuthInfo();
  if (info.isAnonymous && info.userId) {
    return linkEmailToCurrentUser(email);
  }
  return sendMagicLinkForSignIn(email, redirectTo);
}

export async function signOutBubblecast(): Promise<{
  ok: boolean;
  error?: string;
}> {
  if (!isSupabaseConfigured()) return { ok: true };
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: true };
  const { error } = await supabase.auth.signOut();
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
