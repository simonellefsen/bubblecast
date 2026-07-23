import type { CefrLevel, SceneSession, SceneTurn } from "@/content/types";

const ORDER: CefrLevel[] = ["A1", "A2", "B1", "B2"];

export type SceneDifficultyPref = "easier" | "match" | "stretch";

export function stepCefr(level: CefrLevel, delta: -1 | 0 | 1): CefrLevel {
  const i = ORDER.indexOf(level);
  const next = Math.max(0, Math.min(ORDER.length - 1, i + delta));
  return ORDER[next]!;
}

/**
 * Resolve CEFR for this scene from profile + mission + learner preference.
 * Does not mutate the profile — only the scene session.
 */
export function resolveSceneCefr(
  profileCefr: CefrLevel,
  missionDifficulty: CefrLevel,
  pref: SceneDifficultyPref = "match",
): CefrLevel {
  if (pref === "match") {
    // Prefer learner level, but don't jump more than 1 above mission band
    const p = ORDER.indexOf(profileCefr);
    const m = ORDER.indexOf(missionDifficulty);
    if (p > m + 1) return ORDER[m + 1]!;
    return profileCefr;
  }
  if (pref === "easier") {
    // Prefer easier of profile-1 vs mission band
    const easier = stepCefr(profileCefr, -1);
    const m = ORDER.indexOf(missionDifficulty);
    const e = ORDER.indexOf(easier);
    return ORDER[Math.min(m, e)] ?? easier;
  }
  // stretch: one level above profile (scene-only)
  return stepCefr(profileCefr, 1);
}

const SPANISH_MARKERS =
  /[áéíóúüñ¿¡]|(\b(hola|gracias|por\s+favor|quiero|quisiera|necesito|dónde|cuánto|buen[oa]s?|disculpe|perdón|café|tren|habitación|sí|está|puedo|me\s+gustaría)\b)/i;

/** True if text looks primarily English (learner avoided Spanish). */
export function looksPrimarilyEnglish(text: string): boolean {
  const t = text.trim();
  if (t.length < 2) return false;
  if (SPANISH_MARKERS.test(t)) return false;
  // Latin letters only, common English stop-words
  if (/\b(the|and|please|want|have|is|are|can|you|i|my|for|with|hello|thanks|coffee|train)\b/i.test(t)) {
    return true;
  }
  // No Spanish markers and mostly ASCII letters → treat as English attempt
  const letters = t.replace(/[^a-zA-ZÀ-ÿ]/g, "");
  if (letters.length < 3) return false;
  return !/[áéíóúüñ]/i.test(letters) && /[a-zA-Z]{3,}/.test(t);
}

/** True if learner wrote multi-word Spanish-ish content. */
export function looksCapableSpanish(text: string): boolean {
  const t = text.trim();
  if (t.split(/\s+/).length < 2) return false;
  return SPANISH_MARKERS.test(t) || /[áéíóúüñ¿¡]/i.test(t);
}

export type MidMissionAdapt = {
  cefr: CefrLevel;
  direction: "up" | "down";
  message: string;
};

/**
 * Soft mid-mission CEFR adjust (at most once). Scene-only — never profile.
 * Returns null if no change.
 */
export function evaluateMidMissionCefr(
  session: SceneSession,
): MidMissionAdapt | null {
  if (session.cefrAdapted) return null;
  if (session.turnCount < 2) return null;

  const learnerTurns = session.turns
    .filter((t): t is SceneTurn & { role: "learner" } => t.role === "learner")
    .slice(-3);
  if (learnerTurns.length < 2) return null;

  const englishHeavy =
    learnerTurns.filter((t) => looksPrimarilyEnglish(t.text)).length >= 2;
  const spanishCapable =
    learnerTurns.filter((t) => looksCapableSpanish(t.text)).length >= 2;

  const beatsDone = session.beats.filter((b) => b.completed).length;
  const beatRatio =
    session.beats.length > 0 ? beatsDone / session.beats.length : 0;

  const baseline = session.cefrBaseline ?? session.cefr;

  if (englishHeavy && beatRatio < 0.5) {
    const next = stepCefr(session.cefr, -1);
    if (next === session.cefr) return null;
    // Don't drop more than 1 below baseline
    if (ORDER.indexOf(next) < ORDER.indexOf(baseline) - 1) return null;
    return {
      cefr: next,
      direction: "down",
      message: `Coach: easing language to CEFR ${next} for a bit — simpler Spanish, more glosses.`,
    };
  }

  if (spanishCapable && beatRatio >= 0.5 && session.turnCount >= 3) {
    const next = stepCefr(session.cefr, 1);
    if (next === session.cefr) return null;
    if (ORDER.indexOf(next) > ORDER.indexOf(baseline) + 1) return null;
    return {
      cefr: next,
      direction: "up",
      message: `Coach: stretching to CEFR ${next} — cast may use a bit richer Spanish.`,
    };
  }

  return null;
}

/** Apply adapt result onto a cloned session shape. */
export function applyMidMissionCefr(
  session: SceneSession,
  adapt: MidMissionAdapt,
): SceneSession {
  return {
    ...session,
    cefr: adapt.cefr,
    cefrAdapted: true,
    cefrBaseline: session.cefrBaseline ?? session.cefr,
    turns: [
      ...session.turns,
      {
        role: "system",
        text: adapt.message,
        at: new Date().toISOString(),
      },
    ],
    updatedAt: new Date().toISOString(),
  };
}
