import { NextResponse } from "next/server";
import type { LearnerProfile, SceneLearnerContext } from "@/content/types";
import { startScene } from "@/lib/ai/scene-service";

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      missionId?: string;
      learner?: Pick<LearnerProfile, "cefr" | "displayName">;
      includeComic?: boolean;
      includeAtmosphere?: boolean;
      learnerContext?: SceneLearnerContext;
    };
    if (!body.missionId) {
      return NextResponse.json({ error: "missionId required" }, { status: 400 });
    }
    const { session, atmosphere } = await startScene({
      missionId: body.missionId,
      learner: body.learner ?? { cefr: "A1", displayName: "Traveler" },
      includeComic: body.includeComic,
      includeAtmosphere: body.includeAtmosphere,
      learnerContext: body.learnerContext,
    });
    // Atmosphere kept out of session so turn/end payloads stay small
    return NextResponse.json({
      session,
      atmosphere: atmosphere
        ? {
            mediaType: atmosphere.mediaType,
            dataUrl: `data:${atmosphere.mediaType};base64,${atmosphere.base64}`,
          }
        : null,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start scene";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
