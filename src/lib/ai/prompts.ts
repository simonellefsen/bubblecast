import type {
  Character,
  LearnerProfile,
  Location,
  MissionTemplate,
  SceneLearnerContext,
  SceneSession,
} from "@/content/types";
import { harborline } from "@/content/harborline/world";

const GLOBAL_RAILS = `
You are part of Bubblecast, an adult travel/work language tutor set in Harborline city.
Rules:
- Target language: Spanish (es). Learner L1: English.
- Keep language at the learner's CEFR level. Prefer short, natural phrases.
- Adult tone: witty, warm, never childish, never sexual or violent.
- Do not invent medical/legal/scam advice.
- Prefer comprehensible input. Gloss hard words in English when helpful.
- Never dump long grammar lectures mid-scene.
`.trim();

function formatLearnerContext(ctx?: SceneLearnerContext) {
  if (!ctx) return null;
  return {
    displayName: ctx.displayName,
    relationships: ctx.relationships.map((r) => ({
      characterId: r.characterId,
      score: r.score,
      bond:
        r.bond ??
        (r.score >= 70
          ? "close friend"
          : r.score >= 45
            ? "familiar"
            : r.score >= 25
              ? "acquaintance"
              : "new acquaintance"),
      tone:
        r.tone ??
        "Match politeness to bond; do not invent detailed backstory.",
      // Newest memory stamps first (from prior debriefs)
      memories: r.memories?.length
        ? r.memories
        : r.notes
          ? r.notes
              .split(/\s*·\s*/)
              .map((s) => s.trim())
              .filter(Boolean)
              .slice(0, 3)
          : [],
      scenesTogether: r.scenesTogether ?? 0,
    })),
    focusVocab: ctx.focusVocab,
    instruction:
      "Match each NPC's tone to their bond and tone field. Lightly callback 0–1 memory (if any) without lecturing or inventing past events. If scenesTogether is high, act like regulars. Gently reuse 1 focusVocab item when natural — never run a vocab quiz mid-scene.",
  };
}

export function comicSystemPrompt() {
  return `${GLOBAL_RAILS}

You are the Comic Writer. Create a 3–4 panel speech-bubble comic that previews a mission.
Each panel teaches one useful phrase in context. Characters stay in personality.
Return only structured data matching the schema.`;
}

export function comicUserPrompt(
  mission: MissionTemplate,
  cast: Character[],
  learnerContext?: SceneLearnerContext,
) {
  return JSON.stringify(
    {
      mission,
      cast: cast.map((c) => ({
        id: c.id,
        name: c.name,
        role: c.role,
        traits: c.traits,
        speechRegister: c.speechRegister,
      })),
      targetPhrases: mission.targetPhrases,
      difficulty: mission.difficulty,
      learner: formatLearnerContext(learnerContext),
      instruction:
        "Write comic panels. speakerId must be character ids or 'narrator'. text in Spanish, gloss in English for learner lines and key NPC lines.",
    },
    null,
    2,
  );
}

export function directorSystemPrompt() {
  return `${GLOBAL_RAILS}

You are the Director. Plan scene beats and opening NPC lines for a live speech-bubble scene.
Beats should be achievable in a short dialogue. Hints escalate: soft idea → useful phrase → full model line.
Opening NPC turns should invite the learner to speak in Spanish.
Use learner relationship warmth and focus vocabulary when it fits.`;
}

export function directorUserPrompt(
  mission: MissionTemplate,
  location: Location,
  cast: Character[],
  learner: Pick<LearnerProfile, "cefr" | "displayName">,
  learnerContext?: SceneLearnerContext,
) {
  return JSON.stringify(
    {
      mission,
      location: { id: location.id, name: location.name, vibe: location.vibe },
      cast: cast.map((c) => ({
        id: c.id,
        name: c.name,
        role: c.role,
        traits: c.traits,
        speechRegister: c.speechRegister,
        slangDensity: c.slangDensity,
      })),
      learner: {
        cefr: learner.cefr,
        displayName: learner.displayName,
        ...formatLearnerContext(learnerContext),
      },
    },
    null,
    2,
  );
}

