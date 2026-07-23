import type { DebriefPacket, LearnerProfile } from "@/content/types";
import { harborline } from "@/content/harborline/world";
import { appendRelationshipNote } from "@/lib/cast-memory";
import { scheduleNextReview } from "@/lib/srs";

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

  const missionTitle =
    harborline.missions.find((m) => m.id === missionId)?.title ?? missionId;
  const noteSnippet = (debrief.castReaction || debrief.summary || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

  const relationships = learner.relationships.map((rel) => {
    const delta = debrief.relationshipDeltas.find(
      (d) => d.characterId === rel.characterId,
    );
    if (!delta) return rel;
    const score = Math.max(0, Math.min(100, rel.score + delta.delta));
    const stamp = `${missionTitle}: ${
      noteSnippet || (delta.delta >= 0 ? "good scene together" : "awkward beat")
    }`;
    const notes = appendRelationshipNote(rel.notes, stamp);
    return { ...rel, score, notes };
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
      if (!existing.nextReviewAt) {
        existing.nextReviewAt = scheduleNextReview(existing.status);
      }
    } else {
      vocab.unshift({
        word: word.word,
        gloss: word.gloss,
        status: "new",
        timesSeen: 1,
        lastSeenAt: new Date().toISOString(),
        nextReviewAt: scheduleNextReview("new"),
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
