"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type {
  Character,
  LearnerProfile,
  Location,
  MissionTemplate,
} from "@/content/types";
import {
  resolveSceneCefr,
  type SceneDifficultyPref,
} from "@/lib/cefr-adapt";
import { DAILY_AI_SOFT_CAP, loadUsage } from "@/lib/usage";
import { CharacterAvatar } from "./CharacterAvatar";

export function MissionBrief({
  mission,
  location,
  cast,
  learner,
  busy,
  onStart,
  onStartOffline,
  includeComic,
  onIncludeComicChange,
  includeAtmosphere,
  onIncludeAtmosphereChange,
  atmosphereCached,
  difficultyPref,
  onDifficultyPrefChange,
  locked,
  lockHint,
}: {
  mission: MissionTemplate;
  location: Location;
  cast: Character[];
  learner: LearnerProfile;
  busy: boolean;
  onStart: () => void;
  /** Offline / zero-AI local warmup (no network). */
  onStartOffline?: () => void;
  includeComic: boolean;
  onIncludeComicChange: (v: boolean) => void;
  includeAtmosphere: boolean;
  onIncludeAtmosphereChange: (v: boolean) => void;
  atmosphereCached?: boolean;
  difficultyPref: SceneDifficultyPref;
  onDifficultyPrefChange: (v: SceneDifficultyPref) => void;
  locked?: boolean;
  lockHint?: string;
}) {
  const [aiUsed, setAiUsed] = useState(0);
  const [shareNote, setShareNote] = useState<string | null>(null);
  const [online, setOnline] = useState(true);

  useEffect(() => {
    setAiUsed(loadUsage().count);
    setOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const remaining = Math.max(0, DAILY_AI_SOFT_CAP - aiUsed);
  const atmosphereBlockedByBudget =
    includeComic && !atmosphereCached && remaining < 3;
  const sceneCefr = resolveSceneCefr(
    learner.cefr,
    mission.difficulty,
    difficultyPref,
  );
  const budgetBlocked = remaining < 1;
  const preferOffline = !online || budgetBlocked;

  async function copyMissionLink() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/play/mission/${mission.id}`
        : `https://bubblecast.vercel.app/play/mission/${mission.id}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareNote("Link copied");
    } catch {
      setShareNote(url);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-5">
      <div>
        <p className="text-sm text-slate-500">
          {location.emoji} {location.name} · mission {mission.difficulty}
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">
          {mission.title}
        </h1>
        <p className="mt-2 text-slate-600">{mission.blurb}</p>
      </div>

      {locked ? (
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
          <p className="font-semibold">🔒 Mission locked</p>
          <p className="mt-1">
            {lockHint ?? "Complete earlier missions to unlock."}
          </p>
          <Link
            href="/play"
            className="mt-3 inline-block text-orange-700 hover:underline"
          >
            ← Back to map
          </Link>
        </div>
      ) : null}

      {!online ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">You’re offline</p>
          <p className="mt-1">
            Full AI cast needs a connection. You can still run an offline phrase
            warmup or open free drill / journal.
          </p>
        </div>
      ) : null}

      {online && budgetBlocked ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          <p className="font-semibold">Daily AI budget used up</p>
          <p className="mt-1">
            Soft cap reached. Use offline warmup or{" "}
            <Link href="/journal#phrase-drill" className="underline">
              free phrase drill
            </Link>{" "}
            — no AI cost.
          </p>
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
            const rel = learner.relationships.find(
              (r) => r.characterId === c.id,
            );
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
          <div className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              Scene difficulty (this run only)
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Profile stays CEFR {learner.cefr}. Cast language for this scene:{" "}
              <span className="font-semibold text-slate-700">{sceneCefr}</span>
              {sceneCefr !== learner.cefr ? " (adjusted)" : ""}. Mid-scene soft
              adapt may ease or stretch once.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(
                [
                  ["easier", "Easier"],
                  ["match", "Match me"],
                  ["stretch", "Stretch"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => onDifficultyPrefChange(value)}
                  className={`rounded-full px-3 py-1.5 text-xs font-medium ${
                    difficultyPref === value
                      ? "bg-orange-500 text-white"
                      : "border bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-slate-600">
              <input
                type="checkbox"
                checked={includeComic}
                onChange={(e) => onIncludeComicChange(e.target.checked)}
              />
              Comic warmup first (recommended)
            </label>
            <label
              className={`flex items-center gap-2 text-sm ${
                includeComic && online && !budgetBlocked
                  ? "text-slate-600"
                  : "text-slate-400"
              }`}
            >
              <input
                type="checkbox"
                checked={includeAtmosphere && includeComic && online}
                disabled={
                  !includeComic ||
                  atmosphereBlockedByBudget ||
                  !online ||
                  budgetBlocked
                }
                onChange={(e) => onIncludeAtmosphereChange(e.target.checked)}
              />
              Imagine atmosphere art
              {atmosphereCached ? (
                <span className="text-xs text-emerald-700">
                  (free — reused for {location.name})
                </span>
              ) : atmosphereBlockedByBudget ? (
                <span className="text-xs text-amber-700">
                  (needs ~3 AI budget left)
                </span>
              ) : (
                <span className="text-xs text-slate-400">(+1 AI action)</span>
              )}
            </label>
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={busy || preferOffline}
              onClick={onStart}
              className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-orange-600 disabled:opacity-60"
              title={
                !online
                  ? "Needs connection"
                  : budgetBlocked
                    ? "AI budget empty"
                    : undefined
              }
            >
              {busy ? "Starting…" : "Start AI scene →"}
            </button>
            {onStartOffline ? (
              <button
                type="button"
                disabled={busy}
                onClick={onStartOffline}
                className="rounded-full border border-slate-300 bg-white px-5 py-3 text-sm font-semibold text-slate-800 hover:bg-slate-50 disabled:opacity-60"
              >
                {preferOffline ? "Offline warmup →" : "Offline warmup"}
              </button>
            ) : null}
            <Link
              href="/journal#phrase-drill"
              className="rounded-full border bg-white px-5 py-3 text-sm text-slate-700"
            >
              Free drill
            </Link>
            <Link
              href="/play"
              className="rounded-full border bg-white px-5 py-3 text-sm text-slate-700"
            >
              Map
            </Link>
          </div>
        </>
      ) : null}

      <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
        <span>
          Playing as {learner.displayName} · profile CEFR {learner.cefr} · scene{" "}
          {sceneCefr} · {learner.xp} XP
          {" · "}
          AI budget ~{remaining}/{DAILY_AI_SOFT_CAP}
          {!online ? " · offline" : ""}
        </span>
        <button
          type="button"
          onClick={() => void copyMissionLink()}
          className="font-medium text-orange-700 underline"
        >
          Copy mission link
        </button>
        {shareNote ? <span className="text-slate-500">{shareNote}</span> : null}
      </div>
    </div>
  );
}