export function actorSystemPrompt(session: SceneSession, cast: Character[]) {
  const mission = harborline.missions.find((m) => m.id === session.missionId)!;
  const ctx = session.learnerContext;
  const relLine = ctx?.relationships
    ?.map((r) => {
      const name = cast.find((c) => c.id === r.characterId)?.name ?? r.characterId;
      const bond = r.bond ?? `${r.score}/100`;
      const mems = (r.memories?.length
        ? r.memories
        : r.notes
          ? r.notes.split(/\s*·\s*/).filter(Boolean).slice(0, 2)
          : []
      )
        .map((m) => m.slice(0, 60))
        .join(" | ");
      const together =
        typeof r.scenesTogether === "number" ? ` together=${r.scenesTogether}` : "";
      const tone = r.tone ? ` tone="${r.tone.slice(0, 80)}"` : "";
      return `${name}:${bond}${together}${tone}${mems ? ` mem="${mems}"` : ""}`;
    })
    .join("; ");
  const vocabLine = ctx?.focusVocab
    ?.slice(0, 5)
    .map((v) => v.word)
    .join(", ");

  return `${GLOBAL_RAILS}

You are the Cast Actors + live Director for a speech-bubble improv scene.
Stay in character. 1–3 short NPC turns max per learner message.
Mark beats completed when the learner roughly achieves them (accept imperfect Spanish).
If the learner writes English, respond in simple Spanish and gently model the Spanish form; do not shame them.
Set sceneShouldEnd=true when mission goals are mostly met or turn budget is nearly exhausted and a natural close exists.
Match NPC warmth/register to bond + tone; callback at most one memory if present (no invented history).
CEFR: ${session.cefr}. Learner: ${ctx?.displayName ?? "Traveler"}. Mission: ${mission.title}. Goal: ${mission.learnerGoal}.
Cast: ${cast.map((c) => `${c.name} (${c.id}): ${c.traits.join(", ")}`).join("; ")}.
Relationships + memory: ${relLine || "default"}.
Focus vocab to reuse gently: ${vocabLine || "none"}.
Open beats: ${session.beats.map((b) => `${b.id}:${b.goal}${b.completed ? " [done]" : ""}`).join(" | ")}.`;
}

export function actorUserPrompt(session: SceneSession, learnerText: string) {
  const history = session.turns
    .slice(-12)
    .map((t) => `${t.speakerId ?? t.role}: ${t.text}`)
    .join("\n");
  return `Recent dialogue:\n${history || "(scene just started)"}\n\nLearner says: ${learnerText}\n\nTurn count: ${session.turnCount}/${session.maxTurns}.`;
}

export function hintSystemPrompt() {
  return `${GLOBAL_RAILS}

You are the Coach. Give one hint for the current beat without breaking immersion too hard.
Levels: soft (strategy), phrase (useful Spanish chunk), full (complete model line + gloss).`;
}

export function debriefSystemPrompt() {
  return `${GLOBAL_RAILS}

You are the Coach at debrief. Evaluate the mission fairly.
Imperfect Spanish that achieves the communicative goal still counts.
Be encouraging and specific. Prefer 0–4 corrections, not a flood.
XP: success 40–70, partial 15–35, fail 5–15.`;
}

export function debriefUserPrompt(
  session: SceneSession,
  mission: MissionTemplate,
  cast: Character[],
) {
  return JSON.stringify(
    {
      mission: {
        id: mission.id,
        title: mission.title,
        learnerGoal: mission.learnerGoal,
        successCriteria: mission.successCriteria,
        targetPhrases: mission.targetPhrases,
      },
      cast: cast.map((c) => c.id),
      turns: session.turns,
      beats: session.beats,
      cefr: session.cefr,
      learner: session.learnerContext
        ? {
            displayName: session.learnerContext.displayName,
            relationships: session.learnerContext.relationships,
          }
        : undefined,
    },
    null,
    2,
  );
}
