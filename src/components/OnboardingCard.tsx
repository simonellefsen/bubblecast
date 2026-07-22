"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const KEY = "bubblecast-onboarding-dismissed-v1";

export function OnboardingCard({
  show,
}: {
  /** True when the learner has not completed any missions yet. */
  show: boolean;
}) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    try {
      setDismissed(localStorage.getItem(KEY) === "1");
    } catch {
      setDismissed(false);
    }
  }, []);

  if (!show || dismissed) return null;

  return (
    <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="max-w-xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-700">
            First scene
          </p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">
            Start at Mercado Café
          </h2>
          <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-slate-600">
            <li>Read the mission brief (goals + phrases).</li>
            <li>Optional comic warmup, then jump into the live scene.</li>
            <li>Type Spanish (English is OK) — use Hint if stuck.</li>
            <li>End for debrief, XP, and unlocks across Harborline.</li>
          </ol>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href="/play/mission/cafe-breakfast"
            className="rounded-full bg-orange-500 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-orange-600"
          >
            Order breakfast →
          </Link>
          <button
            type="button"
            className="text-xs text-slate-500 underline"
            onClick={() => {
              try {
                localStorage.setItem(KEY, "1");
              } catch {
                /* ignore */
              }
              setDismissed(true);
            }}
          >
            Dismiss tip
          </button>
        </div>
      </div>
    </div>
  );
}
