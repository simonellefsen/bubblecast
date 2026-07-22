import { NextResponse } from "next/server";
import type { SceneSession } from "@/content/types";
import {
  beginLive,
  learnerTurn,
  streamLearnerTurn,
} from "@/lib/ai/scene-service";
import { assertSessionPayload } from "@/lib/session/validate";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      session?: SceneSession;
      text?: string;
      action?: "begin_live" | "speak";
      stream?: boolean;
    };

    const checked = assertSessionPayload(body.session);
    if (!checked.ok) {
      return NextResponse.json({ error: checked.error }, { status: 400 });
    }

    if (body.action === "begin_live") {
      const session = beginLive(checked.session);
      return NextResponse.json({ session });
    }

    if (!body.text?.trim()) {
      return NextResponse.json({ error: "text required" }, { status: 400 });
    }

    if (body.text.length > 800) {
      return NextResponse.json(
        { error: "Reply is too long — keep it under a few sentences." },
        { status: 400 },
      );
    }

    if (body.stream) {
      const stream = streamLearnerTurn(checked.session, body.text.trim());
      return new Response(stream, {
        headers: {
          "Content-Type": "application/x-ndjson; charset=utf-8",
          "Cache-Control": "no-cache, no-transform",
          Connection: "keep-alive",
        },
      });
    }

    const session = await learnerTurn(checked.session, body.text.trim());
    return NextResponse.json({ session });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Turn failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
