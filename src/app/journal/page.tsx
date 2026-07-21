"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import type { LearnerProfile } from "@/content/types";
import { hydrateLearner } from "@/lib/learner-client";
import { harborline } from "@/content/harborline/world";

export default function JournalPage() {
  const [learner, setLearner] = useState<LearnerProfile | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { learner: hydrated } = await hydrateLearner();
      if (!cancelled) setLearner(hydrated);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell title="Journal">
      {!learner ? (
        <p className="text-slate-500">Loading…</p>
      ) : (
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Vocab journal</h1>
            <p className="mt-1 text-slate-600">
              Words and phrases from your Harborline scenes. Synced when Supabase is
              configured.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="XP" value={String(learner.xp)} />
            <Stat
              label="Scenes done"
              value={String(learner.completedMissionIds.length)}
            />
            <Stat label="Words" value={String(learner.vocab.length)} />
          </div>

          <section className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Completed missions</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {learner.completedMissionIds.length === 0 ? (
                <li className="text-slate-500">None yet — try Mercado Café.</li>
              ) : (
                learner.completedMissionIds.map((id) => {
                  const m = harborline.missions.find((x) => x.id === id);
                  return (
                    <li
                      key={id}
                      className="flex justify-between border-b border-slate-50 py-2"
                    >
                      <span>{m?.title ?? id}</span>
                      <span className="text-slate-400">{m?.difficulty}</span>
                    </li>
                  );
                })
              )}
            </ul>
          </section>

          <section className="rounded-2xl border bg-white p-4 shadow-sm">
            <h2 className="font-semibold">Vocabulary</h2>
            <ul className="mt-3 divide-y">
              {learner.vocab.length === 0 ? (
                <li className="py-2 text-sm text-slate-500">
                  Finish a mission debrief to collect words.
                </li>
              ) : (
                learner.vocab.map((v) => (
                  <li
                    key={`${v.word}-${v.lastSeenAt}`}
                    className="flex items-start justify-between gap-3 py-2 text-sm"
                  >
                    <div>
                      <div className="font-medium">{v.word}</div>
                      <div className="text-slate-500">{v.gloss}</div>
                    </div>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-600">
                      {v.status}
                    </span>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      )}
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border bg-white p-4 shadow-sm">
      <div className="text-xs uppercase tracking-wide text-slate-400">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
