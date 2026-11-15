import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const streamTextMock = vi.hoisted(() => vi.fn());

vi.mock("ai", async (importOriginal) => {
  const actual = await importOriginal<typeof import("ai")>();
  return { ...actual, streamText: streamTextMock };
});

const { POST } = await import("./route");

function post(body: unknown) {
  return POST(
    new Request("http://localhost/api/completion", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: typeof body === "string" ? body : JSON.stringify(body),
    }),
  );
}

describe("POST /api/completion", () => {
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
    expect(await res.json()).toEqual({ ok: false, error: "Invalid JSON body" });
    expect(streamTextMock).not.toHaveBeenCalled();
  });

  test("rejects an empty prompt", async () => {
    const res = await post({ prompt: "  " });
    expect(res.status).toBe(400);
    expect(streamTextMock).not.toHaveBeenCalled();
  });

  test("returns 503 when no model is configured", async () => {
    vi.stubEnv("AI_MODEL_ID", "");
    const res = await post({ prompt: "hello" });
    expect(res.status).toBe(503);
    expect(streamTextMock).not.toHaveBeenCalled();
  });

  test("streams the model's text for a valid prompt", async () => {
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

    const res = await post({ prompt: " hi " });

    expect(res.status).toBe(200);
    expect(streamTextMock).toHaveBeenCalledWith(
      expect.objectContaining({ model: "test-provider/test-model", prompt: "hi" }),
    );
    expect(await res.text()).toContain("**Hello**");
  });
});
