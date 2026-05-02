"use client";

import type {
  AgentEvent,
  AgentOrganizerData,
  AgentUserTicket,
} from "@/context/AgentDataContext";
import {
  STRUCTURED_RESULT_TAG,
  extractAssistantActionLinks,
  extractAssistantActionLinksFromResult,
  extractAssistantStructuredResult,
  finalizeAssistantText,
  normalizeAssistantStructuredResult,
  serializeAssistantStructuredResult,
  stripAssistantStructuredResult,
} from "@/lib/assistant-shared";
export {
  STRUCTURED_RESULT_TAG,
  extractAssistantActionLinks,
  extractAssistantActionLinksFromResult,
  extractAssistantStructuredResult,
  finalizeAssistantText,
  normalizeAssistantStructuredResult,
  serializeAssistantStructuredResult,
  stripAssistantStructuredResult,
};
export type {
  AssistantActionLink,
  AssistantChatContext,
  AssistantRequestPreferences,
  AssistantStructuredResult,
} from "@/lib/assistant-shared";

export type AssistantPreferences = import("@/lib/assistant-shared").AssistantRequestPreferences;

export const ASSISTANT_CATEGORIES = [
  "Music",
  "Technology",
  "Sports",
  "Art",
  "Hackathon",
  "Workshop",
  "Conference",
];

export const ASSISTANT_SUGGESTIONS = [
  "What events are available?",
  "Find events near me",
  "Compare ticket tiers",
  "Show events under a budget",
  "Summarize this event",
];

export const ASSISTANT_WELCOME_MESSAGE = {
  id: "welcome",
  role: "assistant" as const,
  parts: [
    {
      type: "text" as const,
      text:
        "I can help you discover events, compare ticket tiers, and explain how Flox works using the event data already loaded in the app.",
    },
  ],
	};

interface BuildSystemPromptArgs {
  events: AgentEvent[];
  organizerData: AgentOrganizerData | null;
  userTickets: AgentUserTicket[];
  publicKey: string | null;
  prefs: AssistantPreferences;
  workflowContext?: string;
}

export function buildAssistantSystemPrompt({
  events,
  organizerData,
  userTickets,
  publicKey,
  prefs,
  workflowContext,
}: BuildSystemPromptArgs): string {
  const eventSummary =
    events.length > 0
      ? events
          .map((ev) => {
            const tierLines =
              ev.tiers.length > 0
                ? ev.tiers
                    .map(
                      (t) =>
                        `    - ${t.name}: ${t.priceSol} SOL | ${t.available}/${t.maxSupply} available`
                    )
                    .join("\n")
                : "    - No tiers configured";

            return [
              `[ID:${ev.id}] "${ev.name}"`,
              `  ${ev.category} | ${ev.type} | ${ev.status}`,
              `  Location : ${ev.location}`,
              `  Date     : ${new Date(ev.startTime * 1000).toLocaleDateString()} - ${new Date(ev.endTime * 1000).toLocaleDateString()}`,
              `  Sold     : ${ev.sold} tickets | Revenue: ${ev.revenue} SOL | Available: ${ev.available}`,
              `  URL      : /events/${ev.id}`,
              `  Tiers    :\n${tierLines}`,
            ].join("\n");
          })
          .join("\n\n")
      : "No events loaded yet.";

  const organizerSection = organizerData
    ? [
        "ORGANIZER STATS (current wallet):",
        `  Escrow locked    : ${organizerData.escrowLocked.toFixed(3)} SOL`,
        `  Escrow available : ${organizerData.escrowAvailable.toFixed(3)} SOL`,
        `  Total revenue    : ${organizerData.totalRevenue} SOL`,
        `  Total sold       : ${organizerData.totalSold} tickets`,
        `  Active events    : ${organizerData.eventCount}`,
      ].join("\n")
    : "";

  const ticketSection =
    userTickets.length > 0
      ? [
          `USER TICKETS (${userTickets.length} total):`,
          ...userTickets.map(
            (t) =>
              `  - "${t.title}" | ${t.date} | Status: ${t.status} | Category: ${t.category}`
          ),
        ].join("\n")
      : "";

  const walletInfo = publicKey
    ? `Wallet: ${publicKey.slice(0, 8)}... (connected)`
    : "Wallet: not connected";

  const prefContext =
    prefs.categories.length > 0
      ? `User prefers: ${prefs.categories.join(", ")} | Format: ${prefs.eventType}`
      : "";

  return `You are a helpful assistant for Flox, an AI-guided event discovery and Solana ticketing product.

PLATFORM:
- Network: Solana Devnet
- Tickets are on-chain PDAs (not NFTs)
- Organizers stake 0.05 SOL (refundable) to create events
- Revenue held in escrow, released to organizer after event ends
- Validators scan QR codes to mark tickets as used

${walletInfo}
${prefContext ? prefContext + "\n" : ""}LIVE ON-CHAIN EVENTS (${events.length} total):
${eventSummary}
${organizerSection ? "\n" + organizerSection : ""}${ticketSection ? "\n\n" + ticketSection : ""}
${workflowContext ? `\n\nCURRENT WORKFLOW CONTEXT:\n${workflowContext}` : ""}

RULES:
- Be concise by default, but fully answer the user's question. Do not cut the answer short just to stay brief.
- Answer from provided data when possible and say when data is missing
- When recommending an event, always include its exact page path as /events/[id]
- When the user should do something next, end with a short "Next step:" and include the most relevant page path such as /events/[id], /discover, /my-tickets, /dashboard, or /validate
- Cannot execute transactions, only guide the user to the right page
- For organizer or escrow data: only answer if wallet connected and data available
- ${prefs.language === "id" ? "Respond in Bahasa Indonesia." : "Respond in English."}

STRUCTURED RESULT MODE:
- When the user's request clearly matches one of these flows, append exactly one XML block after the normal answer:
  1. event recommendations
  2. tier comparison
  3. organizer performance summary
  4. ticket status summary
- Keep structured results compact. Prefer at most 3 items and keep each reason to one short sentence.
- Use this exact wrapper: <${STRUCTURED_RESULT_TAG}>JSON</${STRUCTURED_RESULT_TAG}>
- The JSON must be valid, compact, and match one of these shapes:
  - {"type":"event_recommendations","title":"...","summary":"...","items":[{"eventId":"...","name":"...","reason":"...","location":"...","priceFromSol":"...","availabilityText":"...","href":"/events/..."}]}
  - {"type":"tier_comparison","title":"...","summary":"...","eventName":"...","eventId":"...","items":[{"tierName":"...","priceSol":"...","availabilityText":"...","reason":"..."}]}
  - {"type":"organizer_summary","title":"...","summary":"...","metrics":[{"label":"...","value":"..."}],"nextStepHref":"/dashboard"}
  - {"type":"ticket_summary","title":"...","summary":"...","items":[{"ticketTitle":"...","date":"...","status":"...","reason":"..."}],"nextStepHref":"/my-tickets"}
- Only include facts supported by the provided data.
- Never include markdown code fences around the XML block.
- If the request does not match one of those flows, do not emit the XML block.`;
}
