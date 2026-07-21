import type { Character, Emotion } from "@/content/types";

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
}: {
  character: Character;
  emotion?: Emotion;
  size?: "sm" | "md" | "lg";
  speaking?: boolean;
}) {
  const dim =
    size === "sm" ? "h-12 w-12 text-lg" : size === "lg" ? "h-24 w-24 text-4xl" : "h-16 w-16 text-2xl";

  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`${dim} relative flex items-center justify-center rounded-full border-4 border-white shadow-md transition ${
          speaking ? "animate-pulse scale-105" : ""
        }`}
        style={{ backgroundColor: character.accentColor }}
        title={character.name}
      >
        <span className="drop-shadow-sm">{character.emoji}</span>
        <span className="absolute -bottom-1 rounded-full bg-white/90 px-1 text-[10px] text-slate-600 shadow">
          {emotionFace[emotion]}
        </span>
      </div>
      <span className="text-xs font-medium text-slate-700">{character.name}</span>
    </div>
  );
}
