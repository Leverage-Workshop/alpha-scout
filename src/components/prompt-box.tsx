"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useState, type KeyboardEvent } from "react";
import { Streamdown } from "streamdown";
import { MAX_MESSAGE_LENGTH } from "@/lib/ai/chat-request";
import type { ChatMessage } from "@/lib/ai/tools";
import { TeamReportCall } from "./team-report-call";

const transport = new DefaultChatTransport<ChatMessage>({ api: "/api/chat" });

/** Error bodies from /api/chat are `{ ok: false, error }` JSON; fall back to the raw message. */
function describeError(error: Error): string {
  try {
    const parsed: unknown = JSON.parse(error.message);
    if (typeof parsed === "object" && parsed !== null && "error" in parsed) {
      return String(parsed.error);
    }
  } catch {
    // Not JSON: use the message as-is.
  }
  return error.message || "Something went wrong.";
}

function MessageView({ message, streaming }: { message: ChatMessage; streaming: boolean }) {
  if (message.role === "user") {
    const text = message.parts.map((p) => (p.type === "text" ? p.text : "")).join("");
    return (
      <div className="self-end rounded-md bg-current/5 px-3 py-2 whitespace-pre-wrap">{text}</div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {message.parts.map((part, i) => {
        if (part.type === "text") {
          return (
            <Streamdown key={i} caret="block" isAnimating={streaming && i === message.parts.length - 1}>
              {part.text}
            </Streamdown>
          );
        }
        if (part.type === "tool-getTeamReport") {
          return <TeamReportCall key={part.toolCallId} part={part} />;
        }
        return null;
      })}
    </div>
  );
}

export function PromptBox() {
  const { messages, sendMessage, status, error, stop, setMessages } = useChat<ChatMessage>({
    transport,
  });
  const [input, setInput] = useState("");

  const busy = status === "submitted" || status === "streaming";
  const canSubmit = !busy && input.trim().length > 0;

  function submit() {
    if (!canSubmit) return;
    void sendMessage({ text: input.trim() });
    setInput("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      {messages.length > 0 && (
        <section aria-label="Conversation" aria-live="polite" className="flex flex-col gap-4">
          {messages.map((m, i) => (
            <MessageView
              key={m.id}
              message={m}
              streaming={status === "streaming" && i === messages.length - 1}
            />
          ))}
        </section>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {describeError(error)}
        </p>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        className="flex flex-col gap-2"
      >
        <label htmlFor="prompt" className="sr-only">
          Prompt
        </label>
        <textarea
          id="prompt"
          name="prompt"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          maxLength={MAX_MESSAGE_LENGTH}
          rows={3}
          placeholder="Ask something, e.g. “How are the Eagles doing?” (Enter to send)"
          className="w-full resize-y rounded-md border border-current/20 bg-transparent p-3 text-base outline-none focus:border-current/50"
        />
        <div className="flex justify-end gap-2">
          {messages.length > 0 && !busy && (
            <button
              type="button"
              onClick={() => setMessages([])}
              className="rounded-md border border-current/20 px-4 py-2 text-sm"
            >
              New chat
            </button>
          )}
          {busy && (
            <button
              type="button"
              onClick={() => void stop()}
              className="rounded-md border border-current/20 px-4 py-2 text-sm"
            >
              Stop
            </button>
          )}
          <button
            type="submit"
            disabled={!canSubmit}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-40"
          >
            {busy ? "Thinking…" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
