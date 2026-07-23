import {
  getCharacter,
  getCharacters,
  getMission,
} from "@/content/harborline/world";
import {
  getOfflineScript,
  type ScriptedLine,
} from "@/content/harborline/offline-scripts";
import type {
  CharacterId,
  DebriefPacket,
  Emotion,
  MissionTemplate,
  SceneSession,
  SceneTurn,
} from "@/content/types";
import { normalizePhraseAnswer } from "@/lib/phrase-bank";

export function isOfflineSession(session: SceneSession | null | undefined): boolean {
  if (!session) return false;
  if (session.offline) return true;
  return session.id.startsWith("offline-");
}

function nowIso() {
  return new Date().toISOString();
}

function tokens(text: string): string[] {
  return normalizePhraseAnswer(text)
    .split(" ")
    .filter((t) => t.length >= 3);
}

/** Significant overlap or substring hit between learner text and a phrase. */
export function textHitsPhrase(learnerText: string, phrase: string): boolean {
  const a = normalizePhraseAnswer(learnerText);
  const b = normalizePhraseAnswer(phrase);
  if (!a || !b) return false;
  if (a.includes(b) || b.includes(a)) return true;
  const ta = new Set(tokens(a));
  const tb = tokens(b);
  if (tb.length === 0) return false;
  const hit = tb.filter((t) => ta.has(t)).length;
  return hit >= Math.min(2, tb.length) || (tb.length === 1 && hit === 1);
}

/** Extra English/Spanish keywords per criterion id (all Harborline missions). */
export const CRITERION_KEYWORDS: Record<string, string[]> = {
  greet: ["hola", "buenos", "buenas", "dias", "tardes", "noches", "hello", "hi"],
  "order-drink": [
    "cafe",
    "coffee",
    "te",
    "tea",
    "jugo",
    "agua",
    "quiero",
    "quisiera",
    "bebida",
    "drink",
  ],
  "order-food": [
    "tostada",
    "croissant",
    "desayuno",
    "comida",
    "comer",
    "sandwich",
    "food",
    "breakfast",
    "quiero",
    "quisiera",
  ],
  price: ["cuanto", "cuesta", "precio", "vale", "cost", "price", "euros"],
  "polite-close": ["gracias", "thanks", "thank", "adios", "hasta"],
  "soft-open": ["disculpe", "perdon", "sorry", "excuse"],
  "state-problem": ["frio", "cold", "problema", "mal", "wrong", "roto"],
  "request-fix": ["otro", "otra", "traer", "cambiar", "fresh", "replacement", "puede"],
  "ask-next": ["proximo", "proxima", "hora", "sale", "tren", "train", "when", "next"],
  "get-info": ["retraso", "delay", "tarde", "horario", "schedule", "doce", "via"],
  relay: ["sofia", "decirle", "tell", "dice", "proximo", "via"],
  name: [
    "reserva",
    "reservation",
    "nombre",
    "name",
    "me llamo",
    "habitacion",
    "room",
  ],
  wifi: ["wifi", "contrasena", "password", "clave", "internet", "red"],
  "late-checkout": [
    "late",
    "checkout",
    "salida",
    "tarde",
    "catorce",
    "check-out",
    "posible",
  ],
  soften: [
    "podriamos",
    "podria",
    "mover",
    "reunion",
    "meeting",
    "posible",
    "disculpa",
  ],
  "propose-time": [
    "jueves",
    "thursday",
    "manana",
    "tomorrow",
    "hora",
    "once",
    "martes",
    "viernes",
  ],
  confirm: ["confirmo", "perfecto", "vale", "ok", "bien", "confirm", "queda"],
  "state-allergy": [
    "alergico",
    "alergica",
    "alergia",
    "allergy",
    "frutos",
    "secos",
    "nueces",
    "nuts",
  ],
  "ask-safe": ["lleva", "nueces", "contiene", "tiene", "seguro", "safe", "sin"],
  purchase: ["prefiero", "esto", "compro", "quiero", "take", "please", "por favor"],
  "open-chat": ["hola", "que tal", "bonito", "noche", "ferry", "vienes", "a menudo"],
  opinion: ["me gusta", "bonito", "prefiero", "creo", "think", "parece"],
  plan: ["manana", "tonight", "esta noche", "puedo", "vamos", "plan", "no puedo"],
};

