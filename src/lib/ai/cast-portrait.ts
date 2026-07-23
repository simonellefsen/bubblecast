import { generateImage } from "ai";
import { xai } from "@ai-sdk/xai";
import { getCharacter } from "@/content/harborline/world";
import type { CharacterId } from "@/content/types";
import { AI_TIMEOUT_MS, hasApiKey, timeoutSignal } from "./client";

export type CastPortrait = {
  mediaType: string;
  base64: string;
};

/**
 * Optional Imagine portrait for a Harborline cast member.
 * Kill-switch: XAI_CAST_PORTRAITS=0. Never throws.
 */
export async function generateCastPortrait(
  characterId: CharacterId,
): Promise<CastPortrait | null> {
  if (!hasApiKey()) return null;
  if (process.env.XAI_CAST_PORTRAITS === "0") return null;

  try {
    const c = getCharacter(characterId);
    const prompt = [
      "Stylized cartoon character portrait bust, clean 2D comic book illustration, no text, no watermark, no speech bubble.",
      `Adult character for a language-learning sitcom: ${c.name}, ${c.role}.`,
      `Personality: ${c.traits.join(", ")}. Bio vibe: ${c.bio}`,
      `Accent color mood: ${c.accentColor}. Soft coastal European lighting.`,
      "Friendly face, simple shapes, high quality, centered head-and-shoulders on soft gradient background.",
    ].join(" ");

    const { signal, clear } = timeoutSignal(Math.min(AI_TIMEOUT_MS, 25_000));
    try {
      const result = await generateImage({
        model: xai.image("grok-imagine-image-quality"),
        prompt,
        abortSignal: signal,
      });
      const image = result.image;
      if (!image?.base64) return null;
      return {
        mediaType: image.mediaType || "image/png",
        base64: image.base64,
      };
    } finally {
      clear();
    }
  } catch {
    return null;
  }
}

export function portraitToDataUrl(p: CastPortrait): string {
  return `data:${p.mediaType};base64,${p.base64}`;
}
