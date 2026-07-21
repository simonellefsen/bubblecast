"use client";

import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { CityMap } from "@/components/CityMap";
import type { LearnerProfile } from "@/content/types";
import { loadLearner } from "@/lib/learner-client";

export default function PlayPage() {
  const [learner, setLearner] = useState<LearnerProfile | null>(null);

  useEffect(() => {
    setLearner(loadLearner());
  }, []);

  return (
    <AppShell title="Play">
      {learner ? (
        <CityMap learner={learner} />
      ) : (
        <div className="text-slate-500">Loading your traveler profile…</div>
      )}
    </AppShell>
  );
}
