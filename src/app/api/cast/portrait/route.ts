import { NextResponse } from "next/server";
import { harborline } from "@/content/harborline/world";
import type { CharacterId } from "@/content/types";
import {
  generateCastPortrait,
  portraitToDataUrl,
} from "@/lib/ai/cast-portrait";

const IDS = new Set(harborline.characters.map((c) => c.id));

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { characterId?: string };
    const characterId = body.characterId as CharacterId | undefined;
    if (!characterId || !IDS.has(characterId)) {
      return NextResponse.json(
        { error: "Valid characterId required" },
        { status: 400 },
      );
    }

    const portrait = await generateCastPortrait(characterId);
    if (!portrait) {
      return NextResponse.json({
        portrait: null,
        reason:
          process.env.XAI_CAST_PORTRAITS === "0"
            ? "disabled"
            : "unavailable",
      });
    }

    return NextResponse.json({
      portrait: {
        characterId,
        dataUrl: portraitToDataUrl(portrait),
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Portrait generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
