import type { SceneSession } from "@/content/types";
import { MAX_SESSION_JSON_CHARS } from "@/lib/ai/client";

export function assertSessionPayload(session: SceneSession | undefined): {
  ok: true;
  session: SceneSession;
} | {
  ok: false;
  error: string;
} {
  if (!session?.id || !session.missionId) {
    return { ok: false, error: "session required (serverless-safe scene state)" };
  }
  try {
    const size = JSON.stringify(session).length;
    if (size > MAX_SESSION_JSON_CHARS) {
      return {
        ok: false,
        error: "Scene is too large to continue — please end the mission.",
      };
    }
  } catch {
    return { ok: false, error: "Invalid session payload" };
  }
  return { ok: true, session };
}
