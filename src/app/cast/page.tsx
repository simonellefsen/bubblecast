"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CharacterAvatar } from "@/components/CharacterAvatar";
import {
  harborline,
  isMissionUnlocked,
} from "@/content/harborline/world";
import type { CharacterId, LearnerProfile } from "@/content/types";
import { bondLabel, parseMemoryNotes } from "@/lib/cast-memory";
import { hydrateLearner } from "@/lib/learner-client";
import {
  countCachedPortraits,
  getCachedPortrait,
  setCachedPortrait,
} from "@/lib/portrait-cache";
import {
  loadCastPortraitPref,
  saveCastPortraitPref,
  shouldRequestPortrait,
} from "@/lib/prefs";
import {
  checkAiBudget,
  DAILY_AI_SOFT_CAP,
  loadUsage,
  recordAiUsage,
} from "@/lib/usage";

export default function CastPage() {
  const [learner, setLearner] = useState<LearnerProfile | null>(null);
  const [portraits, setPortraits] = useState<Partial<Record<CharacterId, string>>>(
    {},
  );
  const [pref, setPref] = useState(true);
  const [busyId, setBusyId] = useState<CharacterId | null>(null);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  const refreshPortraits = useCallback(() => {
    const next: Partial<Record<CharacterId, string>> = {};
    for (const c of harborline.characters) {
      const url = getCachedPortrait(c.id);
      if (url) next[c.id] = url;
    }
    setPortraits(next);
    setTick((t) => t + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { learner: hydrated } = await hydrateLearner();
      if (!cancelled) setLearner(hydrated);
    })();
    setPref(loadCastPortraitPref());
    refreshPortraits();
    return () => {
      cancelled = true;
    };
  }, [refreshPortraits]);

  const completed = learner?.completedMissionIds ?? [];
  const remaining = Math.max(0, DAILY_AI_SOFT_CAP - loadUsage().count);
  const cachedCount = countCachedPortraits(
    harborline.characters.map((c) => c.id),
  );

  async function generateOne(characterId: CharacterId): Promise<boolean> {
    if (!shouldRequestPortrait(Math.max(0, DAILY_AI_SOFT_CAP - loadUsage().count))) {
      setNote("AI budget too low for a new portrait (need ~2 actions left).");
      return false;
    }
    const budget = checkAiBudget(1);
    if (!budget.ok) {
      setNote(budget.message);
      return false;
    }
    setBusyId(characterId);
    try {
      const res = await fetch("/api/cast/portrait", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Portrait failed");
      if (data.portrait?.dataUrl) {
        setCachedPortrait(characterId, data.portrait.dataUrl as string);
        recordAiUsage(1);
        refreshPortraits();
        return true;
      }
      setNote(
        data.reason === "disabled"
          ? "Portraits disabled on server (XAI_CAST_PORTRAITS=0)."
          : "Portrait unavailable (no key or Imagine error).",
      );
      return false;
    } catch (e) {
      setNote(e instanceof Error ? e.message : "Portrait failed");
      return false;
    } finally {
      setBusyId(null);
    }
  }

  async function generateMissing() {
    if (!pref) {
      setNote("Turn on Imagine portraits first.");
      return;
    }
    setBulkBusy(true);
    setNote(null);
    let made = 0;
    for (const c of harborline.characters) {
      if (getCachedPortrait(c.id)) continue;
      const ok = await generateOne(c.id);
      if (!ok) break;
      made += 1;
    }
    setBulkBusy(false);
    if (made > 0) {
      setNote(`Generated ${made} portrait${made === 1 ? "" : "s"} (cached this session).`);
    }
  }

  return (
    <AppShell title="Cast">
      <div className="space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">The cast</h1>
            <p className="mt-1 max-w-2xl text-slate-600">
              Recurring characters in {harborline.name}. Relationships grow when you
              complete scenes with them.
            </p>
          </div>
          <div className="rounded-2xl border bg-white px-4 py-3 text-sm shadow-sm">
            <label className="flex items-center gap-2 text-slate-700">
              <input
                type="checkbox"
                checked={pref}
                onChange={(e) => {
                  const v = e.target.checked;
                  setPref(v);
                  saveCastPortraitPref(v);
                }}
              />
              Imagine portraits
            </label>
            <p className="mt-1 text-xs text-slate-400">
              {cachedCount}/{harborline.characters.length} cached · ~{remaining} AI
              left
            </p>
            <button
              type="button"
              disabled={bulkBusy || !pref}
              onClick={() => void generateMissing()}
              className="mt-2 rounded-full bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-orange-600 disabled:opacity-50"
            >
              {bulkBusy ? "Generating…" : "Generate missing"}
            </button>
          </div>
        </div>

        {note ? (
          <p className="rounded-xl border border-amber-100 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {note}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2" key={tick}>
          {harborline.characters.map((c) => {
            const rel = learner?.relationships.find((r) => r.characterId === c.id);
            const score = rel?.score ?? 20;
            const bond = bondLabel(score);
            const memories = parseMemoryNotes(rel?.notes ?? "", 3);
            const missions = harborline.missions.filter((m) =>
              m.castIds.includes(c.id),
            );
            const portrait = portraits[c.id] ?? null;
            return (
              <article
                key={c.id}
                className="flex gap-4 rounded-2xl border bg-white p-4 shadow-sm"
              >
                <div className="flex flex-col items-center gap-2">
                  <CharacterAvatar
                    character={c}
                    size="lg"
                    emotion="warm"
                    portraitUrl={portrait}
                  />
                  {pref ? (
                    <button
                      type="button"
                      disabled={busyId === c.id || bulkBusy}
                      onClick={() => void generateOne(c.id)}
                      className="text-[11px] font-medium text-orange-700 underline disabled:opacity-50"
                    >
                      {busyId === c.id
                        ? "…"
                        : portrait
                          ? "Regenerate"
                          : "Imagine"}
                    </button>
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold">{c.name}</h2>
                      <p className="text-sm text-slate-500">{c.role}</p>
                    </div>
                    <div className="text-right">
                      <span
                        className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: c.accentColor }}
                      >
                        {score}/100
                      </span>
                      <p className="mt-1 text-[11px] capitalize text-slate-400">
                        {bond}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{c.bio}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Hook: {c.teachingHook}
                  </p>
                  {memories.length > 0 ? (
                    <ul className="mt-2 space-y-0.5 text-xs italic text-slate-500">
                      {memories.map((m) => (
                        <li key={m} className="line-clamp-1">
                          · {m}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all motion-reduce:transition-none"
                      style={{
                        width: `${score}%`,
                        backgroundColor: c.accentColor,
                      }}
                    />
                  </div>
                  {missions.length > 0 ? (
                    <div className="mt-3">
                      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                        Scenes
                      </p>
                      <ul className="mt-1 flex flex-wrap gap-1.5">
                        {missions.map((m) => {
                          const unlocked = isMissionUnlocked(m.id, completed);
                          const done = completed.includes(m.id);
                          if (!unlocked) {
                            return (
                              <li
                                key={m.id}
                                className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-400"
                                title={m.unlockHint}
                              >
                                🔒 {m.title}
                              </li>
                            );
                          }
                          return (
                            <li key={m.id}>
                              <Link
                                href={`/play/mission/${m.id}`}
                                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                                  done
                                    ? "bg-emerald-50 text-emerald-800 hover:bg-emerald-100"
                                    : "bg-orange-50 text-orange-800 hover:bg-orange-100"
                                }`}
                              >
                                {done ? "✓ " : ""}
                                {m.title}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
