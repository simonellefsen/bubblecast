"use client";

import type { DebriefPacket } from "@/content/types";

const KEY = "bubblecast-debrief-log-v1";
const MAX = 24;

export type LocalDebriefRun = {
  id: string;
  mission_id: string;
  outcome: DebriefPacket["outcome"];
  score: number;
  summary: string;
  xp_earned: number;
  created_at: string;
};

function readAll(): LocalDebriefRun[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LocalDebriefRun[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAll(runs: LocalDebriefRun[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(runs.slice(0, MAX)));
  } catch {
    /* quota */
  }
}

export function appendLocalDebrief(
  missionId: string,
  debrief: DebriefPacket,
): LocalDebriefRun {
  const run: LocalDebriefRun = {
    id: `local-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    mission_id: missionId,
    outcome: debrief.outcome,
    score: debrief.score,
    summary: debrief.summary,
    xp_earned: debrief.xpEarned,
    created_at: new Date().toISOString(),
  };
  const next = [run, ...readAll()].slice(0, MAX);
  writeAll(next);
  return run;
}

export function loadLocalDebriefs(limit = 12): LocalDebriefRun[] {
  return readAll().slice(0, limit);
}

export function clearLocalDebriefs() {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}
