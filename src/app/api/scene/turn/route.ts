import { NextResponse } from "next/server";
import { beginLive, learnerTurn } from "@/lib/ai/scene-service";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      sessionId?: string;
      text?: string;
      action?: "begin_live" | "speak";
    };
    if (!body.sessionId) {
      return NextResponse.json({ error: "sessionId required" }, { status: 400 });
    }

    if (body.action === "begin_live") {
      const session = beginLive(body.sessionId);
      return NextResponse.json({ session });
    }

    if (!body.text?.trim()) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }

    const session = await learnerTurn(body.sessionId, body.text.trim());
    return NextResponse.json({ session });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Turn failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
