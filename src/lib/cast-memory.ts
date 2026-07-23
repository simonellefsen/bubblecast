import type { CharacterId } from "@/content/types";
import { harborline } from "@/content/harborline/world";

export type BondTier = "stranger" | "acquaintance" | "familiar" | "close";

export function bondTier(score: number): BondTier {
  if (score >= 70) return "close";
  if (score >= 45) return "familiar";
  if (score >= 25) return "acquaintance";
  return "stranger";
}

export function bondLabel(score: number): string {
  switch (bondTier(score)) {
    case "close":
      return "close friend";
    case "familiar":
      return "familiar";
    case "acquaintance":
      return "acquaintance";
    default:
      return "new acquaintance";
  }
}

/** How the NPC should pitch register/warmth for this bond. */
export function bondToneGuidance(score: number): string {
  switch (bondTier(score)) {
    case "close":
      return "Warm, informal, light teasing OK; you remember shared moments.";
    case "familiar":
      return "Friendly and relaxed; slight familiarity without oversharing.";
    case "acquaintance":
      return "Polite but open; you recognize them from around town.";
    default:
      return "Polite distance; introduce yourself naturally if needed.";
  }
}

/** Split relationship notes into recent memory snippets (newest first). */
export function parseMemoryNotes(notes: string, max = 3): string[] {
  if (!notes?.trim()) return [];
  return notes
    .split(/\s*·\s*/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, max);
}

/**
 * Rebuild notes as newest-first stamps, capped by count and length.
 * Keeps debrief memories usable for prompts without unbounded growth.
 */
export function appendRelationshipNote(
  previousNotes: string,
  stamp: string,
  opts?: { maxStamps?: number; maxChars?: number },
): string {
  const maxStamps = opts?.maxStamps ?? 3;
  const maxChars = opts?.maxChars ?? 280;
  const clean = stamp.replace(/\s+/g, " ").trim().slice(0, 140);
  if (!clean) return previousNotes.slice(0, maxChars);
  const prior = parseMemoryNotes(previousNotes, maxStamps);
  const next = [clean, ...prior.filter((p) => p !== clean)].slice(0, maxStamps);
  return next.join(" · ").slice(0, maxChars);
}

/** Count completed missions that feature this character. */
export function scenesWithCharacter(
  characterId: CharacterId,
  completedMissionIds: string[],
): number {
  const done = new Set(completedMissionIds);
  return harborline.missions.filter(
    (m) => m.castIds.includes(characterId) && done.has(m.id),
  ).length;
}
