import { harborline } from "@/content/harborline/world";
import type { LearnerProfile } from "@/content/types";
import type { Achievement, AchievementState } from "@/lib/achievements";
import { ACHIEVEMENTS } from "@/lib/achievements";
import type { LocalDebriefRun } from "@/lib/local-debrief-log";

/** Local Monday 00:00 of the week containing `date`. */
export function startOfWeek(date = new Date()): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0 Sun … 6 Sat
  const diff = day === 0 ? -6 : 1 - day; // Monday start
  d.setDate(d.getDate() + diff);
  return d;
}

export function endOfWeek(date = new Date()): Date {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 7);
  return end;
}

export function formatWeekRange(date = new Date()): string {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${start.toLocaleDateString(undefined, opts)} – ${end.toLocaleDateString(undefined, opts)}`;
}

export type WeeklyRecap = {
  weekLabel: string;
  weekStartIso: string;
  debriefCount: number;
  successCount: number;
  partialCount: number;
  failCount: number;
  xpEarned: number;
  avgScore: number | null;
  bestScore: number | null;
  bestMissionTitle: string | null;
  uniqueMissions: number;
  activeDays: number;
  vocabTouched: number;
  vocabKnown: number;
  achievementsThisWeek: Achievement[];
  topBondName: string | null;
  topBondScore: number;
  headline: string;
  blurb: string;
};

function inWeek(iso: string, start: Date, end: Date): boolean {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return false;
  return t >= start.getTime() && t < end.getTime();
}

/**
 * Pure weekly recap builder (testable without browser storage).
 */
export function buildWeeklyRecap(input: {
  learner: LearnerProfile;
  debriefs: LocalDebriefRun[];
  achievementState?: AchievementState;
  now?: Date;
}): WeeklyRecap {
  const now = input.now ?? new Date();
  const start = startOfWeek(now);
  const end = endOfWeek(now);
  const weekLabel = formatWeekRange(now);

  const weekRuns = input.debriefs.filter((r) =>
    inWeek(r.created_at, start, end),
  );

  const successCount = weekRuns.filter((r) => r.outcome === "success").length;
  const partialCount = weekRuns.filter((r) => r.outcome === "partial").length;
  const failCount = weekRuns.filter((r) => r.outcome === "fail").length;
  const xpEarned = weekRuns.reduce((s, r) => s + (r.xp_earned || 0), 0);

  let bestScore: number | null = null;
  let bestMissionTitle: string | null = null;
  for (const r of weekRuns) {
    if (bestScore === null || r.score > bestScore) {
      bestScore = r.score;
      bestMissionTitle =
        harborline.missions.find((m) => m.id === r.mission_id)?.title ??
        r.mission_id;
    }
  }

  const avgScore =
    weekRuns.length > 0
      ? Math.round(
          weekRuns.reduce((s, r) => s + r.score, 0) / weekRuns.length,
        )
      : null;

  const uniqueMissions = new Set(weekRuns.map((r) => r.mission_id)).size;

  const dayKeys = new Set(
    weekRuns.map((r) => {
      const d = new Date(r.created_at);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }),
  );
  const activeDays = dayKeys.size;

  const vocabTouched = input.learner.vocab.filter((v) =>
    inWeek(v.lastSeenAt, start, end),
  ).length;
  const vocabKnown = input.learner.vocab.filter((v) => v.status === "known").length;

  const achievementsThisWeek: Achievement[] = [];
  if (input.achievementState) {
    for (const a of ACHIEVEMENTS) {
      const at = input.achievementState.unlockedAt[a.id];
      if (at && inWeek(at, start, end)) {
        achievementsThisWeek.push(a);
      }
    }
  }

  let topBondName: string | null = null;
  let topBondScore = 0;
  for (const rel of input.learner.relationships) {
    if (rel.score > topBondScore) {
      topBondScore = rel.score;
      topBondName =
        harborline.characters.find((c) => c.id === rel.characterId)?.name ??
        rel.characterId;
    }
  }

  const headline = buildHeadline({
    debriefCount: weekRuns.length,
    successCount,
    xpEarned,
    activeDays,
  });
  const blurb = buildBlurb({
    debriefCount: weekRuns.length,
    successCount,
    partialCount,
    xpEarned,
    bestScore,
    bestMissionTitle,
    vocabTouched,
    achievementsThisWeek,
    topBondName,
    topBondScore,
  });

  return {
    weekLabel,
    weekStartIso: start.toISOString(),
    debriefCount: weekRuns.length,
    successCount,
    partialCount,
    failCount,
    xpEarned,
    avgScore,
    bestScore,
    bestMissionTitle,
    uniqueMissions,
    activeDays,
    vocabTouched,
    vocabKnown,
    achievementsThisWeek,
    topBondName,
    topBondScore,
    headline,
    blurb,
  };
}

function buildHeadline(opts: {
  debriefCount: number;
  successCount: number;
  xpEarned: number;
  activeDays: number;
}): string {
  if (opts.debriefCount === 0) {
    return "Quiet week on stage";
  }
  if (opts.successCount >= 3) {
    return "Standing ovation week";
  }
  if (opts.activeDays >= 4) {
    return "Habit week — you showed up";
  }
  if (opts.xpEarned >= 100) {
    return "XP harvest week";
  }
  return "Another week in Harborline";
}

function buildBlurb(opts: {
  debriefCount: number;
  successCount: number;
  partialCount: number;
  xpEarned: number;
  bestScore: number | null;
  bestMissionTitle: string | null;
  vocabTouched: number;
  achievementsThisWeek: Achievement[];
  topBondName: string | null;
  topBondScore: number;
}): string {
  if (opts.debriefCount === 0) {
    return "No debriefs yet this week. Try today’s challenge, free phrase drill, or a café offline warmup.";
  }
  const parts: string[] = [];
  parts.push(
    `${opts.debriefCount} scene${opts.debriefCount === 1 ? "" : "s"} · ${opts.successCount} success${opts.successCount === 1 ? "" : "es"} · +${opts.xpEarned} XP`,
  );
  if (opts.bestScore !== null && opts.bestMissionTitle) {
    parts.push(`Best: ${opts.bestMissionTitle} (${opts.bestScore}/100)`);
  }
  if (opts.vocabTouched > 0) {
    parts.push(`${opts.vocabTouched} journal word${opts.vocabTouched === 1 ? "" : "s"} touched`);
  }
  if (opts.achievementsThisWeek.length) {
    parts.push(
      `Unlocked ${opts.achievementsThisWeek.map((a) => a.title).join(", ")}`,
    );
  }
  if (opts.topBondName) {
    parts.push(`Closest bond: ${opts.topBondName} (${opts.topBondScore}/100)`);
  }
  return parts.join(". ") + ".";
}

/** Plain-text share card for clipboard / Web Share. */
export function formatWeeklyRecapPostcard(
  recap: WeeklyRecap,
  displayName: string,
  siteUrl = "https://bubblecast.vercel.app",
): string {
  return [
    "🎭 Bubblecast weekly recap",
    `${displayName} · ${recap.weekLabel}`,
    recap.headline,
    "",
    recap.blurb,
    recap.debriefCount
      ? `Days active: ${recap.activeDays} · Missions: ${recap.uniqueMissions} · Avg score: ${recap.avgScore ?? "—"}`
      : null,
    "",
    `Learn Spanish in Harborline → ${siteUrl}`,
  ]
    .filter((l) => l !== null)
    .join("\n");
}
