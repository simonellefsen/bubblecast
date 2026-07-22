"use client";

import type { Emotion, SceneTurn } from "@/content/types";
import { getCharacter } from "@/content/harborline/world";

export function SpeechBubble({
  turn,
  showGloss,
  streaming = false,
}: {
  turn: SceneTurn;
  showGloss: boolean;
  streaming?: boolean;
}) {
  if (turn.role === "system") {
    return (
      <div className="mx-auto max-w-md rounded-2xl border border-dashed border-slate-300 bg-white/50 px-4 py-2 text-center text-sm italic text-slate-600">
        {turn.text}
      </div>
    );
  }

  const isLearner = turn.role === "learner";
  let name = "You";
  let color = "#0f172a";
  if (!isLearner && turn.speakerId && turn.speakerId !== "learner") {
    try {
      const c = getCharacter(turn.speakerId);
      name = c.name;
      color = c.accentColor;
    } catch {
      name = String(turn.speakerId);
    }
  }

  return (
    <div className={`flex ${isLearner ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${
          isLearner
            ? "rounded-br-md bg-slate-900 text-white"
            : "rounded-bl-md border bg-white text-slate-900"
        } ${streaming && !isLearner ? "ring-2 ring-orange-200" : ""}`}
        style={!isLearner ? { borderColor: color } : undefined}
      >
        <div
          className={`mb-1 text-[11px] font-semibold uppercase tracking-wide ${
            isLearner ? "text-slate-300" : "text-slate-500"
          }`}
        >
          {name}
          {turn.emotion ? (
            <span className="ml-2 font-normal normal-case opacity-70">
              {emotionLabel(turn.emotion)}
            </span>
          ) : null}
          {streaming && !isLearner ? (
            <span className="ml-2 font-normal normal-case text-orange-500">
              typing…
            </span>
          ) : null}
        </div>
        <p className="text-[15px] leading-relaxed whitespace-pre-wrap">
          {turn.text}
          {streaming && !isLearner ? (
            <span className="ml-0.5 inline-block h-3 w-1 animate-pulse bg-orange-400 align-middle" />
          ) : null}
        </p>
        {showGloss && turn.gloss ? (
          <p
            className={`mt-1 text-xs ${
              isLearner ? "text-slate-400" : "text-slate-500"
            }`}
          >
            {turn.gloss}
          </p>
        ) : null}
      </div>
    </div>
  );
}

function emotionLabel(e: Emotion) {
  return e;
}
