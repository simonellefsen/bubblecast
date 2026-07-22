"use client";

import type {
  CefrLevel,
  CharacterId,
  DebriefPacket,
  LearnerProfile,
  VocabEntry,
} from "@/content/types";
import { harborline } from "@/content/harborline/world";
import { createDefaultLearner } from "@/lib/session/store";
import { getSupabaseBrowserClient, isSupabaseConfigured } from "./client";

type ProfileRow = {
  id: string;
  display_name: string;
  cefr: string;
  target_language: string;
  native_language: string;
  xp: number;
  completed_mission_ids: string[] | null;
  created_at: string;
  updated_at: string;
};

type VocabRow = {
  word: string;
  gloss: string;
  status: string;
  times_seen: number;
  last_seen_at: string;
  next_review_at?: string | null;
};

type RelationshipRow = {
  character_id: string;
  score: number;
  notes: string;
};

/**
 * Ensure anonymous (or existing) auth session + bubblecast.profiles row.
 * Lazy profile creation — no global auth.users triggers for other apps.
 */
export async function ensureBubblecastUser(): Promise<{
  userId: string;
  error?: string;
} | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError) {
    return { userId: "", error: sessionError.message };
  }

  let userId = session?.user?.id;
  if (!userId) {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error || !data.user) {
      return {
        userId: "",
        error:
          error?.message ??
          "Anonymous sign-in failed. Enable Anonymous auth in Supabase dashboard.",
      };
    }
    userId = data.user.id;
  }

  const { data: existing, error: selectError } = await supabase
    .from("bubblecast_profiles")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (selectError) {
    return { userId, error: selectError.message };
  }

  if (!existing) {
    const defaults = createDefaultLearner();
    const { error: insertError } = await supabase.from("bubblecast_profiles").insert({
      id: userId,
      display_name: defaults.displayName,
      cefr: defaults.cefr,
      target_language: defaults.targetLanguage,
      native_language: defaults.nativeLanguage,
      xp: 0,
      completed_mission_ids: [],
    });
    if (insertError) {
      return { userId, error: insertError.message };
    }

    // Seed cast relationships
    const relRows = harborline.characters.map((c) => ({
      user_id: userId,
      character_id: c.id,
      score: 20,
      notes: "",
    }));
    await supabase.from("bubblecast_relationships").upsert(relRows, {
      onConflict: "user_id,character_id",
    });
  }

  return { userId };
}

