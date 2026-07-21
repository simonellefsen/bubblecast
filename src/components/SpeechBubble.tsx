"use client";

import type { Emotion, SceneTurn } from "@/content/types";
import { getCharacter } from "@/content/harborline/world";

export function SpeechBubble({
  turn,
  showGloss,
}: {
  turn: SceneTurn;
  showGloss: boolean;
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
        }`}
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
        </div>
        <p className="text-[15px] leading-relaxed">{turn.text}</p>
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
