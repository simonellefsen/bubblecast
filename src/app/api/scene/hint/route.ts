import { NextResponse } from "next/server";
import type { SceneSession } from "@/content/types";
import { getHint } from "@/lib/ai/scene-service";
import { assertSessionPayload } from "@/lib/session/validate";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      session?: SceneSession;
      level?: "soft" | "phrase" | "full";
    };
    const checked = assertSessionPayload(body.session);
    if (!checked.ok) {
      return NextResponse.json({ error: checked.error }, { status: 400 });
    }
    const hint = getHint(checked.session, body.level ?? "soft");
    return NextResponse.json({ hint });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Hint failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
