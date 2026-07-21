"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import type { CefrLevel, LearnerProfile } from "@/content/types";
import { loadLearner, resetLearner, saveLearner } from "@/lib/learner-client";

const levels: CefrLevel[] = ["A1", "A2", "B1", "B2"];

export default function SettingsPage() {
  const [learner, setLearner] = useState<LearnerProfile | null>(null);
  const [health, setHealth] = useState<{
    hasXaiKey: boolean;
    model: string;
  } | null>(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLearner(loadLearner());
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ hasXaiKey: false, model: "unknown" }));
  }, []);

  function update<K extends keyof LearnerProfile>(key: K, value: LearnerProfile[K]) {
    if (!learner) return;
    const next = { ...learner, [key]: value, updatedAt: new Date().toISOString() };
    setLearner(next);
    saveLearner(next);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <AppShell title="Settings">
      <div className="mx-auto max-w-lg space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Settings</h1>
          <p className="mt-1 text-slate-600">
            Local profile only — no account required for the MVP.
          </p>
        </div>

        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">API</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">XAI_API_KEY</dt>
              <dd className={health?.hasXaiKey ? "text-emerald-600" : "text-amber-600"}>
                {health ? (health.hasXaiKey ? "configured" : "missing") : "…"}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Model</dt>
              <dd className="font-mono text-xs">{health?.model ?? "…"}</dd>
            </div>
          </dl>
          {!health?.hasXaiKey ? (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Add <code>XAI_API_KEY=…</code> to <code>.env.local</code> and restart{" "}
              <code>npm run dev</code>. Without it, scenes use limited offline fallbacks.
            </p>
          ) : null}
        </section>

        {learner ? (
          <section className="space-y-4 rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Learner profile</h2>
            <label className="block text-sm">
              <span className="text-slate-500">Display name</span>
              <input
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={learner.displayName}
                onChange={(e) => update("displayName", e.target.value)}
              />
            </label>
            <label className="block text-sm">
              <span className="text-slate-500">CEFR level</span>
              <select
                className="mt-1 w-full rounded-xl border px-3 py-2"
                value={learner.cefr}
                onChange={(e) => update("cefr", e.target.value as CefrLevel)}
              >
                {levels.map((l) => (
                  <option key={l} value={l}>
                    {l}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-xs text-slate-500">
              Target: Spanish · L1: English · XP: {learner.xp}
              {saved ? " · saved" : ""}
            </p>
            <button
              type="button"
              onClick={() => setLearner(resetLearner())}
              className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              Reset local progress
            </button>
          </section>
        ) : null}
      </div>
    </AppShell>
  );
}
