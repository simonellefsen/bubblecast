import { NextResponse } from "next/server";
import { hasApiKey, MODEL_ID } from "@/lib/ai/client";

export async function GET() {
  const hasSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
  const comicAtmosphereServer =
    hasApiKey() && process.env.XAI_COMIC_ATMOSPHERE !== "0";
  const castPortraitsServer =
    hasApiKey() && process.env.XAI_CAST_PORTRAITS !== "0";

  return NextResponse.json({
    ok: true,
    hasXaiKey: hasApiKey(),
    hasSupabase,
    comicAtmosphereServer,
    castPortraitsServer,
    model: MODEL_ID,
    world: "harborline",
    missions: 7,
  });
}
