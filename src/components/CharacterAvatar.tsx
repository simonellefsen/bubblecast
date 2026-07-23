"use client";

import { useEffect, useState } from "react";
import type { Character, Emotion } from "@/content/types";
import { getCachedPortrait } from "@/lib/portrait-cache";

const emotionFace: Record<Emotion, string> = {
  neutral: "·ᴗ·",
  happy: "◠‿◠",
  curious: "◉_◉",
  impatient: "¬_¬",
  warm: "◕‿◕",
  concerned: "⊙﹏⊙",
  amused: "✧‿✧",
  proud: "◠‿◠",
};

export function CharacterAvatar({
  character,
  emotion = "neutral",
  size = "md",
  speaking = false,
  portraitUrl,
}: {
  character: Character;
  emotion?: Emotion;
  size?: "sm" | "md" | "lg";
  speaking?: boolean;
  /** Explicit portrait; otherwise uses client cache if present. */
  portraitUrl?: string | null;
}) {
  const [cached, setCached] = useState<string | null>(null);

  useEffect(() => {
    if (portraitUrl) {
      setCached(null);
      return;
    }
    setCached(getCachedPortrait(character.id));
  }, [character.id, portraitUrl]);

  const src = portraitUrl || cached;
  const dim =
    size === "sm"
      ? "h-12 w-12 text-lg"
      : size === "lg"
        ? "h-24 w-24 text-4xl"
        : "h-16 w-16 text-2xl";

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${dim} relative flex items-center justify-center overflow-hidden rounded-full border-4 border-white shadow-md transition ${
          speaking ? "animate-pulse scale-105" : ""
        }`}
        style={{
          backgroundColor: src ? "#0f172a" : character.accentColor,
        }}
        title={character.name}
      >
        {src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            className="h-full w-full object-cover"
            aria-hidden
          />
        ) : (
          <span className="drop-shadow-sm">{character.emoji}</span>
        )}
        <span className="absolute -bottom-1 rounded-full bg-white/90 px-1 text-[10px] text-slate-600 shadow">
          {emotionFace[emotion]}
        </span>
      </div>
      <span className="text-xs font-medium text-slate-700">{character.name}</span>
    </div>
  );
}
