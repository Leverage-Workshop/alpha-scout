/** Upper bound on prompt size, to keep requests and token costs bounded. */
export const MAX_PROMPT_LENGTH = 4000;

export type ParsedPrompt = { ok: true; prompt: string } | { ok: false; error: string };

/** Validates a `{ prompt }` request body, as sent by `useCompletion`. */
export function parsePrompt(body: unknown): ParsedPrompt {
  if (typeof body !== "object" || body === null || !("prompt" in body)) {
    return { ok: false, error: "Missing prompt" };
  }
  const { prompt } = body;
  if (typeof prompt !== "string") {
    return { ok: false, error: "Prompt must be a string" };
  }
  const trimmed = prompt.trim();
  if (trimmed.length === 0) {
    return { ok: false, error: "Prompt is empty" };
  }
  if (trimmed.length > MAX_PROMPT_LENGTH) {
    return { ok: false, error: `Prompt exceeds ${MAX_PROMPT_LENGTH} characters` };
  }
  return { ok: true, prompt: trimmed };
}
