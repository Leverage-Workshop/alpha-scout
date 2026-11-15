import { describe, expect, test } from "vitest";
import { MAX_PROMPT_LENGTH, parsePrompt } from "./prompt";

describe("parsePrompt", () => {
  test("accepts and trims a prompt", () => {
    expect(parsePrompt({ prompt: "  hello  " })).toEqual({ ok: true, prompt: "hello" });
  });

  test.each([
    [null, "Missing prompt"],
    ["hello", "Missing prompt"],
    [{}, "Missing prompt"],
    [{ prompt: 42 }, "Prompt must be a string"],
    [{ prompt: "   " }, "Prompt is empty"],
  ])("rejects %j", (body, error) => {
    expect(parsePrompt(body)).toEqual({ ok: false, error });
  });

  test("rejects prompts over the length limit", () => {
    const result = parsePrompt({ prompt: "a".repeat(MAX_PROMPT_LENGTH + 1) });
    expect(result.ok).toBe(false);
  });

  test("accepts a prompt at the length limit", () => {
    expect(parsePrompt({ prompt: "a".repeat(MAX_PROMPT_LENGTH) }).ok).toBe(true);
  });
});
