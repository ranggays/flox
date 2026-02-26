import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { convertToModelMessages, streamText, UIMessage } from "ai";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY ?? "",
});

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, system }: { messages: UIMessage[]; system: string } =
    await req.json();

  const result = streamText({
    model: google("gemini-2.5-flash"),
    system,
    messages: await convertToModelMessages(messages),
    // maxTokens: 512,
  });

  return result.toUIMessageStreamResponse();
}