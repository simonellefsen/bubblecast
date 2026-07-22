"use client";

const KEY = "bubblecast-ai-usage-v1";

/** Soft daily cap on AI-heavy actions (start scene + each live turn). */
export const DAILY_AI_SOFT_CAP = Number(
  process.env.NEXT_PUBLIC_DAILY_AI_SOFT_CAP ?? 40,
);

export type UsageState = {
  day: string; // YYYY-MM-DD local
  count: number;
};

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function loadUsage(): UsageState {
  if (typeof window === "undefined") return { day: todayKey(), count: 0 };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { day: todayKey(), count: 0 };
    const parsed = JSON.parse(raw) as UsageState;
    if (parsed.day !== todayKey()) return { day: todayKey(), count: 0 };
    return parsed;
  } catch {
    return { day: todayKey(), count: 0 };
  }
}

function saveUsage(state: UsageState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function recordAiUsage(n = 1): UsageState {
  const cur = loadUsage();
  const next = { day: todayKey(), count: cur.count + n };
  saveUsage(next);
  return next;
}

export type UsageGate =
  | { ok: true; usage: UsageState; remaining: number; warn: boolean }
  | { ok: false; usage: UsageState; remaining: number; message: string };

/**
 * Soft gate: warn near cap; block only when over cap.
 * Comic-less starts still count as 1; turns count as 1 each.
 */
export function checkAiBudget(cost = 1): UsageGate {
  const usage = loadUsage();
  const remaining = Math.max(0, DAILY_AI_SOFT_CAP - usage.count);
  if (usage.count + cost > DAILY_AI_SOFT_CAP) {
    return {
      ok: false,
      usage,
      remaining: 0,
      message: `Daily AI budget reached (${DAILY_AI_SOFT_CAP} actions). Try journal practice, or come back tomorrow.`,
    };
  }
  return {
    ok: true,
    usage,
    remaining: remaining - cost,
    warn: usage.count + cost >= DAILY_AI_SOFT_CAP * 0.8,
  };
}
