"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CharacterAvatar } from "@/components/CharacterAvatar";
import {
  harborline,
  isMissionUnlocked,
} from "@/content/harborline/world";
import type { LearnerProfile } from "@/content/types";
import { hydrateLearner } from "@/lib/learner-client";

export default function CastPage() {
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

  const completed = learner?.completedMissionIds ?? [];

  return (
    <AppShell title="Cast">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">The cast</h1>
          <p className="mt-1 max-w-2xl text-slate-600">
            Recurring characters in {harborline.name}. Relationships grow when you
            complete scenes with them.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {harborline.characters.map((c) => {
            const rel = learner?.relationships.find((r) => r.characterId === c.id);
            const score = rel?.score ?? 20;
            const missions = harborline.missions.filter((m) =>
              m.castIds.includes(c.id),
            );
            return (
              <article
                key={c.id}
                className="flex gap-4 rounded-2xl border bg-white p-4 shadow-sm"
              >
                <CharacterAvatar character={c} size="lg" emotion="warm" />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold">{c.name}</h2>
                      <p className="text-sm text-slate-500">{c.role}</p>
                    </div>
                    <span
                      className="rounded-full px-2 py-0.5 text-xs font-medium text-white"
                      style={{ backgroundColor: c.accentColor }}
                    >
                      {score}/100
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{c.bio}</p>
                  <p className="mt-2 text-xs text-slate-500">
                    Hook: {c.teachingHook}
                  </p>
                  {rel?.notes ? (
                    <p className="mt-2 line-clamp-2 text-xs italic text-slate-500">
                      Memory: {rel.notes}
                    </p>
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
