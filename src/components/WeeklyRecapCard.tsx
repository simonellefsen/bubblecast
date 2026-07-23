"use client";

import { useEffect, useMemo, useState } from "react";
import type { LearnerProfile } from "@/content/types";
import { loadAchievements } from "@/lib/achievements";
import { loadLocalDebriefs } from "@/lib/local-debrief-log";
import {
  buildWeeklyRecap,
  formatWeeklyRecapPostcard,
  type WeeklyRecap,
} from "@/lib/weekly-recap";

export function WeeklyRecapCard({ learner }: { learner: LearnerProfile }) {
  const [recap, setRecap] = useState<WeeklyRecap | null>(null);
  const [shareNote, setShareNote] = useState<string | null>(null);

  useEffect(() => {
    const debriefs = loadLocalDebriefs(24);
    const achievementState = loadAchievements();
    setRecap(
      buildWeeklyRecap({
        learner,
        debriefs,
        achievementState,
      }),
    );
  }, [learner]);

  const stats = useMemo(() => {
    if (!recap) return [];
    return [
      { label: "Scenes", value: String(recap.debriefCount) },
      { label: "Success", value: String(recap.successCount) },
      { label: "XP", value: `+${recap.xpEarned}` },
      { label: "Days", value: String(recap.activeDays) },
    ];
  }, [recap]);

  if (!recap) {
    return (
      <div className="rounded-2xl border border-slate-100 bg-white p-4 text-sm text-slate-400 shadow-sm">
        Loading weekly recap…
      </div>
    );
  }

  async function share() {
    const text = formatWeeklyRecapPostcard(
      recap!,
      learner.displayName,
      typeof window !== "undefined"
        ? window.location.origin
        : "https://bubblecast.vercel.app",
    );
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "Bubblecast weekly recap", text });
        setShareNote("Shared");
      } else {
        await navigator.clipboard.writeText(text);
        setShareNote("Copied");
      }
    } catch {
      try {
        await navigator.clipboard.writeText(text);
        setShareNote("Copied");
      } catch {
        setShareNote("Couldn’t share");
      }
    }
    setTimeout(() => setShareNote(null), 2000);
  }

  return (
    <div className="rounded-2xl border border-violet-100 bg-gradient-to-br from-violet-50 via-white to-orange-50 p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-violet-600">
            Weekly recap · {recap.weekLabel}
          </p>
          <h2 className="mt-0.5 text-lg font-semibold text-slate-900">
            {recap.headline}
          </h2>
          <p className="mt-1 max-w-xl text-sm text-slate-600">{recap.blurb}</p>
        </div>
        <button
          type="button"
          onClick={() => void share()}
          className="shrink-0 rounded-full border border-violet-200 bg-white px-3 py-1.5 text-xs font-semibold text-violet-800 hover:bg-violet-50"
        >
          {shareNote ?? "Share week"}
        </button>
      </div>

      <div className="mt-3 grid grid-cols-4 gap-2">
        {stats.map((s) => (
          <div
            key={s.label}
            className="rounded-xl border border-white/80 bg-white/80 px-2 py-2 text-center shadow-sm"
          >
            <div className="text-lg font-semibold tabular-nums text-slate-900">
              {s.value}
            </div>
            <div className="text-[10px] uppercase tracking-wide text-slate-400">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {recap.achievementsThisWeek.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-1.5">
          {recap.achievementsThisWeek.map((a) => (
            <li
              key={a.id}
              className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-900"
            >
              {a.emoji} {a.title}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
