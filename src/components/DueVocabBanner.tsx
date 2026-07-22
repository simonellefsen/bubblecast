"use client";

import Link from "next/link";
import type { LearnerProfile } from "@/content/types";
import { countDueVocab } from "@/lib/srs";

export function DueVocabBanner({ learner }: { learner: LearnerProfile }) {
  const due = countDueVocab(learner.vocab);
  if (due <= 0) return null;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm shadow-sm">
      <div>
        <p className="font-semibold text-amber-950">
          {due} vocab card{due === 1 ? "" : "s"} due
        </p>
        <p className="text-xs text-amber-900/80">
          A quick journal session keeps phrases warm before your next scene.
        </p>
      </div>
      <Link
        href="/journal"
        className="shrink-0 rounded-full bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700"
      >
        Practice →
      </Link>
    </div>
  );
}
