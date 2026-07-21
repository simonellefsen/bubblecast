"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CharacterAvatar } from "@/components/CharacterAvatar";
import { harborline } from "@/content/harborline/world";
import type { LearnerProfile } from "@/content/types";
import { loadLearner } from "@/lib/learner-client";

export default function CastPage() {
  const [learner, setLearner] = useState<LearnerProfile | null>(null);

  useEffect(() => {
    setLearner(loadLearner());
  }, []);

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
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${score}%`,
                        backgroundColor: c.accentColor,
                      }}
                    />
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </AppShell>
  );
}
