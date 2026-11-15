"use client";

import { useCompletion } from "@ai-sdk/react";
import type { KeyboardEvent } from "react";
import { Streamdown } from "streamdown";
import { MAX_PROMPT_LENGTH } from "@/lib/ai/prompt";

/** Error bodies from /api/completion are `{ ok: false, error }` JSON; fall back to the raw message. */
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

export function PromptBox() {
  const { completion, input, handleInputChange, handleSubmit, isLoading, error, stop } =
    useCompletion({ api: "/api/completion" });

  const canSubmit = !isLoading && input.trim().length > 0;

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      if (canSubmit) handleSubmit();
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (canSubmit) handleSubmit();
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
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          maxLength={MAX_PROMPT_LENGTH}
          rows={4}
          placeholder="Ask something… (Enter to send, Shift+Enter for a new line)"
          className="w-full resize-y rounded-md border border-current/20 bg-transparent p-3 text-base outline-none focus:border-current/50"
        />
        <div className="flex justify-end gap-2">
          {isLoading && (
            <button
              type="button"
              onClick={stop}
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
            {isLoading ? "Thinking…" : "Submit"}
          </button>
        </div>
      </form>

      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {describeError(error)}
        </p>
      )}

      {completion && (
        <section aria-label="Response" aria-live="polite" className="rounded-md border border-current/10 p-4">
          <Streamdown caret="block" isAnimating={isLoading}>
            {completion}
          </Streamdown>
        </section>
      )}
    </div>
  );
}
