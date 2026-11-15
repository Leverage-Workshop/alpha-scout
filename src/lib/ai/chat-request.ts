import { safeValidateUIMessages, type UIMessage } from "ai";

/** Per-message text cap, to keep requests and token costs bounded. */
export const MAX_MESSAGE_LENGTH = 4000;
/** Conversation length cap; the whole history is re-sent with every turn. */
export const MAX_MESSAGES = 20;

type ToolsFor<M extends UIMessage> = Parameters<typeof safeValidateUIMessages<M>>[0]["tools"];

export type ParsedChatRequest<M extends UIMessage> =
  | { ok: true; messages: M[] }
  | { ok: false; error: string };

/** Validates a `useChat` request body (`{ messages }`) against the known tools. */
export async function parseChatRequest<M extends UIMessage>(
  body: unknown,
  tools: ToolsFor<M>,
): Promise<ParsedChatRequest<M>> {
  if (typeof body !== "object" || body === null || !("messages" in body)) {
    return { ok: false, error: "Missing messages" };
  }

  const result = await safeValidateUIMessages<M>({ messages: body.messages, tools });
  if (!result.success) {
    return { ok: false, error: "Invalid messages" };
  }

  const messages = result.data;
  if (messages.length > MAX_MESSAGES) {
    return { ok: false, error: `Conversation exceeds ${MAX_MESSAGES} messages. Start a new chat.` };
  }

  const last = messages.at(-1);
  if (last?.role !== "user") {
    return { ok: false, error: "Last message must be from the user" };
  }

  const tooLong = messages.some((m) =>
    m.parts.some((p) => p.type === "text" && p.text.length > MAX_MESSAGE_LENGTH),
  );
  if (tooLong) {
    return { ok: false, error: `Message exceeds ${MAX_MESSAGE_LENGTH} characters` };
  }

  return { ok: true, messages };
}
