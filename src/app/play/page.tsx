"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CityMap } from "@/components/CityMap";
import type { LearnerProfile } from "@/content/types";
import { hydrateLearner } from "@/lib/learner-client";

export default function PlayPage() {
  const [learner, setLearner] = useState<LearnerProfile | null>(null);
  const [syncNote, setSyncNote] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { learner: hydrated, source, error } = await hydrateLearner();
      if (cancelled) return;
      setLearner(hydrated);
      if (error) setSyncNote(error);
      else if (source === "supabase") setSyncNote("Progress synced to cloud");
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppShell title="Play">
      {syncNote ? (
        <p className="mb-3 text-xs text-slate-500">{syncNote}</p>
      ) : null}
      {learner ? (
        <CityMap learner={learner} />
      ) : (
        <div className="text-slate-500">Loading your traveler profile…</div>
      )}
    </AppShell>
  );
}
