"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { DAILY_AI_SOFT_CAP, loadUsage } from "@/lib/usage";

/** Hub nudge for free phrase drill (especially when AI budget is low). */
export function FreePracticeCard() {
  const [remaining, setRemaining] = useState<number | null>(null);

  useEffect(() => {
    const used = loadUsage().count;
    setRemaining(Math.max(0, DAILY_AI_SOFT_CAP - used));
  }, []);

  const lowBudget = remaining !== null && remaining < 5;

  return (
    <div
      className={`rounded-2xl border p-4 shadow-sm ${
        lowBudget
          ? "border-amber-200 bg-amber-50/80"
          : "border-slate-200 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Free practice
          </p>
          <h2 className="mt-0.5 font-semibold text-slate-900">
            Phrase drill · zero AI
          </h2>
          <p className="mt-1 max-w-md text-sm text-slate-600">
            English cue → pick the Spanish line from Harborline missions.
            {lowBudget
              ? " Your daily AI budget is low — this keeps the streak alive."
              : " Warm up without spending AI actions."}
          </p>
          {remaining !== null ? (
            <p className="mt-1 text-xs text-slate-400">
              ~{remaining} AI actions left today
            </p>
          ) : null}
        </div>
        <Link
          href="/journal#phrase-drill"
          className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold text-white ${
            lowBudget
              ? "bg-amber-600 hover:bg-amber-700"
              : "bg-slate-900 hover:bg-slate-800"
          }`}
        >
          Drill phrases →
        </Link>
      </div>
    </div>
  );
}
