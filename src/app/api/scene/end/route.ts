import { NextResponse } from "next/server";
import type { SceneSession } from "@/content/types";
import { endScene } from "@/lib/ai/scene-service";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { session?: SceneSession };
    if (!body.session?.id) {
      return NextResponse.json(
        { error: "session required (serverless-safe scene state)" },
        { status: 400 },
      );
    }
    const result = await endScene(body.session);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "End scene failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
