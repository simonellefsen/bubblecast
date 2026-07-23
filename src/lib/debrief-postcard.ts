import type { DebriefPacket } from "@/content/types";

export type PostcardInput = {
  missionTitle: string;
  locationLabel?: string;
  debrief: DebriefPacket;
  streakCount?: number;
  siteUrl?: string;
};

/** Plain-text share card for clipboard / Web Share. */
export function formatDebriefPostcard(input: PostcardInput): string {
  const {
    missionTitle,
    locationLabel,
    debrief,
    streakCount = 0,
    siteUrl = "https://bubblecast.vercel.app",
  } = input;

  const scoreLine = [
    debrief.outcome.toUpperCase(),
    `${debrief.score}/100`,
    `+${debrief.xpEarned} XP`,
  ].join(" · ");

  const words =
    debrief.newWords.length > 0
      ? debrief.newWords.map((w) => `${w.word} (${w.gloss})`).join(", ")
      : null;

  const criteriaMet = debrief.criteriaResults.filter((c) => c.met).length;
  const criteriaTotal = debrief.criteriaResults.length;

  const lines = [
    "🎭 Bubblecast postcard",
    locationLabel
      ? `${locationLabel} · ${missionTitle}`
      : missionTitle,
    scoreLine,
    streakCount > 0 ? `🔥 ${streakCount}-day streak` : null,
    "",
    debrief.summary,
    debrief.castReaction ? `“${debrief.castReaction}”` : null,
    criteriaTotal > 0
      ? `Goals: ${criteriaMet}/${criteriaTotal}`
      : null,
    words ? `New words: ${words}` : null,
    "",
    `Learn Spanish in Harborline → ${siteUrl}`,
  ];

  return lines.filter((l) => l !== null).join("\n");
}

export type ShareResult = "shared" | "copied" | "failed";

/** Prefer native share; fall back to clipboard. */
export async function shareDebriefPostcard(
  text: string,
  title = "Bubblecast debrief",
): Promise<ShareResult> {
  if (typeof navigator === "undefined") return "failed";

  try {
    if (typeof navigator.share === "function") {
      await navigator.share({ title, text });
      return "shared";
    }
  } catch (err) {
    // User cancel is not a failure for clipboard fallback intent
    if (err instanceof Error && err.name === "AbortError") {
      return "failed";
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}