function criterionKeywordHit(criterionId: string, learnerNorm: string): boolean {
  const keys = CRITERION_KEYWORDS[criterionId];
  if (!keys) return false;
  return keys.some((k) => learnerNorm.includes(normalizePhraseAnswer(k)));
}

export function matchBeatsFromText(
  mission: MissionTemplate,
  learnerText: string,
  session: SceneSession,
): string[] {
  const norm = normalizePhraseAnswer(learnerText);
  const completed: string[] = [];

  mission.successCriteria.forEach((c, i) => {
    const beat = session.beats.find((b) => b.id === c.id);
    if (beat?.completed) return;

    const phrase =
      mission.targetPhrases[i] ??
      mission.targetPhrases[0] ??
      beat?.hintPhrase ??
      "";

    const phraseHit = phrase ? textHitsPhrase(learnerText, phrase) : false;
    const anyTarget = mission.targetPhrases.some((p) =>
      textHitsPhrase(learnerText, p),
    );
    const kw = criterionKeywordHit(c.id, norm);
    const descTokens = tokens(c.description);
    const learnerTokens = new Set(tokens(learnerText));
    const descHit =
      descTokens.filter((t) => learnerTokens.has(t)).length >= 2;

    if (phraseHit || kw || (anyTarget && descHit) || descHit) {
      completed.push(c.id);
    }
  });

  return completed;
}

const GENERIC_ACK: ScriptedLine[] = [
  {
    text: "Perfecto, te escucho.",
    gloss: "Perfect, I'm listening.",
    emotion: "warm",
  },
  {
    text: "Muy bien. ¿Algo más?",
    gloss: "Very good. Anything else?",
    emotion: "curious",
  },
  {
    text: "Claro, sin problema.",
    gloss: "Of course, no problem.",
    emotion: "happy",
  },
];

const GENERIC_NUDGE: ScriptedLine[] = [
  {
    text: "¿Puedes decirlo en español? Usa una frase del panel.",
    gloss: "Can you say it in Spanish? Use a phrase from the panel.",
    emotion: "curious",
  },
  {
    text: "Un poco más despacio… ¿qué necesitas exactamente?",
    gloss: "A bit slower… what do you need exactly?",
    emotion: "concerned",
  },
];

function resolveSpeaker(
  line: ScriptedLine,
  castIds: CharacterId[],
  fallback: CharacterId,
): CharacterId {
  if (line.speakerId && castIds.includes(line.speakerId)) {
    return line.speakerId;
  }
  return fallback;
}

function pickScriptedReply(
  session: SceneSession,
  newlyCompleted: string[],
): { line: ScriptedLine; speakerId: CharacterId; companion?: ScriptedLine } {
  const script = getOfflineScript(session.missionId);
  const fallback = (session.castIds[0] ?? "mira") as CharacterId;

  if (script) {
    // Prefer first newly completed criterion with a dedicated line
    for (const id of newlyCompleted) {
      const hit = script.onCriterion[id];
      if (hit) {
        return {
          line: hit,
          speakerId: resolveSpeaker(hit, session.castIds as CharacterId[], fallback),
          companion:
            newlyCompleted.length > 0 && session.castIds.length > 1
              ? script.companion
              : undefined,
        };
      }
    }
    if (newlyCompleted.length > 0 && script.onAnyProgress.length) {
      const line =
        script.onAnyProgress[session.turnCount % script.onAnyProgress.length]!;
      return {
        line,
        speakerId: resolveSpeaker(line, session.castIds as CharacterId[], fallback),
        companion: script.companion,
      };
    }
    const line =
      script.onMiss[session.turnCount % script.onMiss.length] ?? GENERIC_NUDGE[0]!;
    return {
      line,
      speakerId: resolveSpeaker(line, session.castIds as CharacterId[], fallback),
    };
  }

  if (newlyCompleted.length > 0) {
    const line = GENERIC_ACK[session.turnCount % GENERIC_ACK.length]!;
    return { line, speakerId: fallback };
  }
  const line = GENERIC_NUDGE[session.turnCount % GENERIC_NUDGE.length]!;
  return { line, speakerId: fallback };
}

