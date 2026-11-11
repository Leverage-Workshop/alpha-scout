import "server-only";
import { gateway } from "ai";

/**
 * Authenticated round trip to Vercel AI Gateway that doesn't need a model.
 * Uses OIDC on Vercel deployments, or AI_GATEWAY_API_KEY when set.
 */
export async function checkGateway(): Promise<{ ok: true } | { ok: false; error: string }> {
  try {
    await gateway.getCredits();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.name : "UnknownError" };
  }
}

/** The configured Gateway model ID. No default is chosen yet (see docs/PRODUCT.md §4). */
export function getModelId(): string {
  const id = process.env.AI_MODEL_ID;
  if (!id) {
    throw new Error("AI_MODEL_ID is not set");
  }
  return id;
}
