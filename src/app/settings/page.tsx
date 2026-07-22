"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import type { CefrLevel, LearnerProfile } from "@/content/types";
import {
  exportProgressBackup,
  hydrateLearner,
  importProgressBackup,
  resetLearner,
  saveLearner,
} from "@/lib/learner-client";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { loadStreak } from "@/lib/streak";

const levels: CefrLevel[] = ["A1", "A2", "B1", "B2"];

export default function SettingsPage() {
  const [learner, setLearner] = useState<LearnerProfile | null>(null);
  const [health, setHealth] = useState<{
    hasXaiKey: boolean;
    model: string;
  } | null>(null);
  const [saved, setSaved] = useState(false);
  const [cloudNote, setCloudNote] = useState<string | null>(null);
  const [backupNote, setBackupNote] = useState<string | null>(null);
  const [streak, setStreak] = useState(0);
  const supabaseOn = isSupabaseConfigured();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { learner: hydrated, source, error } = await hydrateLearner();
      if (cancelled) return;
      setLearner(hydrated);
      if (error) setCloudNote(error);
      else if (source === "supabase") setCloudNote("Cloud profile active");
      else if (supabaseOn) setCloudNote("Using local cache");
      else setCloudNote("Supabase env not set — local only");
    })();
    setStreak(loadStreak().count);
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ hasXaiKey: false, model: "unknown" }));
    return () => {
      cancelled = true;
    };
  }, [supabaseOn]);

  function downloadBackup() {
    const backup = exportProgressBackup();
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `bubblecast-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setBackupNote("Backup downloaded");
  }

  async function onImportFile(file: File | null) {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as unknown;
      const result = importProgressBackup(parsed);
      if (!result.ok) {
        setBackupNote(result.error);
        return;
      }
      setLearner(result.learner);
      setBackupNote("Backup restored (local + cloud profile if configured)");
    } catch {
      setBackupNote("Invalid JSON file");
    }
  }

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
            Profile syncs to Supabase schema <code className="text-xs">bubblecast</code>{" "}
            when configured.
          </p>
        </div>

        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Backend</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Supabase</dt>
              <dd className={supabaseOn ? "text-emerald-600" : "text-amber-600"}>
                {supabaseOn ? "configured" : "missing env"}
              </dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-slate-500">Progress</dt>
              <dd className="text-right text-slate-700">{cloudNote ?? "…"}</dd>
            </div>
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
          {!supabaseOn ? (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Set <code>NEXT_PUBLIC_SUPABASE_URL</code> and{" "}
              <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>. Enable{" "}
              <strong>Anonymous</strong> sign-ins in Supabase Auth.
            </p>
          ) : (
            <p className="mt-3 rounded-xl bg-emerald-50 px-3 py-2 text-xs text-emerald-800">
              Shared project tenant: only <code>bubblecast.*</code> tables/views. Enable
              Anonymous auth if sign-in fails.
            </p>
          )}
          {!health?.hasXaiKey ? (
            <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Add <code>XAI_API_KEY</code> for full AI scenes (server-only).
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
              {streak > 0 ? ` · 🔥 ${streak}d` : ""}
              {learner.id !== "local-learner" ? (
                <span className="ml-1 font-mono text-[10px] text-slate-400">
                  · {learner.id.slice(0, 8)}…
                </span>
              ) : null}
              {saved ? " · saved" : ""}
            </p>
            <button
              type="button"
              onClick={async () => setLearner(await resetLearner())}
              className="rounded-full border border-red-200 px-4 py-2 text-sm text-red-700 hover:bg-red-50"
            >
              Reset progress
            </button>
          </section>
        ) : null}

        <section className="space-y-3 rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Backup</h2>
          <p className="text-sm text-slate-600">
            Export a JSON snapshot of local progress (XP, missions, vocab, bonds).
            Import on another device or after clearing browser data.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={downloadBackup}
              className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
            >
              Export JSON
            </button>
            <label className="cursor-pointer rounded-full border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Import JSON
              <input
                type="file"
                accept="application/json,.json"
                className="hidden"
                onChange={(e) => void onImportFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
          {backupNote ? (
            <p className="text-xs text-slate-500">{backupNote}</p>
          ) : null}
        </section>

        <section className="rounded-2xl border bg-white p-4 shadow-sm">
          <h2 className="font-semibold">Phone install</h2>
          <p className="mt-1 text-sm text-slate-600">
            Save Bubblecast to your home screen for a full-screen, app-like experience —
            no store download.
          </p>
          <button
            type="button"
            onClick={() => {
              try {
                localStorage.removeItem("bubblecast-homescreen-modal-v1");
              } catch {
                /* ignore */
              }
              window.dispatchEvent(new Event("bubblecast:show-homescreen-modal"));
            }}
            className="mt-3 rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            How to add to home screen
          </button>
        </section>
      </div>
    </AppShell>
  );
}
