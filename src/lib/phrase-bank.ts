import { harborline } from "@/content/harborline/world";
import type { CefrLevel } from "@/content/types";

export type PhraseCard = {
  id: string;
  spanish: string;
  english: string;
  missionId: string;
  missionTitle: string;
  locationEmoji: string;
  difficulty: CefrLevel;
};

/** Rough English cues for target phrases (learning goal or blurb fallback). */
export function buildPhraseBank(opts?: {
  /** Limit to these mission ids (e.g. completed). Empty/undefined = all missions. */
  missionIds?: string[];
}): PhraseCard[] {
  const filter = opts?.missionIds?.length
    ? new Set(opts.missionIds)
    : null;
  const cards: PhraseCard[] = [];

  for (const mission of harborline.missions) {
    if (filter && !filter.has(mission.id)) continue;
    const loc = harborline.locations.find((l) => l.id === mission.locationId);
    const emoji = loc?.emoji ?? "📍";

    mission.targetPhrases.forEach((spanish, i) => {
      const goal = mission.learningGoals[i];
      const english =
        goal ??
        `Useful in “${mission.title}”: ${mission.blurb.slice(0, 80)}`;
      cards.push({
        id: `${mission.id}:${i}`,
        spanish,
        english,
        missionId: mission.id,
        missionTitle: mission.title,
        locationEmoji: emoji,
        difficulty: mission.difficulty,
      });
    });
  }

  return cards;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export type DrillItem = {
  card: PhraseCard;
  /** Four Spanish options; one matches card.spanish */
  options: string[];
  correctIndex: number;
};

/** Multiple-choice items: English cue → pick Spanish. */
export function buildDrillItems(
  bank: PhraseCard[],
  count = 8,
): DrillItem[] {
  if (bank.length === 0) return [];
  const picked = shuffle(bank).slice(0, Math.min(count, bank.length));
  const allSpanish = [...new Set(bank.map((c) => c.spanish))];

  return picked.map((card) => {
    const distractors = shuffle(
      allSpanish.filter((s) => s !== card.spanish),
    ).slice(0, 3);
    while (distractors.length < 3 && allSpanish.length > 1) {
      const fallback = allSpanish.find(
        (s) => s !== card.spanish && !distractors.includes(s),
      );
      if (!fallback) break;
      distractors.push(fallback);
    }
    const options = shuffle([card.spanish, ...distractors]).slice(0, 4);
    // Ensure correct answer present
    if (!options.includes(card.spanish)) {
      options[0] = card.spanish;
    }
    const correctIndex = options.indexOf(card.spanish);
    return { card, options, correctIndex };
  });
}

export function normalizePhraseAnswer(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[¿?¡!.,;:'"]/g, "")
    .replace(/\s+/g, " ");
}

export function phraseAnswersMatch(a: string, b: string): boolean {
  return normalizePhraseAnswer(a) === normalizePhraseAnswer(b);
}
