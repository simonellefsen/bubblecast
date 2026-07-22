"use client";

const KEY = "bubblecast-streak-v1";

export type StreakState = {
  count: number;
  lastActiveDay: string; // YYYY-MM-DD local
};

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function yesterdayKey() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function loadStreak(): StreakState {
  if (typeof window === "undefined") return { count: 0, lastActiveDay: "" };
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { count: 0, lastActiveDay: "" };
    return JSON.parse(raw) as StreakState;
  } catch {
    return { count: 0, lastActiveDay: "" };
  }
}

/** Call when the learner finishes a mission debrief (or practice). */
export function recordActivity(): StreakState {
  const today = todayKey();
  const prev = loadStreak();
  let count = prev.count;
  if (prev.lastActiveDay === today) {
    // already counted today
  } else if (prev.lastActiveDay === yesterdayKey()) {
    count = Math.max(1, count + 1);
  } else {
    count = 1;
  }
  const next = { count, lastActiveDay: today };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
  return next;
}
