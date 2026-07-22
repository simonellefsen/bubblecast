"use client";

import { useEffect, useState } from "react";
import type { LearnerProfile, VocabEntry } from "@/content/types";
import { evaluateAchievements } from "@/lib/achievements";
import { updateVocabStatus } from "@/lib/learner-client";
import { countDueVocab, isVocabDue, sortForPractice } from "@/lib/srs";
import { recordActivity } from "@/lib/streak";

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function buildDeck(vocab: VocabEntry[]): VocabEntry[] {
  const due = sortForPractice(vocab).filter((v) => isVocabDue(v));
  const pool = due.length ? due : sortForPractice(vocab);
  // Keep due order mostly; light shuffle within same priority band
  return shuffle(pool).slice(0, 12);
}

export function VocabPractice({
  learner,
  onUpdate,
}: {
  learner: LearnerProfile;
  onUpdate: (next: LearnerProfile) => void;
}) {
  const [deck, setDeck] = useState<VocabEntry[]>([]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [done, setDone] = useState(0);
  const [round, setRound] = useState(0);
  const dueCount = countDueVocab(learner.vocab);

  // Stable deck per practice round (don't reshuffle when statuses update)
  useEffect(() => {
    setDeck(buildDeck(learner.vocab));
    setIndex(0);
    setFlipped(false);
    setDone(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [round, learner.vocab.length]);

  if (learner.vocab.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-500">
        Finish a mission debrief to collect words, then practice them here.
      </div>
    );
  }

  if (deck.length === 0 || index >= deck.length) {
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center">
        <p className="font-semibold text-emerald-900">Session complete</p>
        <p className="mt-1 text-sm text-emerald-800">
          Reviewed {done || deck.length} card{done === 1 ? "" : "s"}.
          {dueCount === 0
            ? " You’re caught up for today."
            : ` ${dueCount} still due overall.`}
        </p>
        <button
          type="button"
          className="mt-4 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => setRound((r) => r + 1)}
        >
          Practice again
        </button>
      </div>
    );
  }

  const card = deck[index];

  function grade(status: VocabEntry["status"]) {
    const next = updateVocabStatus(learner, card.word, status);
    onUpdate(next);
    recordActivity();
    evaluateAchievements(next);
    setFlipped(false);
    setDone((d) => d + 1);
    setIndex((i) => i + 1);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-orange-100 bg-gradient-to-b from-orange-50/80 to-white p-4 shadow-sm">
      <div className="flex items-center justify-between text-xs text-slate-500">
        <span className="font-semibold uppercase tracking-wide text-orange-700">
          Quick practice · SRS-lite
        </span>
        <span>
          {index + 1} / {deck.length}
          {dueCount > 0 ? ` · ${dueCount} due` : ""}
        </span>
      </div>

      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="flex min-h-[160px] w-full flex-col items-center justify-center rounded-2xl border border-orange-200 bg-white px-4 py-8 text-center shadow-sm transition hover:border-orange-300"
      >
        {!flipped ? (
          <>
            <p className="text-2xl font-semibold text-slate-900">{card.word}</p>
            <p className="mt-3 text-xs text-slate-400">Tap to reveal English</p>
          </>
        ) : (
          <>
            <p className="text-sm font-medium text-orange-600">{card.word}</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{card.gloss}</p>
            <p className="mt-3 text-xs capitalize text-slate-400">
              was: {card.status}
              {card.nextReviewAt
                ? ` · was due ${isVocabDue(card) ? "now" : "later"}`
                : ""}
            </p>
          </>
        )}
      </button>

      {flipped ? (
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={() => grade("new")}
            className="rounded-xl border border-rose-200 bg-rose-50 px-2 py-2.5 text-xs font-semibold text-rose-800"
          >
            Still new
            <span className="mt-0.5 block font-normal opacity-70">+1 day</span>
          </button>
          <button
            type="button"
            onClick={() => grade("fuzzy")}
            className="rounded-xl border border-amber-200 bg-amber-50 px-2 py-2.5 text-xs font-semibold text-amber-900"
          >
            Fuzzy
            <span className="mt-0.5 block font-normal opacity-70">+3 days</span>
          </button>
          <button
            type="button"
            onClick={() => grade("known")}
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-2 py-2.5 text-xs font-semibold text-emerald-900"
          >
            Know it
            <span className="mt-0.5 block font-normal opacity-70">+7 days</span>
          </button>
        </div>
      ) : (
        <p className="text-center text-xs text-slate-500">
          Due cards first · intervals grow as status improves
        </p>
      )}
    </div>
  );
}
