import { generateImage } from "ai";
import { xai } from "@ai-sdk/xai";
import { getLocation, getMission, getCharacters } from "@/content/harborline/world";
import { AI_TIMEOUT_MS, hasApiKey, timeoutSignal } from "./client";

export type ComicAtmosphere = {
  mediaType: string;
  /** Base64 without data: prefix */
  base64: string;
};

/**
 * Optional Imagine illustration for comic warmups.
 * Disabled when XAI_COMIC_ATMOSPHERE=0 or no API key.
 * Never throws — returns null on any failure.
 */
export async function generateComicAtmosphere(
  missionId: string,
): Promise<ComicAtmosphere | null> {
  if (!hasApiKey()) return null;
  if (process.env.XAI_COMIC_ATMOSPHERE === "0") return null;

  try {
    const mission = getMission(missionId);
    const location = getLocation(mission.locationId);
    const cast = getCharacters(mission.castIds)
      .map((c) => c.name)
      .join(", ");

    const prompt = [
      "Stylized cartoon illustration, clean comic book background art, no text, no speech bubbles, no watermarks.",
      `Setting: ${location.name} — ${location.vibe}.`,
      `Scene vibe for adults learning Spanish: ${mission.title}. ${mission.blurb}`,
      cast ? `Suggest presence of characters: ${cast} (do not label names).` : "",
      "Warm coastal European city palette, soft lighting, inviting, high quality 2D illustration.",
    ]
      .filter(Boolean)
      .join(" ");

    const { signal, clear } = timeoutSignal(
      Math.min(AI_TIMEOUT_MS, 25_000),
    );
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

export function atmosphereToDataUrl(atm: ComicAtmosphere): string {
  return `data:${atm.mediaType};base64,${atm.base64}`;
}
