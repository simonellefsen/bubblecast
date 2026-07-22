"use client";

import type { DebriefPacket, LearnerProfile } from "@/content/types";
import { createDefaultLearner } from "@/lib/session/store";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import type { VocabEntry } from "@/content/types";
import { scheduleNextReview } from "@/lib/srs";
import {
  fetchLearnerFromSupabase,
  persistDebrief,
  persistLearnerProfile,
  persistVocabEntry,
  resetRemoteLearner,
} from "@/lib/supabase/learner-sync";

const KEY = "bubblecast-learner-v1";

export type ProgressBackup = {
  version: 1;
  exportedAt: string;
  learner: LearnerProfile;
};

function loadLocal(): LearnerProfile {
  if (typeof window === "undefined") return createDefaultLearner();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) {
      const fresh = createDefaultLearner();
      localStorage.setItem(KEY, JSON.stringify(fresh));
      return fresh;
    }
    return JSON.parse(raw) as LearnerProfile;
  } catch {
    return createDefaultLearner();
  }
}

function saveLocal(learner: LearnerProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(learner));
}

/** Sync: local cache always; Supabase when configured. */
export function loadLearner(): LearnerProfile {
  return loadLocal();
}

export function saveLearner(learner: LearnerProfile) {
  saveLocal(learner);
  if (isSupabaseConfigured()) {
    void persistLearnerProfile(learner);
  }
}

/**
 * Prefer Supabase profile when available; fall back to localStorage.
 * Migrates local-only progress onto first cloud profile if remote is empty.
 */
export async function hydrateLearner(): Promise<{
  learner: LearnerProfile;
  source: "supabase" | "local";
  error?: string;
}> {
  if (!isSupabaseConfigured()) {
    return { learner: loadLocal(), source: "local" };
  }

  try {
    const remote = await fetchLearnerFromSupabase();
    if (remote) {
      // If remote is brand-new (0 XP, no missions) but local has progress, push local up
      const local = loadLocal();
      const remoteEmpty =
        remote.xp === 0 &&
        remote.completedMissionIds.length === 0 &&
        remote.vocab.length === 0;
      const localHasProgress =
        local.xp > 0 ||
        local.completedMissionIds.length > 0 ||
        local.vocab.length > 0;

      if (remoteEmpty && localHasProgress) {
        const migrated: LearnerProfile = {
          ...local,
          id: remote.id,
          createdAt: remote.createdAt,
          updatedAt: new Date().toISOString(),
        };
        saveLocal(migrated);
        await persistLearnerProfile(migrated);
        // push vocab/rels via a no-op debrief path would be heavy; profile + relationships
        for (const r of migrated.relationships) {
          // relationships saved in persistDebrief; do a lightweight profile persist only
          void r;
        }
        // re-persist full state by saving relationships/vocab in a dedicated call
        await persistLearnerProfile(migrated);
        const { getSupabaseBrowserClient } = await import("@/lib/supabase/client");
        const { ensureBubblecastUser } = await import("@/lib/supabase/learner-sync");
        const ensured = await ensureBubblecastUser();
        const sb = getSupabaseBrowserClient();
        if (sb && ensured?.userId) {
          if (migrated.relationships.length) {
            await sb.from("bubblecast_relationships").upsert(
              migrated.relationships.map((r) => ({
                user_id: ensured.userId,
                character_id: r.characterId,
                score: r.score,
                notes: r.notes,
              })),
              { onConflict: "user_id,character_id" },
            );
          }
          for (const v of migrated.vocab.slice(0, 200)) {
            await sb.from("bubblecast_vocab").upsert(
              {
                user_id: ensured.userId,
                word: v.word,
                gloss: v.gloss,
                status: v.status,
                times_seen: v.timesSeen,
                last_seen_at: v.lastSeenAt,
              },
              { onConflict: "user_id,word" },
            );
          }
        }
        return { learner: migrated, source: "supabase" };
      }

      saveLocal(remote);
      return { learner: remote, source: "supabase" };
    }
    return {
      learner: loadLocal(),
      source: "local",
      error: "Could not load cloud profile; using local progress.",
    };
  } catch (e) {
    return {
      learner: loadLocal(),
      source: "local",
      error: e instanceof Error ? e.message : "Cloud hydrate failed",
    };
  }
}

export async function saveLearnerAfterDebrief(
  learner: LearnerProfile,
  missionId: string,
  debrief: DebriefPacket,
): Promise<{ error?: string }> {
  saveLocal(learner);
  if (!isSupabaseConfigured()) return {};
  const result = await persistDebrief(learner, missionId, debrief);
  if (!result.ok) return { error: result.error };
  return {};
}

export function updateVocabStatus(
  learner: LearnerProfile,
  word: string,
  status: VocabEntry["status"],
): LearnerProfile {
  const now = new Date().toISOString();
  const vocab = learner.vocab.map((v) =>
    v.word.toLowerCase() === word.toLowerCase()
      ? {
          ...v,
          status,
          timesSeen: v.timesSeen + 1,
          lastSeenAt: now,
          nextReviewAt: scheduleNextReview(status),
        }
      : v,
  );
  const next = { ...learner, vocab, updatedAt: now };
  saveLocal(next);
  if (isSupabaseConfigured()) {
    const entry = vocab.find((v) => v.word.toLowerCase() === word.toLowerCase());
    if (entry) void persistVocabEntry(entry);
  }
  return next;
}

export function exportProgressBackup(): ProgressBackup {
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    learner: loadLocal(),
  };
}

export function importProgressBackup(raw: unknown): {
  ok: true;
  learner: LearnerProfile;
} | {
  ok: false;
  error: string;
} {
  try {
    const data = raw as ProgressBackup;
    if (!data || data.version !== 1 || !data.learner?.displayName) {
      return { ok: false, error: "Not a valid Bubblecast backup (v1)." };
    }
    const learner: LearnerProfile = {
      ...createDefaultLearner(),
      ...data.learner,
      vocab: Array.isArray(data.learner.vocab) ? data.learner.vocab : [],
      relationships: Array.isArray(data.learner.relationships)
        ? data.learner.relationships
        : createDefaultLearner().relationships,
      completedMissionIds: Array.isArray(data.learner.completedMissionIds)
        ? data.learner.completedMissionIds
        : [],
      updatedAt: new Date().toISOString(),
    };
    saveLocal(learner);
    if (isSupabaseConfigured()) {
      void persistLearnerProfile(learner);
    }
    return { ok: true, learner };
  } catch {
    return { ok: false, error: "Could not parse backup file." };
  }
}

export async function resetLearner(): Promise<LearnerProfile> {
  const fresh = createDefaultLearner();
  if (isSupabaseConfigured()) {
    const remote = await resetRemoteLearner();
    if (remote.ok) {
      const hydrated = await fetchLearnerFromSupabase();
      if (hydrated) {
        saveLocal(hydrated);
        return hydrated;
      }
    }
  }
  saveLocal(fresh);
  return fresh;
}
