import { getCharacters, getMission } from "@/content/harborline/world";
import type {
  CefrLevel,
  ComicScript,
  Emotion,
  SceneLearnerContext,
  SceneSession,
} from "@/content/types";

function offlineId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `offline-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Local comic from mission phrases — no AI. */
export function buildOfflineComic(missionId: string): ComicScript {
  const mission = getMission(missionId);
  const cast = getCharacters(mission.castIds);
  const lead = cast[0]!;
  const phrases = mission.targetPhrases.slice(0, 4);
  return {
    title: `${mission.title} (offline)`,
    missionId,
    panels: phrases.map((phrase, index) => ({
      index,
      caption:
        index === 0
          ? "Offline warmup — no AI. Read, then try the live beats."
          : mission.learningGoals[index],
      focusCharacterIds: [lead.id],
      targetPhrase: phrase,
      lines: [
        {
          speakerId: lead.id,
          text: phrase,
          gloss: mission.learningGoals[index] ?? "Useful phrase for this scene",
          emotion: "warm" as Emotion,
        },
      ],
    })),
    teachingNotes: [
      "Offline mode: phrases from the mission pack (no xAI call).",
      "Reconnect for full AI cast + debrief scoring.",
      ...mission.learningGoals.slice(0, 2),
    ],
  };
}

/**
 * Full offline scene start — comic + simple beats, no network.
 * Live replies still need AI when online; offline live uses scripted prompts only if extended later.
 */
export function buildOfflineSession(opts: {
  missionId: string;
  cefr: CefrLevel;
  includeComic?: boolean;
  learnerContext?: SceneLearnerContext;
  displayName?: string;
}): SceneSession {
  const mission = getMission(opts.missionId);
  const includeComic = opts.includeComic !== false;
  const now = new Date().toISOString();
  const cast = getCharacters(mission.castIds);
  const lead = cast[0]!;

  const beats = mission.successCriteria.map((c, i) => ({
    id: c.id,
    goal: c.description,
    hintSoft: `Try to cover: ${c.description.toLowerCase()}.`,
    hintPhrase: mission.targetPhrases[i] ?? mission.targetPhrases[0] ?? "Por favor",
    hintFull: mission.targetPhrases[i] ?? "Por favor.",
    completed: false,
  }));

  const comic = includeComic ? buildOfflineComic(opts.missionId) : undefined;

  return {
    id: offlineId(),
    missionId: mission.id,
    locationId: mission.locationId,
    castIds: mission.castIds,
    cefr: opts.cefr,
    cefrBaseline: opts.cefr,
    status: comic ? "comic" : "live",
    beats,
    turns: comic
      ? []
      : [
          {
            role: "npc",
            speakerId: lead.id,
            text:
              opts.cefr === "A1"
                ? "¡Hola! Bienvenido/a. ¿Qué deseas?"
                : "¡Hola! Dime, ¿en qué te puedo ayudar?",
            gloss: "Hi! Welcome. What would you like?",
            emotion: "warm",
            at: now,
          },
          {
            role: "system",
            text: "Offline scene — AI cast is unavailable. Use target phrases; reconnect for full dialogue.",
            at: now,
          },
        ],
    turnCount: 0,
    maxTurns: mission.maxTurns,
    comic,
    learnerContext: opts.learnerContext,
    createdAt: now,
    updatedAt: now,
  };
}
