import { xai } from "@ai-sdk/xai";

export const MODEL_ID = process.env.XAI_MODEL ?? "grok-4.5";

/** Default per-call AI budget (ms). Override with XAI_TIMEOUT_MS. */
export const AI_TIMEOUT_MS = Number(process.env.XAI_TIMEOUT_MS ?? 28_000);

/** Hard cap on dialogue turns per mission (cost guard). */
export const MAX_MISSION_TURNS = 12;

/** Reject oversized serverless session payloads (~KB). */
export const MAX_SESSION_JSON_CHARS = 180_000;

export function getModel() {
  if (!process.env.XAI_API_KEY) {
    throw new Error(
      "Missing XAI_API_KEY. Add it to .env.local (server-only).",
    );
  }
  return xai.responses(MODEL_ID);
}

export function hasApiKey() {
  return Boolean(process.env.XAI_API_KEY);
}

/** AbortSignal that fires after `ms` (cleaned up when the race settles). */
export function timeoutSignal(ms: number = AI_TIMEOUT_MS): {
  signal: AbortSignal;
  clear: () => void;
} {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(id),
  };
}
