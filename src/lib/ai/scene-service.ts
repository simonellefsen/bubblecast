import { generateObject } from "ai";
import { randomUUID } from "crypto";
import {
  getCharacter,
  getCharacters,
  getLocation,
  getMission,
} from "@/content/harborline/world";
import type {
  CefrLevel,
  CharacterId,
  ComicScript,
  DebriefPacket,
  Emotion,
  LearnerProfile,
  SceneBeat,
  SceneSession,
  SceneTurn,
} from "@/content/types";
import { getModel } from "./client";
import {
  comicScriptSchema,
  debriefSchema,
  npcResponseSchema,
  scenePlanSchema,
} from "./schemas";
import {
  actorSystemPrompt,
  actorUserPrompt,
  comicSystemPrompt,
  comicUserPrompt,
  debriefSystemPrompt,
  debriefUserPrompt,
  directorSystemPrompt,
  directorUserPrompt,
} from "./prompts";

function fallbackComic(missionId: string): ComicScript {
  const mission = getMission(missionId);
  const cast = getCharacters(mission.castIds);
  const lead = cast[0];
  return {
    title: mission.title,
    missionId,
    panels: mission.targetPhrases.slice(0, 3).map((phrase, index) => ({
      index,
      caption: index === 0 ? "A useful phrase for this scene" : undefined,
      focusCharacterIds: [lead.id],
      targetPhrase: phrase,
      lines: [
        {
          speakerId: lead.id,
          text: phrase,
          gloss: "Listen and try this phrase",
          emotion: "warm" as Emotion,
        },
      ],
    })),
    teachingNotes: [
      "Offline fallback comic — add XAI_API_KEY for full generation.",
      ...mission.learningGoals.slice(0, 2),
    ],
  };
}

type ScenePlan = {
  openingNarration: string;
  beats: SceneBeat[];
  openingNpcTurns: {
    speakerId: CharacterId;
    text: string;
    gloss?: string;
    emotion: Emotion;
    stageNote?: string;
  }[];
};

function fallbackPlan(missionId: string, cefr: CefrLevel): ScenePlan {
  const mission = getMission(missionId);
  const lead = getCharacter(mission.castIds[0]);
  const beats: SceneBeat[] = mission.successCriteria.map((c, i) => ({
    id: c.id,
    goal: c.description,
    hintSoft: `Try to cover: ${c.description.toLowerCase()}.`,
    hintPhrase: mission.targetPhrases[i] ?? mission.targetPhrases[0],
    hintFull: mission.targetPhrases[i] ?? "Por favor.",
    completed: false,
  }));
  return {
    openingNarration: `You step into the scene. ${lead.name} looks your way.`,
    beats,
    openingNpcTurns: [
      {
        speakerId: lead.id,
        text:
          cefr === "A1"
            ? "¡Hola! Bienvenido/a. ¿Qué deseas?"
            : "¡Hola! Dime, ¿en qué te puedo ayudar?",
        gloss: "Hi! Welcome. What would you like?",
        emotion: "warm",
      },
    ],
  };
}

function cloneSession(session: SceneSession): SceneSession {
  return structuredClone(session);
}

function assertActiveSession(session: SceneSession) {
  if (session.status === "ended") {
    throw new Error("Scene already ended");
  }
}

export async function generateComic(missionId: string): Promise<ComicScript> {
  const mission = getMission(missionId);
  const cast = getCharacters(mission.castIds);
  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: comicScriptSchema,
      system: comicSystemPrompt(),
      prompt: comicUserPrompt(mission, cast),
    });
    return {
      ...object,
      missionId,
      panels: object.panels.map((p) => ({
        ...p,
        focusCharacterIds: p.focusCharacterIds as CharacterId[],
        lines: p.lines.map((l) => ({
          ...l,
          speakerId: l.speakerId as ComicScript["panels"][0]["lines"][0]["speakerId"],
          emotion: l.emotion as Emotion | undefined,
        })),
      })),
    };
  } catch {
    return fallbackComic(missionId);
  }
}

export async function startScene(opts: {
  missionId: string;
  learner: Pick<LearnerProfile, "cefr" | "displayName">;
  includeComic?: boolean;
}): Promise<SceneSession> {
  const mission = getMission(opts.missionId);
  const location = getLocation(mission.locationId);
  const cast = getCharacters(mission.castIds);

  let plan: ScenePlan = fallbackPlan(opts.missionId, opts.learner.cefr);
  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: scenePlanSchema,
      system: directorSystemPrompt(),
      prompt: directorUserPrompt(mission, location, cast, opts.learner),
    });
    plan = {
      openingNarration: object.openingNarration,
      beats: object.beats.map((b) => ({ ...b, completed: false })),
      openingNpcTurns: object.openingNpcTurns.map((t) => ({
        speakerId: t.speakerId as CharacterId,
        text: t.text,
        gloss: t.gloss,
        emotion: t.emotion as Emotion,
        stageNote: t.stageNote,
      })),
    };
  } catch {
    // use fallback
  }

  let comic: ComicScript | undefined;
  if (opts.includeComic !== false) {
    comic = await generateComic(opts.missionId);
  }

  const now = new Date().toISOString();
  const turns: SceneTurn[] = [
    {
      role: "system",
      text: plan.openingNarration,
      at: now,
    },
    ...plan.openingNpcTurns.map((t) => ({
      role: "npc" as const,
      speakerId: t.speakerId as CharacterId,
      text: t.text,
      gloss: t.gloss,
      emotion: t.emotion,
      at: now,
    })),
  ];

  return {
    id: randomUUID(),
    missionId: mission.id,
    locationId: mission.locationId,
    castIds: mission.castIds,
    cefr: opts.learner.cefr,
    status: "comic",
    beats: plan.beats,
    turns,
    turnCount: 0,
    maxTurns: mission.maxTurns,
    comic,
    createdAt: now,
    updatedAt: now,
  };
}

