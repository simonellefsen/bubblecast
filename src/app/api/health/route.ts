import { NextResponse } from "next/server";
import { hasApiKey, MODEL_ID } from "@/lib/ai/client";

export async function GET() {
  const hasSupabase = Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );

  return NextResponse.json({
    ok: true,
    hasXaiKey: hasApiKey(),
    hasSupabase,
    model: MODEL_ID,
    world: "harborline",
    missions: 7,
  });
}
