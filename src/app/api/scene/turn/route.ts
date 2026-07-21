import { NextResponse } from "next/server";
import type { SceneSession } from "@/content/types";
import { beginLive, learnerTurn } from "@/lib/ai/scene-service";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      session?: SceneSession;
      text?: string;
      action?: "begin_live" | "speak";
    };

    if (!body.session?.id) {
      return NextResponse.json(
        { error: "session required (serverless-safe scene state)" },
        { status: 400 },
      );
    }

    if (body.action === "begin_live") {
      const session = beginLive(body.session);
      return NextResponse.json({ session });
    }

    if (!body.text?.trim()) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }

    const session = await learnerTurn(body.session, body.text.trim());
    return NextResponse.json({ session });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Turn failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
