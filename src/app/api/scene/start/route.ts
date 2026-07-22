import { NextResponse } from "next/server";
import type { LearnerProfile, SceneLearnerContext } from "@/content/types";
import { startScene } from "@/lib/ai/scene-service";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      missionId?: string;
      learner?: Pick<LearnerProfile, "cefr" | "displayName">;
      includeComic?: boolean;
      learnerContext?: SceneLearnerContext;
    };
    if (!body.missionId) {
      return NextResponse.json({ error: "missionId required" }, { status: 400 });
    }
    const session = await startScene({
      missionId: body.missionId,
      learner: body.learner ?? { cefr: "A1", displayName: "Traveler" },
      includeComic: body.includeComic,
      learnerContext: body.learnerContext,
    });
    return NextResponse.json({ session });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start scene";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
