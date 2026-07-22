"use client";

import type { DebriefPacket, SceneSession } from "@/content/types";

const PREFIX = "bubblecast-active-scene-v1:";

export type StoredMissionState = {
  missionId: string;
  session: SceneSession;
  phase: "comic" | "live";
  savedAt: string;
};

function key(missionId: string) {
  return `${PREFIX}${missionId}`;
}

export function saveActiveScene(
  missionId: string,
  session: SceneSession,
  phase: "comic" | "live",
) {
  if (typeof window === "undefined") return;
  if (session.status === "ended") {
    clearActiveScene(missionId);
    return;
  }
  const payload: StoredMissionState = {
    missionId,
    session,
    phase,
    savedAt: new Date().toISOString(),
  };
  try {
    sessionStorage.setItem(key(missionId), JSON.stringify(payload));
  } catch {
    /* quota / private mode */
  }
}

export function loadActiveScene(missionId: string): StoredMissionState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key(missionId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredMissionState;
    if (!parsed?.session?.id || parsed.missionId !== missionId) return null;
    if (parsed.session.status === "ended") {
      clearActiveScene(missionId);
      return null;
    }
    // Drop stale sessions older than 6 hours
    const age = Date.now() - new Date(parsed.savedAt).getTime();
    if (Number.isFinite(age) && age > 6 * 60 * 60 * 1000) {
      clearActiveScene(missionId);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearActiveScene(missionId: string) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(key(missionId));
  } catch {
    /* ignore */
  }
}

/** Scan sessionStorage for any resumable Bubblecast scenes. */
export function listActiveScenes(): StoredMissionState[] {
  if (typeof window === "undefined") return [];
  const out: StoredMissionState[] = [];
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i);
      if (!k?.startsWith(PREFIX)) continue;
      const missionId = k.slice(PREFIX.length);
      const state = loadActiveScene(missionId);
      if (state) out.push(state);
    }
  } catch {
    return out;
  }
  return out.sort(
    (a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime(),
  );
}

export function saveLastDebrief(missionId: string, debrief: DebriefPacket) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(
      `bubblecast-last-debrief-v1:${missionId}`,
      JSON.stringify({ debrief, at: new Date().toISOString() }),
    );
  } catch {
    /* ignore */
  }
}
