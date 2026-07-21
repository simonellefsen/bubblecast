import { NextResponse } from "next/server";
import { getHint } from "@/lib/ai/scene-service";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      sessionId?: string;
      level?: "soft" | "phrase" | "full";
    };
    if (!body.sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }
    const hint = await getHint(body.sessionId, body.level ?? "soft");
    return NextResponse.json({ hint });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Hint failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
