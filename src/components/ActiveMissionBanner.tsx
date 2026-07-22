"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { harborline } from "@/content/harborline/world";
import {
  clearActiveScene,
  listActiveScenes,
  type StoredMissionState,
} from "@/lib/session/client-session";

export function ActiveMissionBanner() {
  const [active, setActive] = useState<StoredMissionState[]>([]);

  useEffect(() => {
    setActive(listActiveScenes());
  }, []);

  if (active.length === 0) return null;

  return (
    <div className="space-y-2">
      {active.map((item) => {
        const mission = harborline.missions.find((m) => m.id === item.missionId);
        const location = harborline.locations.find(
          (l) => l.id === mission?.locationId,
        );
        return (
          <div
            key={item.missionId}
            className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-200 bg-sky-50 px-4 py-3 shadow-sm"
          >
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wide text-sky-700">
                In progress
              </p>
              <p className="font-semibold text-slate-900">
                {location?.emoji ?? "🎬"} {mission?.title ?? item.missionId}
              </p>
              <p className="text-xs text-slate-600">
                {item.phase === "comic" ? "Comic warmup" : "Live scene"} · turn{" "}
                {item.session.turnCount}/{item.session.maxTurns}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link
                href={`/play/mission/${item.missionId}`}
                className="rounded-full bg-sky-600 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-700"
              >
                Resume →
              </Link>
              <button
                type="button"
                className="rounded-full border border-sky-200 bg-white px-3 py-2 text-sm text-slate-600 hover:bg-sky-50"
                onClick={() => {
                  clearActiveScene(item.missionId);
                  setActive(listActiveScenes());
                }}
              >
                Dismiss
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
