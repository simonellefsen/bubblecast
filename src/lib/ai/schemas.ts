import { z } from "zod";

export const emotionSchema = z.enum([
  "neutral",
  "happy",
  "curious",
  "impatient",
  "warm",
  "concerned",
  "amused",
  "proud",
]);

export const comicScriptSchema = z.object({
  title: z.string(),
  missionId: z.string(),
  panels: z
    .array(
      z.object({
        index: z.number().int().min(0),
        caption: z.string().optional(),
        lines: z.array(
          z.object({
            speakerId: z.string(),
            text: z.string(),
            gloss: z.string().optional(),
            emotion: emotionSchema.optional(),
          }),
        ),
        focusCharacterIds: z.array(z.string()),
        targetPhrase: z.string().optional(),
      }),
    )
    .min(3)
    .max(4),
  teachingNotes: z.array(z.string()),
});

export const scenePlanSchema = z.object({
  openingNarration: z.string(),
  beats: z
    .array(
      z.object({
        id: z.string(),
        goal: z.string(),
        hintSoft: z.string(),
        hintPhrase: z.string(),
        hintFull: z.string(),
      }),
    )
    .min(2)
    .max(5),
  openingNpcTurns: z
    .array(
      z.object({
        speakerId: z.string(),
        text: z.string(),
        gloss: z.string().optional(),
        emotion: emotionSchema,
        stageNote: z.string().optional(),
      }),
    )
    .min(1)
    .max(3),
});

export const npcResponseSchema = z.object({
  turns: z
    .array(
      z.object({
        speakerId: z.string(),
        text: z.string(),
        gloss: z.string().optional(),
        emotion: emotionSchema,
        stageNote: z.string().optional(),
      }),
    )
    .min(1)
    .max(3),
  beatUpdates: z.array(
    z.object({
      beatId: z.string(),
      completed: z.boolean(),
    }),
  ),
  sceneShouldEnd: z.boolean(),
  coachWhisper: z.string().optional(),
});

export const debriefSchema = z.object({
  outcome: z.enum(["success", "partial", "fail"]),
  score: z.number().min(0).max(100),
  summary: z.string(),
  criteriaResults: z.array(
    z.object({
      id: z.string(),
      met: z.boolean(),
      note: z.string(),
    }),
  ),
  corrections: z.array(
    z.object({
      original: z.string(),
      suggested: z.string(),
      explanation: z.string(),
    }),
  ),
  newWords: z.array(
    z.object({
      word: z.string(),
      gloss: z.string(),
    }),
  ),
  castReaction: z.string(),
  xpEarned: z.number().int().min(0).max(100),
  relationshipDeltas: z.array(
    z.object({
      characterId: z.string(),
      delta: z.number().int().min(-5).max(10),
    }),
  ),
});

export const hintSchema = z.object({
  level: z.enum(["soft", "phrase", "full"]),
  text: z.string(),
  gloss: z.string().optional(),
});
