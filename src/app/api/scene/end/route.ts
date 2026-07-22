import { NextResponse } from "next/server";
import type { SceneSession } from "@/content/types";
import { endScene } from "@/lib/ai/scene-service";
import { assertSessionPayload } from "@/lib/session/validate";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { session?: SceneSession };
    const checked = assertSessionPayload(body.session);
    if (!checked.ok) {
      return NextResponse.json({ error: checked.error }, { status: 400 });
    }
    const result = await endScene(checked.session);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "End scene failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
