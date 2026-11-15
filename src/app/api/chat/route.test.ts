import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const streamTextMock = vi.hoisted(() => vi.fn());

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return { ...actual, streamText: streamTextMock };
});

const { POST } = await import("./route");

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/chat", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

const ask = (text: string) => ({
  messages: [{ id: "u1", role: "user", parts: [{ type: "text", text }] }],
});

describe("POST /api/chat", () => {
  beforeEach(() => {
    vi.stubEnv("AI_MODEL_ID", "test-provider/test-model");
    streamTextMock.mockReset();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  test("rejects invalid JSON", async () => {
    const res = await post("not json");
    expect(res.status).toBe(400);
    expect(streamTextMock).not.toHaveBeenCalled();
  });

  test("rejects an invalid conversation", async () => {
    const res = await post({ messages: [] });
    expect(res.status).toBe(400);
    expect(streamTextMock).not.toHaveBeenCalled();
  });

  test("returns 503 when no model is configured", async () => {
    vi.stubEnv("AI_MODEL_ID", "");
    const res = await post(ask("hello"));
    expect(res.status).toBe(503);
    expect(streamTextMock).not.toHaveBeenCalled();
  });

  test("streams the reply and offers the team report tool", async () => {
    streamTextMock.mockReturnValue({
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue({ type: "text-start", id: "t1" });
          controller.enqueue({ type: "text-delta", id: "t1", text: "**Hello**" });
          controller.enqueue({ type: "text-end", id: "t1" });
          controller.close();
        },
      }),
    });

    const res = await post(ask("How are the Eagles doing?"));

    expect(res.status).toBe(200);
    const options = streamTextMock.mock.calls[0]?.[0];
    expect(options.model).toBe("test-provider/test-model");
    expect(Object.keys(options.tools)).toEqual(["getTeamReport"]);
    expect(options.messages).toEqual([
      { role: "user", content: [{ type: "text", text: "How are the Eagles doing?" }] },
    ]);
    expect(await res.text()).toContain("**Hello**");
  });
});
