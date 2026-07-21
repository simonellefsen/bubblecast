"use client";

import type { LearnerProfile } from "@/content/types";
import { createDefaultLearner } from "@/lib/session/store";

const KEY = "bubblecast-learner-v1";

export function loadLearner(): LearnerProfile {
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

export function saveLearner(learner: LearnerProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(learner));
}

export function resetLearner() {
  const fresh = createDefaultLearner();
  saveLearner(fresh);
  return fresh;
}
