import type { DebriefPacket, LearnerProfile, SceneSession } from "@/content/types";
import { harborline } from "@/content/harborline/world";

type GlobalStore = {
  scenes: Map<string, SceneSession>;
  debriefs: Map<string, DebriefPacket>;
};

function getStore(): GlobalStore {
  const g = globalThis as typeof globalThis & { __bubblecastStore?: GlobalStore };
  if (!g.__bubblecastStore) {
    g.__bubblecastStore = {
      scenes: new Map(),
      debriefs: new Map(),
    };
  }
  return g.__bubblecastStore;
}

export function saveScene(session: SceneSession) {
  getStore().scenes.set(session.id, session);
}

export function getScene(id: string): SceneSession | undefined {
  return getStore().scenes.get(id);
}

export function saveDebrief(sessionId: string, debrief: DebriefPacket) {
  getStore().debriefs.set(sessionId, debrief);
}

export function getDebrief(sessionId: string): DebriefPacket | undefined {
  return getStore().debriefs.get(sessionId);
}

export function createDefaultLearner(): LearnerProfile {
  const now = new Date().toISOString();
  return {
    id: "local-learner",
    displayName: "Traveler",
    cefr: "A1",
    targetLanguage: harborline.targetLanguage,
    nativeLanguage: harborline.nativeLanguage,
    completedMissionIds: [],
    vocab: [],
    relationships: harborline.characters.map((c) => ({
      characterId: c.id,
      score: 20,
      notes: "",
    })),
    xp: 0,
    createdAt: now,
    updatedAt: now,
  };
}

export function applyDebriefToLearner(
  learner: LearnerProfile,
  debrief: DebriefPacket,
  missionId: string,
): LearnerProfile {
  const completed = new Set(learner.completedMissionIds);
  if (debrief.outcome === "success" || debrief.outcome === "partial") {
    completed.add(missionId);
  }

  const relationships = learner.relationships.map((rel) => {
    const delta = debrief.relationshipDeltas.find(
      (d) => d.characterId === rel.characterId,
    );
    if (!delta) return rel;
    return {
      ...rel,
      score: Math.max(0, Math.min(100, rel.score + delta.delta)),
    };
  });

  const vocab = [...learner.vocab];
  for (const word of debrief.newWords) {
    const existing = vocab.find(
      (v) => v.word.toLowerCase() === word.word.toLowerCase(),
    );
    if (existing) {
      existing.timesSeen += 1;
      existing.lastSeenAt = new Date().toISOString();
      if (existing.status === "new") existing.status = "fuzzy";
    } else {
      vocab.unshift({
        word: word.word,
        gloss: word.gloss,
        status: "new",
        timesSeen: 1,
        lastSeenAt: new Date().toISOString(),
      });
    }
  }

  return {
    ...learner,
    completedMissionIds: [...completed],
    relationships,
    vocab: vocab.slice(0, 200),
    xp: learner.xp + debrief.xpEarned,
    updatedAt: new Date().toISOString(),
  };
}
