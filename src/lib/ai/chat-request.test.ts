import { describe, expect, test } from "vitest";
import { MAX_MESSAGE_LENGTH, MAX_MESSAGES, parseChatRequest } from "./chat-request";

const userMessage = (text: string, id = "u1") => ({
  id,
  role: "user",
  parts: [{ type: "text", text }],
});

describe("parseChatRequest", () => {
  test("accepts a valid conversation", async () => {
    const result = await parseChatRequest({ messages: [userMessage("hi")] }, {});
    expect(result.ok).toBe(true);
  });

  test.each([
    [null, "Missing messages"],
    [{}, "Missing messages"],
    [{ messages: "hi" }, "Invalid messages"],
    [{ messages: [] }, "Invalid messages"],
    [{ messages: [{ id: "x", role: "hacker", parts: [] }] }, "Invalid messages"],
  ])("rejects %j", async (body, error) => {
    expect(await parseChatRequest(body, {})).toEqual({ ok: false, error });
  });

  test("rejects a conversation ending with an assistant message", async () => {
    const messages = [
      userMessage("hi"),
      { id: "a1", role: "assistant", parts: [{ type: "text", text: "hello" }] },
    ];
    const result = await parseChatRequest({ messages }, {});
    expect(result).toEqual({ ok: false, error: "Last message must be from the user" });
  });

  test("rejects overly long messages", async () => {
    const result = await parseChatRequest(
      { messages: [userMessage("a".repeat(MAX_MESSAGE_LENGTH + 1))] },
      {},
    );
    expect(result.ok).toBe(false);
  });

  test("rejects overly long conversations", async () => {
    const messages = Array.from({ length: MAX_MESSAGES + 1 }, (_, i) => userMessage("hi", `u${i}`));
    const result = await parseChatRequest({ messages }, {});
    expect(result.ok).toBe(false);
  });
});
