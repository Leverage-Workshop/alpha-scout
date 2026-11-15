import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createUIMessageStreamResponse } from "ai";
import { afterEach, expect, test, vi } from "vitest";
import { PromptBox } from "./prompt-box";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function streamOf(text: string) {
  return createUIMessageStreamResponse({
    stream: new ReadableStream({
      start(controller) {
        controller.enqueue({ type: "text-start", id: "t1" });
        controller.enqueue({ type: "text-delta", id: "t1", delta: text });
        controller.enqueue({ type: "text-end", id: "t1" });
        controller.close();
      },
    }),
  });
}

function submit(prompt: string) {
  fireEvent.change(screen.getByRole("textbox", { name: "Prompt" }), {
    target: { value: prompt },
  });
  fireEvent.click(screen.getByRole("button", { name: "Submit" }));
}

test("sends the prompt and renders the streamed response as markdown", async () => {
  const fetchMock = vi.fn().mockResolvedValue(streamOf("# Result\n\nSome **bold** text"));
  vi.stubGlobal("fetch", fetchMock);
  render(<PromptBox />);

  submit("What is NQ?");

  const heading = await screen.findByRole("heading", { name: "Result" });
  expect(heading).toBeDefined();
  expect(screen.getByText("bold").tagName).toMatch(/^(STRONG|SPAN)$/);
  const [url, init] = fetchMock.mock.calls[0] ?? [];
  expect(url).toBe("/api/completion");
  expect(JSON.parse(init.body)).toMatchObject({ prompt: "What is NQ?" });
});

test("shows the server's error message", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue(
      Response.json({ ok: false, error: "No model is configured" }, { status: 503 }),
    ),
  );
  render(<PromptBox />);

  submit("hello");

  await waitFor(() =>
    expect(screen.getByRole("alert").textContent).toBe("No model is configured"),
  );
});
