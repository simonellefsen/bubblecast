import { xai } from "@ai-sdk/xai";

export const MODEL_ID = process.env.XAI_MODEL ?? "grok-4.5";

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
