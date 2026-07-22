"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { Character, LearnerProfile, Location, MissionTemplate } from "@/content/types";
import { DAILY_AI_SOFT_CAP, loadUsage } from "@/lib/usage";
import { CharacterAvatar } from "./CharacterAvatar";

export function MissionBrief({
  mission,
  location,
  cast,
  learner,
  busy,
  onStart,
  includeComic,
  onIncludeComicChange,
  locked,
  lockHint,
}: {
  mission: MissionTemplate;
  location: Location;
  cast: Character[];
  learner: LearnerProfile;
  busy: boolean;
  onStart: () => void;
  includeComic: boolean;
  onIncludeComicChange: (v: boolean) => void;
  locked?: boolean;
  lockHint?: string;
}) {
  const [aiUsed, setAiUsed] = useState(0);
  useEffect(() => {
    setAiUsed(loadUsage().count);
  }, []);
  const remaining = Math.max(0, DAILY_AI_SOFT_CAP - aiUsed);

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <p className="text-sm text-slate-500">
          {location.emoji} {location.name} · {mission.difficulty}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{mission.title}</h1>
        <p className="mt-2 text-slate-600">{mission.blurb}</p>
      </div>

      {locked ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold">🔒 Mission locked</p>
          <p className="mt-1">{lockHint ?? "Complete earlier missions to unlock."}</p>
          <Link
            href="/play"
            className="mt-3 inline-block text-orange-700 hover:underline"
          >
            ← Back to map
          </Link>
        </div>
      ) : null}

      <div className="rounded-2xl border border-orange-100 bg-orange-50/50 p-4">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-orange-700">
          Your goal
        </h2>
        <p className="mt-1 font-medium text-slate-900">{mission.learnerGoal}</p>
        <ul className="mt-3 space-y-1 text-sm text-slate-700">
          {mission.learningGoals.map((g) => (
            <li key={g} className="flex gap-2">
              <span className="text-orange-500">✓</span>
              <span>{g}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Cast
        </h2>
        <div className="mt-3 flex flex-wrap gap-4">
          {cast.map((c) => {
            const rel = learner.relationships.find((r) => r.characterId === c.id);
            return (
              <div key={c.id} className="flex items-center gap-3">
                <CharacterAvatar character={c} size="md" emotion="warm" />
                <div className="text-sm">
                  <div className="font-medium">{c.name}</div>
                  <div className="text-slate-500">{c.role}</div>
                  <div className="text-xs text-slate-400">
                    Bond {rel?.score ?? 20}/100
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border bg-white p-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
          Target phrases
        </h2>
        <ul className="mt-2 flex flex-wrap gap-2">
          {mission.targetPhrases.map((p) => (
            <li
              key={p}
              className="rounded-full bg-orange-50 px-2.5 py-1 text-xs font-medium text-orange-800"
            >
              {p}
            </li>
          ))}
        </ul>
      </div>

      {!locked ? (
        <>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={includeComic}
              onChange={(e) => onIncludeComicChange(e.target.checked)}
            />
            Comic warmup first (recommended)
          </label>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy}
              onClick={onStart}
              className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-orange-600 disabled:opacity-60"
            >
              {busy ? "Starting…" : "Start scene →"}
            </button>
            <Link
              href="/play"
              className="rounded-full border bg-white px-5 py-3 text-sm text-slate-700"
            >
              Back to map
            </Link>
          </div>
        </>
      ) : null}

      <p className="text-xs text-slate-400">
        Playing as {learner.displayName} · CEFR {learner.cefr} · {learner.xp} XP
        {" · "}
        AI budget ~{remaining}/{DAILY_AI_SOFT_CAP} left today
      </p>
    </div>
  );
}
