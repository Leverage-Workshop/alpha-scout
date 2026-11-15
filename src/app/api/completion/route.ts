import { createUIMessageStreamResponse, streamText, toUIMessageStream } from "ai";
import { getModelId } from "@/lib/ai/gateway";
import { parsePrompt } from "@/lib/ai/prompt";

export const maxDuration = 60;

const MAX_OUTPUT_TOKENS = 4096;

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

  const parsed = parsePrompt(body);
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
    prompt: parsed.prompt,
    maxOutputTokens: MAX_OUTPUT_TOKENS,
    abortSignal: req.signal,
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      onError: (error) => {
        // Log the cause server-side (e.g. an unknown model ID); keep the client message generic.
        console.error(
          "Completion stream failed:",
          error instanceof Error ? `${error.name}: ${error.message}` : error,
        );
        return "The model request failed. Please try again.";
      },
    }),
  });
}
