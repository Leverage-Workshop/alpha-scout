import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createUIMessageStreamResponse, type UIMessageChunk } from "ai";
import { afterEach, expect, test, vi } from "vitest";
import { PromptBox } from "./prompt-box";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

function streamOf(chunks: UIMessageChunk[]) {
  return createUIMessageStreamResponse({
    stream: new ReadableStream({
      start(controller) {
        chunks.forEach((c) => controller.enqueue(c));
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

test("sends the message and renders the tool call and markdown reply", async () => {
  const fetchMock = vi.fn().mockResolvedValue(
    streamOf([
      { type: "start" },
      {
        type: "tool-input-available",
        toolCallId: "c1",
        toolName: "getTeamReport",
        input: { team: "Eagles" },
      },
      {
        type: "tool-output-available",
        toolCallId: "c1",
        output: {
          status: "found",
          team: { name: "Philadelphia Eagles", abbreviation: "PHI" },
          record: { overall: "2-7", home: "1-4", road: "1-3" },
          standing: "4th in NFC East",
          nextGame: null,
          news: [],
          source: "ESPN",
        },
      },
      { type: "text-start", id: "t1" },
      { type: "text-delta", id: "t1", delta: "# Eagles\n\nThey are **2-7**." },
      { type: "text-end", id: "t1" },
      { type: "finish" },
    ]),
  );
  vi.stubGlobal("fetch", fetchMock);
  render(<PromptBox />);

  submit("How are the Eagles doing?");

  expect(await screen.findByRole("heading", { name: "Eagles" })).toBeDefined();
  expect(screen.getByText("Looked up Philadelphia Eagles (2-7)")).toBeDefined();
  expect(screen.getByText("How are the Eagles doing?")).toBeDefined();
  const [url, init] = fetchMock.mock.calls[0] ?? [];
  expect(url).toBe("/api/chat");
  expect(JSON.parse(init.body).messages.at(-1).parts).toEqual([
    { type: "text", text: "How are the Eagles doing?" },
  ]);
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