export async function fetchLearnerFromSupabase(): Promise<LearnerProfile | null> {
  const ensured = await ensureBubblecastUser();
  if (!ensured?.userId || ensured.error) return null;

  const supabase = getSupabaseBrowserClient();
  if (!supabase) return null;
  const userId = ensured.userId;

  const [profileRes, vocabRes, relRes] = await Promise.all([
    supabase.from("bubblecast_profiles").select("*").eq("id", userId).single(),
    supabase
      .from("bubblecast_vocab")
      .select("word,gloss,status,times_seen,last_seen_at,next_review_at")
      .eq("user_id", userId)
      .order("last_seen_at", { ascending: false }),
    supabase
      .from("bubblecast_relationships")
      .select("character_id,score,notes")
      .eq("user_id", userId),
  ]);

  if (profileRes.error || !profileRes.data) return null;

  const profile = profileRes.data as ProfileRow;
  const vocabRows = (vocabRes.data ?? []) as VocabRow[];
  const relRows = (relRes.data ?? []) as RelationshipRow[];

  const relMap = new Map(relRows.map((r) => [r.character_id, r]));
  const relationships = harborline.characters.map((c) => {
    const row = relMap.get(c.id);
    return {
      characterId: c.id as CharacterId,
      score: row?.score ?? 20,
      notes: row?.notes ?? "",
    };
  });

  const vocab: VocabEntry[] = vocabRows.map((v) => ({
    word: v.word,
    gloss: v.gloss,
    status: (["new", "fuzzy", "known"].includes(v.status)
      ? v.status
      : "new") as VocabEntry["status"],
    timesSeen: v.times_seen,
    lastSeenAt: v.last_seen_at,
    nextReviewAt: v.next_review_at ?? undefined,
  }));

  return {
    id: profile.id,
    displayName: profile.display_name,
    cefr: (profile.cefr as CefrLevel) || "A1",
    targetLanguage: profile.target_language,
    nativeLanguage: profile.native_language,
    completedMissionIds: profile.completed_mission_ids ?? [],
    vocab,
    relationships,
    xp: profile.xp ?? 0,
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

export type MissionRunRow = {
  id: string;
  mission_id: string;
  outcome: "success" | "partial" | "fail";
  score: number;
  xp_earned: number;
  summary: string;
  created_at: string;
};

export async function fetchMissionHistory(
  limit = 12,
): Promise<{ runs: MissionRunRow[]; error?: string }> {
  if (!isSupabaseConfigured()) return { runs: [] };
  const ensured = await ensureBubblecastUser();
  if (!ensured?.userId) {
    return { runs: [], error: ensured?.error };
  }
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { runs: [] };

  const { data, error } = await supabase
    .from("bubblecast_mission_runs")
    .select("id,mission_id,outcome,score,xp_earned,summary,created_at")
    .eq("user_id", ensured.userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return { runs: [], error: error.message };
  return { runs: (data ?? []) as MissionRunRow[] };
}

export async function persistVocabEntry(
  entry: VocabEntry,
): Promise<{ ok: boolean; error?: string }> {
  const ensured = await ensureBubblecastUser();
  if (!ensured?.userId) {
    return { ok: false, error: ensured?.error ?? "Not signed in" };
  }
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "Supabase not configured" };

  const { error } = await supabase.from("bubblecast_vocab").upsert(
    {
      user_id: ensured.userId,
      word: entry.word,
      gloss: entry.gloss,
      status: entry.status,
      times_seen: entry.timesSeen,
      last_seen_at: entry.lastSeenAt,
      next_review_at: entry.nextReviewAt ?? null,
    },
    { onConflict: "user_id,word" },
  );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function persistLearnerProfile(
  learner: LearnerProfile,
): Promise<{ ok: boolean; error?: string }> {
  const ensured = await ensureBubblecastUser();
  if (!ensured?.userId) {
    return { ok: false, error: ensured?.error ?? "Not signed in" };
  }
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "Supabase not configured" };

  const { error } = await supabase
    .from("bubblecast_profiles")
    .update({
      display_name: learner.displayName,
      cefr: learner.cefr,
      target_language: learner.targetLanguage,
      native_language: learner.nativeLanguage,
      xp: learner.xp,
      completed_mission_ids: learner.completedMissionIds,
    })
    .eq("id", ensured.userId);

  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Full cloud write of profile + relationships + vocab for the current user. */
export async function pushFullLearnerProgress(
  learner: LearnerProfile,
): Promise<{ ok: boolean; error?: string }> {
  const ensured = await ensureBubblecastUser();
  if (!ensured?.userId) {
    return { ok: false, error: ensured?.error ?? "Not signed in" };
  }
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "Supabase not configured" };
  const userId = ensured.userId;

  const withId: LearnerProfile = {
    ...learner,
    id: userId,
    updatedAt: new Date().toISOString(),
  };

  const profileResult = await persistLearnerProfile(withId);
  if (!profileResult.ok) return profileResult;

  if (withId.relationships.length) {
    const { error: relError } = await supabase.from("bubblecast_relationships").upsert(
      withId.relationships.map((r) => ({
        user_id: userId,
        character_id: r.characterId,
        score: r.score,
        notes: r.notes,
      })),
      { onConflict: "user_id,character_id" },
    );
    if (relError) return { ok: false, error: relError.message };
  }

  for (const v of withId.vocab.slice(0, 200)) {
    const { error: vocabError } = await supabase.from("bubblecast_vocab").upsert(
      {
        user_id: userId,
        word: v.word,
        gloss: v.gloss,
        status: v.status,
        times_seen: v.timesSeen,
        last_seen_at: v.lastSeenAt,
        next_review_at: v.nextReviewAt ?? null,
      },
      { onConflict: "user_id,word" },
    );
    if (vocabError) return { ok: false, error: vocabError.message };
  }

  return { ok: true };
}

export async function persistDebrief(
  learner: LearnerProfile,
  missionId: string,
  debrief: DebriefPacket,
): Promise<{ ok: boolean; error?: string }> {
  const ensured = await ensureBubblecastUser();
  if (!ensured?.userId) {
    return { ok: false, error: ensured?.error ?? "Not signed in" };
  }
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "Supabase not configured" };
  const userId = ensured.userId;

  // Profile snapshot after debrief applied locally
  const { error: profileError } = await supabase
    .from("bubblecast_profiles")
    .update({
      display_name: learner.displayName,
      cefr: learner.cefr,
      xp: learner.xp,
      completed_mission_ids: learner.completedMissionIds,
    })
    .eq("id", userId);
  if (profileError) return { ok: false, error: profileError.message };

  // Relationships
  if (learner.relationships.length) {
    const { error: relError } = await supabase
      .from("bubblecast_relationships")
      .upsert(
        learner.relationships.map((r) => ({
          user_id: userId,
          character_id: r.characterId,
          score: r.score,
          notes: r.notes,
        })),
        { onConflict: "user_id,character_id" },
      );
    if (relError) return { ok: false, error: relError.message };
  }

  // Vocab upsert
  if (debrief.newWords.length) {
    for (const w of debrief.newWords) {
      const existing = learner.vocab.find(
        (v) => v.word.toLowerCase() === w.word.toLowerCase(),
      );
      const { error: vocabError } = await supabase.from("bubblecast_vocab").upsert(
        {
          user_id: userId,
          word: w.word,
          gloss: w.gloss,
          status: existing?.status ?? "new",
          times_seen: existing?.timesSeen ?? 1,
          last_seen_at: existing?.lastSeenAt ?? new Date().toISOString(),
          next_review_at: existing?.nextReviewAt ?? null,
        },
        { onConflict: "user_id,word" },
      );
      if (vocabError) return { ok: false, error: vocabError.message };
    }
  }

  // Mission run log
  const { error: runError } = await supabase.from("bubblecast_mission_runs").insert({
    user_id: userId,
    mission_id: missionId,
    outcome: debrief.outcome,
    score: debrief.score,
    xp_earned: debrief.xpEarned,
    summary: debrief.summary,
    debrief: debrief as unknown as Record<string, unknown>,
  });
  if (runError) return { ok: false, error: runError.message };

  return { ok: true };
}

export async function resetRemoteLearner(): Promise<{ ok: boolean; error?: string }> {
  const ensured = await ensureBubblecastUser();
  if (!ensured?.userId) {
    return { ok: false, error: ensured?.error ?? "Not signed in" };
  }
  const supabase = getSupabaseBrowserClient();
  if (!supabase) return { ok: false, error: "Supabase not configured" };
  const userId = ensured.userId;

  await supabase.from("bubblecast_vocab").delete().eq("user_id", userId);
  await supabase.from("bubblecast_relationships").delete().eq("user_id", userId);
  await supabase.from("bubblecast_mission_runs").delete().eq("user_id", userId);

  const defaults = createDefaultLearner();
  const { error } = await supabase
    .from("bubblecast_profiles")
    .update({
      display_name: defaults.displayName,
      cefr: defaults.cefr,
      xp: 0,
      completed_mission_ids: [],
    })
    .eq("id", userId);
  if (error) return { ok: false, error: error.message };

  await supabase.from("bubblecast_relationships").upsert(
    harborline.characters.map((c) => ({
      user_id: userId,
      character_id: c.id,
      score: 20,
      notes: "",
    })),
    { onConflict: "user_id,character_id" },
  );

  return { ok: true };
}
