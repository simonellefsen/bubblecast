"use client";

import type { LearnerProfile } from "@/content/types";
import { loadStreak } from "@/lib/streak";

const KEY = "bubblecast-achievements-v1";

export type AchievementId =
  | "first_scene"
  | "three_scenes"
  | "harborline_cleared"
  | "night_ferry"
  | "vocab_five"
  | "vocab_known_three"
  | "streak_3"
  | "streak_7";

export type Achievement = {
  id: AchievementId;
  title: string;
  description: string;
  emoji: string;
};

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: "first_scene",
    title: "First curtain",
    description: "Complete your first mission debrief.",
    emoji: "🎭",
  },
  {
    id: "three_scenes",
    title: "Ensemble player",
    description: "Complete 3 missions.",
    emoji: "🎬",
  },
  {
    id: "harborline_cleared",
    title: "City walker",
    description: "Complete every Harborline mission.",
    emoji: "🗺️",
  },
  {
    id: "night_ferry",
    title: "Night crossing",
    description: "Finish the night ferry scene.",
    emoji: "⛴️",
  },
  {
    id: "vocab_five",
    title: "Phrase collector",
    description: "Collect 5 journal words.",
    emoji: "📒",
  },
  {
    id: "vocab_known_three",
    title: "Getting sticky",
    description: "Mark 3 words as known.",
    emoji: "⭐",
  },
  {
    id: "streak_3",
    title: "Three-day habit",
    description: "Stay active 3 days in a row.",
    emoji: "🔥",
  },
  {
    id: "streak_7",
    title: "Week on stage",
    description: "Stay active 7 days in a row.",
    emoji: "🏆",
  },
];

export type AchievementState = {
  unlocked: AchievementId[];
  unlockedAt: Partial<Record<AchievementId, string>>;
};

export function loadAchievements(): AchievementState {
  if (typeof window === "undefined") {
    return { unlocked: [], unlockedAt: {} };
  }
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { unlocked: [], unlockedAt: {} };
    return JSON.parse(raw) as AchievementState;
  } catch {
    return { unlocked: [], unlockedAt: {} };
  }
}

function saveAchievements(state: AchievementState) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

function qualifies(
  id: AchievementId,
  learner: LearnerProfile,
  streakCount: number,
): boolean {
  const done = learner.completedMissionIds.length;
  switch (id) {
    case "first_scene":
      return done >= 1;
    case "three_scenes":
      return done >= 3;
    case "harborline_cleared":
      return done >= 7;
    case "night_ferry":
      return learner.completedMissionIds.includes("night-ferry-chat");
    case "vocab_five":
      return learner.vocab.length >= 5;
    case "vocab_known_three":
      return learner.vocab.filter((v) => v.status === "known").length >= 3;
    case "streak_3":
      return streakCount >= 3;
    case "streak_7":
      return streakCount >= 7;
    default:
      return false;
  }
}

/** Evaluate achievements; returns newly unlocked ones. */
export function evaluateAchievements(learner: LearnerProfile): Achievement[] {
  const streakCount = loadStreak().count;
  const state = loadAchievements();
  const newly: Achievement[] = [];
  const unlocked = new Set(state.unlocked);
  const unlockedAt = { ...state.unlockedAt };
  const now = new Date().toISOString();

  for (const a of ACHIEVEMENTS) {
    if (unlocked.has(a.id)) continue;
    if (qualifies(a.id, learner, streakCount)) {
      unlocked.add(a.id);
      unlockedAt[a.id] = now;
      newly.push(a);
    }
  }

  if (newly.length) {
    saveAchievements({ unlocked: [...unlocked], unlockedAt });
  }
  return newly;
}

export function listUnlockedAchievements(): Achievement[] {
  const state = loadAchievements();
  const set = new Set(state.unlocked);
  return ACHIEVEMENTS.filter((a) => set.has(a.id));
}
