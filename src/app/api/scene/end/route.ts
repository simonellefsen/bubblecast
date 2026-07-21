import { NextResponse } from "next/server";
import { endScene } from "@/lib/ai/scene-service";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { sessionId?: string };
    if (!body.sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }
    const result = await endScene(body.sessionId);
    return NextResponse.json(result);
  } catch (err) {
    const message = err instanceof Error ? err.message : "End scene failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
