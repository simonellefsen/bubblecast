import type { LearnerProfile, SceneLearnerContext } from "@/content/types";

/** Build a compact context blob for scene prompts (no PII beyond display name). */
export function buildSceneLearnerContext(
  learner: LearnerProfile,
  castIds: string[],
): SceneLearnerContext {
  const relationships = learner.relationships
    .filter((r) => castIds.includes(r.characterId))
    .map((r) => ({
      characterId: r.characterId,
      score: r.score,
      notes: r.notes,
    }));

  const focusVocab = [...learner.vocab]
    .sort((a, b) => {
      const rank = (s: string) => (s === "new" ? 0 : s === "fuzzy" ? 1 : 2);
      return rank(a.status) - rank(b.status);
    })
    .slice(0, 8)
    .map((v) => ({ word: v.word, gloss: v.gloss, status: v.status }));

  return {
    displayName: learner.displayName,
    relationships,
    focusVocab,
  };
}