function pushNpc(
  turns: SceneTurn[],
  speakerId: CharacterId,
  line: ScriptedLine,
): SceneTurn[] {
  return [
    ...turns,
    {
      role: "npc",
      speakerId,
      text: line.text,
      gloss: line.gloss,
      emotion: line.emotion as Emotion,
      at: nowIso(),
    },
  ];
}

/** Local enter-live (no network). */
export function offlineBeginLive(session: SceneSession): SceneSession {
  const mission = getMission(session.missionId);
  const script = getOfflineScript(session.missionId);
  const lead = getCharacter(session.castIds[0]!);
  const now = nowIso();
  const openingAlready = session.turns.some((t) => t.role === "npc");

  let turns: SceneTurn[] = [...session.turns];
  if (!openingAlready) {
    const opening = script?.opening ?? {
      text:
        session.cefr === "A1"
          ? "¡Hola! Bienvenido/a. ¿Qué deseas?"
          : "¡Hola! Dime, ¿en qué te puedo ayudar?",
      gloss: "Hi! Welcome. What would you like?",
      emotion: "warm" as Emotion,
      speakerId: lead.id,
    };
    turns = pushNpc(
      turns,
      resolveSpeaker(opening, session.castIds as CharacterId[], lead.id),
      opening,
    );
  }

  if (!turns.some((t) => t.text.includes("Offline"))) {
    turns = [
      ...turns,
      {
        role: "system",
        text: `Offline cast · ${mission.title}${
          script ? " · mission script" : ""
        }. Tap target phrases; End for a local score.`,
        at: now,
      },
    ];
  }

  return {
    ...session,
    offline: true,
    status: "live",
    turns,
    updatedAt: now,
  };
}

export type OfflineTurnResult = {
  session: SceneSession;
  /** Criterion ids newly completed this turn */
  newlyCompleted: string[];
};

/** Scripted NPC turn from keyword / phrase matches. */
export function offlineLearnerTurn(
  session: SceneSession,
  text: string,
): SceneSession {
  return offlineLearnerTurnDetailed(session, text).session;
}

export function offlineLearnerTurnDetailed(
  session: SceneSession,
  text: string,
): OfflineTurnResult {
  const mission = getMission(session.missionId);
  const now = nowIso();

  let next: SceneSession = {
    ...session,
    offline: true,
    status: "live",
    turns: [
      ...session.turns,
      {
        role: "learner",
        speakerId: "learner",
        text: text.trim(),
        at: now,
      },
    ],
    turnCount: session.turnCount + 1,
    updatedAt: now,
  };

  const newly = matchBeatsFromText(mission, text, next);
  if (newly.length) {
    next = {
      ...next,
      beats: next.beats.map((b) =>
        newly.includes(b.id) ? { ...b, completed: true } : b,
      ),
    };
  }

  const { line, speakerId, companion } = pickScriptedReply(next, newly);
  next = {
    ...next,
    turns: pushNpc(next.turns, speakerId, line),
  };

  if (
    companion &&
    newly.length > 0 &&
    next.turnCount % 2 === 0 &&
    companion.speakerId &&
    session.castIds.includes(companion.speakerId)
  ) {
    next = {
      ...next,
      turns: pushNpc(next.turns, companion.speakerId, companion),
    };
  }

  const doneBeats = next.beats.filter((b) => b.completed).length;
  if (
    doneBeats >= next.beats.length &&
    next.beats.length > 0 &&
    !next.turns.some((t) => t.text.includes("goals look covered"))
  ) {
    next = {
      ...next,
      turns: [
        ...next.turns,
        {
          role: "system",
          text: "Offline coach: mission goals look covered — End for your debrief.",
          at: nowIso(),
        },
      ],
    };
  } else if (next.turnCount >= next.maxTurns) {
    next = {
      ...next,
      turns: [
        ...next.turns,
        {
          role: "system",
          text: "Turn budget reached — End for a local debrief.",
          at: nowIso(),
        },
      ],
    };
  }

  next.updatedAt = nowIso();
  return { session: next, newlyCompleted: newly };
}

