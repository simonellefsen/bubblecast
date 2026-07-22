"use client";

import Link from "next/link";
import {
  getLocation,
  harborline,
  recommendNextMission,
} from "@/content/harborline/world";
import type { LearnerProfile } from "@/content/types";

export function UpNextCard({ learner }: { learner: LearnerProfile }) {
  const next = recommendNextMission(learner.completedMissionIds);
  if (!next) {
    const allDone = harborline.missions.every((m) =>
      learner.completedMissionIds.includes(m.id),
    );
    if (!allDone) return null;
    return (
      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        <span className="font-semibold">Harborline cleared.</span> Replay any
        mission to keep bonds and vocab warm — or raise CEFR in Settings.
      </div>
    );
  }

  const loc = getLocation(next.locationId);
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-violet-200 bg-violet-50 px-4 py-3 shadow-sm">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-violet-700">
          Up next
        </p>
        <p className="font-semibold text-slate-900">
          {loc.emoji} {next.title}
        </p>
        <p className="text-xs text-slate-600">
          {loc.name} · {next.difficulty} · {next.blurb}
        </p>
      </div>
      <Link
        href={`/play/mission/${next.id}`}
        className="shrink-0 rounded-full bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-700"
      >
        Continue →
      </Link>
    </div>
  );
}
