import { createGoogleGenerativeAI } from "@ai-sdk/google";
import {
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  type TypedToolResult,
  UIMessage,
} from "ai";
import {
  extractAssistantStructuredResult,
  finalizeAssistantText,
  serializeAssistantStructuredResult,
  stripAssistantStructuredResult,
  type AssistantChatContext,
} from "@/lib/assistant-shared";
import {
  assistantStopWhen,
  buildToolDrivenSystemPrompt,
  createAssistantTools,
  getStructuredResultFromToolOutputs,
} from "@/lib/assistant-server";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
});

export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    context = {},
  }: {
    messages: UIMessage[];
    context?: AssistantChatContext;
  } = await req.json();

  const tools = createAssistantTools(context);
  const collectedToolResults: Array<TypedToolResult<typeof tools>> = [];

  const result = await generateText({
    model: google("gemini-2.5-flash"),
    system: buildToolDrivenSystemPrompt(context),
    messages: await convertToModelMessages(messages),
    tools,
    stopWhen: assistantStopWhen,
    maxOutputTokens: 1000,
    onStepFinish: ({ toolResults }) => {
      collectedToolResults.push(...toolResults);
    },
  });

  const toolStructuredResult = getStructuredResultFromToolOutputs(
    collectedToolResults
  );
  const modelStructuredResult = extractAssistantStructuredResult(result.text);

  const finalText = finalizeAssistantText(
    !modelStructuredResult && toolStructuredResult
      ? `${stripAssistantStructuredResult(result.text)}\n\n${serializeAssistantStructuredResult(toolStructuredResult)}`
      : result.text
  );

  const stream = createUIMessageStream({
    originalMessages: messages,
    execute: ({ writer }) => {
      writer.write({ type: "start" });
      writer.write({ type: "start-step" });
      writer.write({ type: "text-start", id: "text-1" });
      writer.write({ type: "text-delta", id: "text-1", delta: finalText });
      writer.write({ type: "text-end", id: "text-1" });
      writer.write({ type: "finish-step" });
      writer.write({ type: "finish" });
    },
  });

  return createUIMessageStreamResponse({ stream });
}
