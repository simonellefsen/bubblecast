import type { CefrLevel, DebriefPacket } from "@/content/types";

const ORDER: CefrLevel[] = ["A1", "A2", "B1", "B2"];

function step(level: CefrLevel, delta: -1 | 1): CefrLevel {
  const i = ORDER.indexOf(level);
  const next = Math.max(0, Math.min(ORDER.length - 1, i + delta));
  return ORDER[next];
}

export type CefrNudge = {
  suggested: CefrLevel;
  reason: string;
  direction: "up" | "down" | "stay";
};

/**
 * Soft suggestion only — never auto-changes the learner's CEFR.
 */
export function suggestCefrNudge(
  current: CefrLevel,
  debrief: DebriefPacket,
): CefrNudge {
  if (debrief.outcome === "success" && debrief.score >= 85) {
    const suggested = step(current, 1);
    if (suggested !== current) {
      return {
        suggested,
        direction: "up",
        reason: `Strong run (${debrief.score}/100). Try CEFR ${suggested} for a bit more stretch.`,
      };
    }
  }
  if (
    (debrief.outcome === "fail" || debrief.score < 40) &&
    debrief.outcome !== "success"
  ) {
    const suggested = step(current, -1);
    if (suggested !== current) {
      return {
        suggested,
        direction: "down",
        reason: `Tough scene (${debrief.score}/100). CEFR ${suggested} may feel more comfortable.`,
      };
    }
  }
  return {
    suggested: current,
    direction: "stay",
    reason: `CEFR ${current} still looks like a good fit.`,
  };
}
