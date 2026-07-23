"use client";

const ATMOSPHERE_KEY = "bubblecast-pref-comic-atmosphere-v1";

/** User preference for Imagine comic atmosphere (default: on). */
export function loadComicAtmospherePref(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const raw = localStorage.getItem(ATMOSPHERE_KEY);
    if (raw === null) return true;
    return raw === "1" || raw === "true";
  } catch {
    return true;
  }
}

export function saveComicAtmospherePref(enabled: boolean) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ATMOSPHERE_KEY, enabled ? "1" : "0");
  } catch {
    /* ignore */
  }
}

/** Need headroom for start (1) + optional atmosphere (1). */
export function shouldRequestAtmosphere(opts: {
  includeComic: boolean;
  prefEnabled: boolean;
  remainingBudget: number;
}): boolean {
  if (!opts.includeComic || !opts.prefEnabled) return false;
  // Keep at least 2 actions after start for a short scene turn
  return opts.remainingBudget >= 3;
}
