"use client";

import { useEffect, useState } from "react";
import {
  ACHIEVEMENTS,
  listUnlockedAchievements,
  type Achievement,
} from "@/lib/achievements";

export function AchievementsPanel({
  highlight,
}: {
  /** Optional fresh unlocks to emphasize */
  highlight?: Achievement[];
}) {
  const [unlocked, setUnlocked] = useState<Achievement[]>([]);

  useEffect(() => {
    setUnlocked(listUnlockedAchievements());
  }, [highlight]);

  const unlockedIds = new Set(unlocked.map((a) => a.id));
  const fresh = new Set((highlight ?? []).map((a) => a.id));

  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <h2 className="font-semibold">Achievements</h2>
      <p className="mt-1 text-xs text-slate-500">
        {unlocked.length}/{ACHIEVEMENTS.length} unlocked · stored on this device
      </p>
      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {ACHIEVEMENTS.map((a) => {
          const got = unlockedIds.has(a.id);
          const isNew = fresh.has(a.id);
          return (
            <li
              key={a.id}
              className={`rounded-xl border px-3 py-2 text-sm ${
                got
                  ? isNew
                    ? "border-amber-300 bg-amber-50"
                    : "border-emerald-100 bg-emerald-50/50"
                  : "border-slate-100 bg-slate-50 opacity-60"
              }`}
            >
              <div className="font-medium">
                <span className="mr-1.5" aria-hidden>
                  {a.emoji}
                </span>
                {a.title}
                {isNew ? (
                  <span className="ml-2 text-[10px] font-semibold uppercase text-amber-700">
                    new
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-xs text-slate-600">{a.description}</p>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
