import { NextResponse } from "next/server";
import { hasApiKey, MODEL_ID } from "@/lib/ai/client";

export async function GET() {
  return NextResponse.json({
    ok: true,
    hasXaiKey: hasApiKey(),
    model: MODEL_ID,
    world: "harborline",
  });
}
