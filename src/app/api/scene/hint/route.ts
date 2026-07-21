import { NextResponse } from "next/server";
import type { SceneSession } from "@/content/types";
import { getHint } from "@/lib/ai/scene-service";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      session?: SceneSession;
      level?: "soft" | "phrase" | "full";
    };
    if (!body.session?.id) {
      return NextResponse.json(
        { error: "session required (serverless-safe scene state)" },
        { status: 400 },
      );
    }
    const hint = getHint(body.session, body.level ?? "soft");
    return NextResponse.json({ hint });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Hint failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
