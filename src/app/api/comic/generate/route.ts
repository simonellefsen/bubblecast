import { NextResponse } from "next/server";
import { generateComic } from "@/lib/ai/scene-service";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { missionId?: string };
    if (!body.missionId) {
      return NextResponse.json({ error: "missionId required" }, { status: 400 });
    }
    const comic = await generateComic(body.missionId);
    return NextResponse.json({ comic });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Comic generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
