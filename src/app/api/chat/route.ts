import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  isStepCount,
  streamText,
  toUIMessageStream,
} from "ai";
import { parseChatRequest } from "@/lib/ai/chat-request";
import { getModelId } from "@/lib/ai/gateway";
import { tools, type ChatMessage } from "@/lib/ai/tools";

export const maxDuration = 60;

const MAX_OUTPUT_TOKENS = 4096;
const MAX_STEPS = 4;

const INSTRUCTIONS = `You are a helpful assistant. Reply in Markdown.
When the user asks how an NFL team is doing, call getTeamReport with the team name.
Take records, standings and schedules only from tool results; never guess them.
When you mention a news item, link to its URL. If a lookup is ambiguous or finds nothing,
say so and ask the user which team they mean.`;

function errorResponse(error: string, status: number) {
  return Response.json({ ok: false, error }, { status });
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return errorResponse("Invalid JSON body", 400);
  }

  const parsed = await parseChatRequest<ChatMessage>(body, tools);
  if (!parsed.ok) {
    return errorResponse(parsed.error, 400);
  }

  let model: string;
  try {
    model = getModelId();
  } catch {
    return errorResponse("No model is configured", 503);
  }

  const result = streamText({
    model,
    instructions: INSTRUCTIONS,
    messages: await convertToModelMessages(parsed.messages, { tools }),
    tools,
    stopWhen: isStepCount(MAX_STEPS),
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    abortSignal: req.signal,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      tools,
      onError: (error) => {
        // Log the cause server-side (e.g. an unknown model ID); keep the client message generic.
        console.error(
          "Chat stream failed:",
          error instanceof Error ? `${error.name}: ${error.message}` : error,
        );
        return "The model request failed. Please try again.";
      },
    }),
  });
}