export function offlineHint(
  session: SceneSession,
  level: "soft" | "phrase" | "full",
): { text: string; gloss?: string } {
  const open = session.beats.find((b) => !b.completed) ?? session.beats[0];
  if (!open) {
    return { text: "You’re done — End the scene for debrief." };
  }
  if (level === "soft") {
    return { text: open.hintSoft, gloss: "Strategy hint" };
  }
  if (level === "phrase") {
    return { text: open.hintPhrase, gloss: "Try this chunk" };
  }
  return { text: open.hintFull, gloss: "Model line" };
}

/** Local debrief from completed beats + used phrases (no AI). */
export function offlineDebrief(session: SceneSession): DebriefPacket {
  const mission = getMission(session.missionId);
  const cast = getCharacters(session.castIds);
  const learnerTexts = session.turns
    .filter((t) => t.role === "learner")
    .map((t) => t.text)
    .join(" ");

  const criteriaResults = mission.successCriteria.map((c) => {
    const beat = session.beats.find((b) => b.id === c.id);
    const met = !!beat?.completed;
    return {
      id: c.id,
      met,
      note: met
        ? "Covered in offline play"
        : "Not clearly covered offline — try target phrases next time",
    };
  });

  const totalWeight = mission.successCriteria.reduce((s, c) => s + c.weight, 0);
  const earnedWeight = mission.successCriteria.reduce(
    (s, c) =>
      s + (criteriaResults.find((r) => r.id === c.id)?.met ? c.weight : 0),
    0,
  );
  const ratio = totalWeight > 0 ? earnedWeight / totalWeight : 0;
  const score = Math.round(ratio * 100);

  let outcome: DebriefPacket["outcome"] = "fail";
  if (score >= 70) outcome = "success";
  else if (score >= 40) outcome = "partial";

  const xpEarned =
    outcome === "success" ? 45 : outcome === "partial" ? 22 : 8;

  const usedPhrases = mission.targetPhrases.filter((p) =>
    textHitsPhrase(learnerTexts, p),
  );
  const newWords = usedPhrases.slice(0, 4).map((word) => ({
    word,
    gloss: "Mission phrase (offline)",
  }));

  const lead = cast[0];
  const castReaction =
    outcome === "success"
      ? `${lead?.name ?? "Cast"} nods: “Buen trabajo — even offline.”`
      : outcome === "partial"
        ? `${lead?.name ?? "Cast"}: “Casi. Prueba las frases del panel otra vez.”`
        : `${lead?.name ?? "Cast"}: “Vuelve cuando puedas — las frases te esperan.”`;

  return {
    outcome,
    score,
    summary:
      outcome === "success"
        ? `Offline success on “${mission.title}”. You hit most communicative goals without AI.`
        : outcome === "partial"
          ? `Offline partial on “${mission.title}”. Some goals landed; keep drilling target phrases.`
          : `Offline practice on “${mission.title}”. Goals incomplete — free phrase drill helps.`,
    criteriaResults,
    corrections: [],
    newWords,
    castReaction,
    xpEarned,
    relationshipDeltas: cast.map((c) => ({
      characterId: c.id,
      delta: outcome === "success" ? 3 : outcome === "partial" ? 1 : 0,
    })),
  };
}
