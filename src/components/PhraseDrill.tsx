"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  buildDrillItems,
  buildPhraseBank,
  type DrillItem,
} from "@/lib/phrase-bank";
import { recordActivity } from "@/lib/streak";

type Mode = "unlocked" | "all";

export function PhraseDrill({
  completedMissionIds,
}: {
  completedMissionIds: string[];
}) {
  const [mode, setMode] = useState<Mode>(
    completedMissionIds.length > 0 ? "unlocked" : "all",
  );
  const [round, setRound] = useState(0);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const [finished, setFinished] = useState(false);

  const bank = useMemo(() => {
    if (mode === "all") return buildPhraseBank();
    // Prefer completed missions; if none, seed with default-unlocked café phrases
    const ids =
      completedMissionIds.length > 0
        ? completedMissionIds
        : ["cafe-breakfast"];
    const scoped = buildPhraseBank({ missionIds: ids });
    return scoped.length ? scoped : buildPhraseBank();
  }, [mode, completedMissionIds]);

  const items: DrillItem[] = useMemo(
    () => buildDrillItems(bank, 8),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reshuffle on round
    [bank, round],
  );

  function startRound() {
    setRound((r) => r + 1);
    setIndex(0);
    setPicked(null);
    setCorrect(0);
    setFinished(false);
  }

  function choose(optionIndex: number) {
    if (picked !== null || finished) return;
    setPicked(optionIndex);
    const item = items[index];
    if (optionIndex === item.correctIndex) {
      setCorrect((c) => c + 1);
    }
  }

  function next() {
    if (index + 1 >= items.length) {
      setFinished(true);
      recordActivity();
      return;
    }
    setIndex((i) => i + 1);
    setPicked(null);
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-white/70 p-6 text-center text-sm text-slate-500">
        No phrases available yet.
      </div>
    );
  }

  if (finished) {
    const pct = Math.round((correct / items.length) * 100);
    return (
      <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          Free phrase drill · no AI
        </p>
        <p className="mt-2 text-2xl font-semibold text-emerald-950">
          {correct}/{items.length} ({pct}%)
        </p>
        <p className="mt-1 text-sm text-emerald-800">
          Streak day recorded. Jump into a live scene when you want AI coaching.
        </p>
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={startRound}
            className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
          >
            Drill again
          </button>
          <Link
            href="/play"
            className="rounded-full border border-emerald-200 bg-white px-4 py-2 text-sm font-medium text-emerald-900"
          >
            City map
          </Link>
        </div>
      </div>
    );
  }

  const item = items[index];
  const { card, options } = item;

  return (
    <div className="rounded-2xl border border-orange-100 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="font-semibold text-slate-900">Free phrase drill</h2>
          <p className="text-xs text-slate-500">
            No AI · no budget · English cue → pick Spanish
          </p>
        </div>
        <div className="flex gap-1 text-xs">
          <button
            type="button"
            onClick={() => {
              setMode("unlocked");
              startRound();
            }}
            className={`rounded-full px-2.5 py-1 font-medium ${
              mode === "unlocked"
                ? "bg-orange-500 text-white"
                : "border bg-white text-slate-600"
            }`}
          >
            Your path
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("all");
              startRound();
            }}
            className={`rounded-full px-2.5 py-1 font-medium ${
              mode === "all"
                ? "bg-orange-500 text-white"
                : "border bg-white text-slate-600"
            }`}
          >
            All Harborline
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
        <span>
          {card.locationEmoji} {card.missionTitle} · {card.difficulty}
        </span>
        <span>
          {index + 1}/{items.length} · ✓ {correct}
        </span>
      </div>

      <p className="mt-4 rounded-xl bg-slate-50 px-4 py-3 text-center text-sm font-medium text-slate-800">
        {card.english}
      </p>

      <ul className="mt-3 grid gap-2 sm:grid-cols-2">
        {options.map((opt, i) => {
          let style =
            "border-slate-200 bg-white hover:border-orange-300 hover:bg-orange-50/50";
          if (picked !== null) {
            if (i === item.correctIndex) {
              style = "border-emerald-400 bg-emerald-50 text-emerald-900";
            } else if (i === picked) {
              style = "border-red-300 bg-red-50 text-red-900";
            } else {
              style = "border-slate-100 bg-slate-50 text-slate-400";
            }
          }
          return (
            <li key={`${opt}-${i}`}>
              <button
                type="button"
                disabled={picked !== null}
                onClick={() => choose(i)}
                className={`w-full rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition disabled:cursor-default ${style}`}
              >
                {opt}
              </button>
            </li>
          );
        })}
      </ul>

      {picked !== null ? (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-slate-600">
            {picked === item.correctIndex ? (
              <span className="font-medium text-emerald-700">Correct</span>
            ) : (
              <span>
                Answer:{" "}
                <span className="font-medium text-slate-900">
                  {card.spanish}
                </span>
              </span>
            )}
          </p>
          <button
            type="button"
            onClick={next}
            className="rounded-full bg-orange-500 px-4 py-2 text-sm font-semibold text-white hover:bg-orange-600"
          >
            {index + 1 >= items.length ? "See results" : "Next →"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