/** Serverless-safe: mutates a copy of the client-provided session. */
export function beginLive(session: SceneSession): SceneSession {
  const next = cloneSession(session);
  assertActiveSession(next);
  next.status = "live";
  next.updatedAt = new Date().toISOString();
  return next;
}

export async function learnerTurn(
  session: SceneSession,
  text: string,
): Promise<SceneSession> {
  const next = cloneSession(session);
  assertActiveSession(next);
  if (next.status === "comic") next.status = "live";

  const now = new Date().toISOString();
  next.turns.push({
    role: "learner",
    speakerId: "learner",
    text,
    at: now,
  });
  next.turnCount += 1;

  const cast = getCharacters(next.castIds);

  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: npcResponseSchema,
      system: actorSystemPrompt(next, cast),
      prompt: actorUserPrompt(next, text),
    });

    for (const t of object.turns) {
      next.turns.push({
        role: "npc",
        speakerId: t.speakerId as CharacterId,
        text: t.text,
        gloss: t.gloss,
        emotion: t.emotion as Emotion,
        at: new Date().toISOString(),
      });
    }

    for (const update of object.beatUpdates) {
      const beat = next.beats.find((b) => b.id === update.beatId);
      if (beat && update.completed) beat.completed = true;
    }

    if (object.coachWhisper) {
      next.turns.push({
        role: "system",
        text: `💡 ${object.coachWhisper}`,
        at: new Date().toISOString(),
      });
    }

    if (next.turnCount >= next.maxTurns) {
      next.turns.push({
        role: "system",
        text: "The scene is wrapping up — end the mission when you're ready.",
        at: new Date().toISOString(),
      });
    }
  } catch {
    const lead = cast[0];
    next.turns.push({
      role: "npc",
      speakerId: lead.id,
      text: "Perdón, ¿puedes repetir un poco más despacio?",
      gloss: "Sorry, can you repeat a bit more slowly?",
      emotion: "curious",
      at: new Date().toISOString(),
    });
  }

  next.updatedAt = new Date().toISOString();
  return next;
}

export function getHint(
  session: SceneSession,
  level: "soft" | "phrase" | "full" = "soft",
) {
  const openBeat = session.beats.find((b) => !b.completed) ?? session.beats[0];

  if (!openBeat) {
    return { level, text: "You're doing fine — keep the conversation going." };
  }

  if (level === "soft") return { level, text: openBeat.hintSoft };
  if (level === "phrase")
    return { level, text: openBeat.hintPhrase, gloss: "Try using this phrase" };
  return {
    level,
    text: openBeat.hintFull,
    gloss: "Model line — adapt it in your own words",
  };
}

export async function endScene(session: SceneSession): Promise<{
  session: SceneSession;
  debrief: DebriefPacket;
}> {
  const next = cloneSession(session);
  const mission = getMission(next.missionId);
  const cast = getCharacters(next.castIds);

  let debrief: DebriefPacket;
  try {
    const { object } = await generateObject({
      model: getModel(),
      schema: debriefSchema,
      system: debriefSystemPrompt(),
      prompt: debriefUserPrompt(next, mission, cast),
    });
    debrief = {
      ...object,
      relationshipDeltas: object.relationshipDeltas.map((d) => ({
        characterId: d.characterId as CharacterId,
        delta: d.delta,
      })),
    };
  } catch {
    const completed = next.beats.filter((b) => b.completed).length;
    const ratio = next.beats.length ? completed / next.beats.length : 0;
    const outcome =
      ratio >= 0.7 ? "success" : ratio >= 0.35 ? "partial" : "fail";
    debrief = {
      outcome,
      score: Math.round(ratio * 100),
      summary:
        outcome === "success"
          ? "You got your point across. Nice work."
          : outcome === "partial"
            ? "You made progress — a few goals still open."
            : "Tough scene, but every attempt builds fluency.",
      criteriaResults: mission.successCriteria.map((c) => {
        const beat = next.beats.find((b) => b.id === c.id);
        return {
          id: c.id,
          met: Boolean(beat?.completed),
          note: beat?.completed ? "Completed in scene" : "Not clearly completed",
        };
      }),
      corrections: [],
      newWords: mission.targetPhrases.slice(0, 3).map((p) => ({
        word: p,
        gloss: "Mission phrase",
      })),
      castReaction: `${cast[0].name} smiles and nods.`,
      xpEarned: outcome === "success" ? 50 : outcome === "partial" ? 25 : 10,
      relationshipDeltas: cast.map((c) => ({
        characterId: c.id,
        delta: outcome === "fail" ? 1 : 3,
      })),
    };
  }

  next.status = "ended";
  next.updatedAt = new Date().toISOString();
  return { session: next, debrief };
}
