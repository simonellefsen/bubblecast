import {
  harborline,
  isMissionUnlocked,
  recommendNextMission,
} from "@/content/harborline/world";
import type { MissionTemplate } from "@/content/types";

/** Local calendar day key YYYY-MM-DD. */
export function dayKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Stable hash for rotating daily picks. */
export function hashDayKey(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i++) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export type DailyChallenge = {
  day: string;
  mission: MissionTemplate;
  /** incomplete unlocked preferred; otherwise any unlocked (replay). */
  kind: "new" | "replay" | "story";
  blurb: string;
};

/**
 * Pick today's challenge among unlocked missions.
 * Prefer incomplete unlocked; else rotate unlocked for replay.
 * Falls back to story recommendation / first mission.
 */
export function getDailyChallenge(
  completedMissionIds: string[],
  date = new Date(),
): DailyChallenge {
  const day = dayKey(date);
  const h = hashDayKey(day);

  const unlocked = harborline.missions.filter((m) =>
    isMissionUnlocked(m.id, completedMissionIds),
  );
  const incomplete = unlocked.filter(
    (m) => !completedMissionIds.includes(m.id),
  );

  if (incomplete.length > 0) {
    const mission = incomplete[h % incomplete.length]!;
    return {
      day,
      mission,
      kind: "new",
      blurb: `Today’s open door: ${mission.title} at ${locationName(mission.locationId)}.`,
    };
  }

  if (unlocked.length > 0) {
    const mission = unlocked[h % unlocked.length]!;
    return {
      day,
      mission,
      kind: "replay",
      blurb: `Replay for polish: ${mission.title} — keep the streak warm.`,
    };
  }

  const story = recommendNextMission(completedMissionIds);
  const mission = story ?? harborline.missions[0]!;
  return {
    day,
    mission,
    kind: "story",
    blurb: mission.blurb,
  };
}

function locationName(locationId: string): string {
  return (
    harborline.locations.find((l) => l.id === locationId)?.name ?? locationId
  );
}
