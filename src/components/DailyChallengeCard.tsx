"use client";

import Link from "next/link";
import { useMemo } from "react";
import { getLocation } from "@/content/harborline/world";
import type { LearnerProfile } from "@/content/types";
import { getDailyChallenge } from "@/lib/daily-challenge";

export function DailyChallengeCard({ learner }: { learner: LearnerProfile }) {
  const challenge = useMemo(
    () => getDailyChallenge(learner.completedMissionIds),
    [learner.completedMissionIds],
  );
  const loc = getLocation(challenge.mission.locationId);
  const done = learner.completedMissionIds.includes(challenge.mission.id);

  return (
    <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-orange-50 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
            Daily challenge · {challenge.day}
          </p>
          <h2 className="mt-0.5 text-lg font-semibold text-slate-900">
            {loc.emoji} {challenge.mission.title}
          </h2>
          <p className="mt-1 text-sm text-slate-600">{challenge.blurb}</p>
          <p className="mt-1 text-xs text-slate-400">
            {challenge.mission.difficulty}
            {challenge.kind === "new"
              ? " · new for you"
              : challenge.kind === "replay"
                ? " · replay polish"
                : " · story path"}
            {done ? " · already cleared (replay OK)" : ""}
          </p>
        </div>
        <Link
          href={`/play/mission/${challenge.mission.id}`}
          className="shrink-0 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
        >
          {done ? "Replay →" : "Play today’s →"}
        </Link>
      </div>
    </div>
  );
}
