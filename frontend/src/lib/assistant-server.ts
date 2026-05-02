import { AnchorProvider, Idl, Program } from "@coral-xyz/anchor";
import { stepCountIs, tool } from "ai";
import { PublicKey } from "@solana/web3.js";
import { z } from "zod";
import type {
  AssistantChatContext,
  AssistantEventRecommendationsResult,
  AssistantOrganizerSummaryResult,
  AssistantStructuredResult,
  AssistantTicketSummaryResult,
  AssistantTierComparisonResult,
} from "@/lib/assistant-shared";
import { normalizeAssistantStructuredResult } from "@/lib/assistant-shared";
import idl from "@/lib/idl/locketing_contract.json";
import { fetchOwnerTickets, getEscrowPDA, PROGRAM_ID } from "@/lib/program";
import { cachedFetch } from "@/lib/programCache";
import { getConnection } from "@/lib/rpc";
import { getCategoryKey } from "@/lib/utils";

type ReadonlyProgram = Program<Idl>;

interface EventAccountData {
  eventId: { toString(): string };
  name: string;
  description?: string;
  location?: string;
  category?: unknown;
  eventType?: { virtual?: boolean };
  status?: Record<string, unknown>;
  startTime?: unknown;
  endTime?: unknown;
  ticketsSold?: unknown;
  totalRevenue?: unknown;
  organizer: { toBase58(): string };
}

interface TierAccountData {
  name: string;
  price?: unknown;
  maxSupply?: unknown;
  sold?: unknown;
  event?: { toBase58(): string };
  eventAccount?: { toBase58(): string };
  eventPubkey?: { toBase58(): string };
}

interface TicketAccountData {
  isUsed?: boolean;
  event?: { toBase58(): string };
  eventAccount?: { toBase58(): string };
  eventPubkey?: { toBase58(): string };
}

interface EscrowAccountData {
  lockedAmount?: unknown;
}

interface RawAccountRecord {
  publicKey: { toBase58(): string };
  account: unknown;
}

interface ServerEventRecord {
  id: string;
  name: string;
  description: string;
  location: string;
  category: string;
  type: "Physical" | "Virtual";
  contractStatus: string;
  status: "On Sale" | "Ongoing" | "Ended" | "Cancelled";
  startTime: number;
  endTime: number;
  sold: number;
  available: number;
  revenue: string;
  href: string;
  eventPDA: string;
  organizer: string;
  tiers: Array<{
    id: string;
    name: string;
    priceSol: string;
    available: number;
    maxSupply: number;
  }>;
}

interface RouteRecommendation {
  href: string;
  label: string;
  reason: string;
}

function getReadonlyProgram(): ReadonlyProgram {
  const connection = getConnection();
  const provider = new AnchorProvider(
    connection,
    {
      publicKey: PublicKey.default,
      signTransaction: async (tx) => tx,
      signAllTransactions: async (txs) => txs,
    },
    { commitment: "confirmed" }
  );

  return new Program(
    { ...idl, address: PROGRAM_ID.toBase58() } as Idl,
    provider
  );
}

function asNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (
    value &&
    typeof value === "object" &&
    "toNumber" in value &&
    typeof (value as { toNumber?: unknown }).toNumber === "function"
  ) {
    return ((value as { toNumber: () => number }).toNumber() ?? 0);
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function getStatusKey(value: Record<string, unknown> | undefined): string {
  return value ? Object.keys(value)[0] ?? "unknown" : "unknown";
}

function parsePublicKeySafe(value: string | null | undefined): PublicKey | null {
  if (!value) return null;

  try {
    return new PublicKey(value);
  } catch {
    return null;
  }
}

function resolveContextWallet(
  inputWallet: string | null | undefined,
  contextWallet: string | null | undefined
): string | null {
  if (parsePublicKeySafe(inputWallet)) return inputWallet ?? null;
  if (parsePublicKeySafe(contextWallet)) return contextWallet ?? null;
  return inputWallet ?? contextWallet ?? null;
}

function formatDateLabel(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-US", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function deriveEventStatus(account: EventAccountData): ServerEventRecord["status"] {
  const now = Math.floor(Date.now() / 1000);
  if (account?.status?.cancelled) return "Cancelled";

  const start = asNumber(account?.startTime);
  const end = asNumber(account?.endTime);

  if (now < start) return "On Sale";
  if (now <= end) return "Ongoing";
  return "Ended";
}

function normalizeEventRecord(
  rawEvent: RawAccountRecord,
  rawTiers: RawAccountRecord[]
): ServerEventRecord {
  const data = rawEvent.account as EventAccountData;
  const eventPDA = rawEvent.publicKey.toBase58();

  const eventTiers = rawTiers
    .filter((tier) => {
      const tierAccount = tier.account as TierAccountData;
      const addr =
        tierAccount.event ??
        tierAccount.eventAccount ??
        tierAccount.eventPubkey;
      return addr?.toBase58?.() === eventPDA;
    })
    .map((tier) => {
      const tierAccount = tier.account as TierAccountData;
      const priceSol = (asNumber(tierAccount.price) / 1_000_000_000).toFixed(3);
      const maxSupply = asNumber(tierAccount.maxSupply);
      const sold = asNumber(tierAccount.sold);

      return {
        id: tier.publicKey.toBase58(),
        name: tierAccount.name,
        priceSol,
        available: Math.max(0, maxSupply - sold),
        maxSupply,
      };
    })
    .sort((left, right) => parseFloat(left.priceSol) - parseFloat(right.priceSol));

  const totalCapacity = eventTiers.reduce((sum, tier) => sum + tier.maxSupply, 0);
  const sold = asNumber(data.ticketsSold);

  return {
    id: data.eventId.toString(),
    name: data.name,
    description: data.description ?? "",
    location: data.location ?? "Unknown location",
    category: getCategoryKey(data.category),
    type: data.eventType?.virtual ? "Virtual" : "Physical",
    contractStatus: getStatusKey(data.status),
    status: deriveEventStatus(data),
    startTime: asNumber(data.startTime),
    endTime: asNumber(data.endTime),
    sold,
    available: Math.max(0, totalCapacity - sold),
    revenue: ((asNumber(data.totalRevenue) ?? 0) / 1_000_000_000).toFixed(3),
    href: `/events/${data.eventId.toString()}`,
    eventPDA,
    organizer: data.organizer.toBase58(),
    tiers: eventTiers,
  };
}

function getProgramAccounts(program: ReadonlyProgram) {
  return program.account as unknown as {
    eventAccount: {
      all(filters?: Array<{ memcmp: { offset: number; bytes: string } }>): Promise<RawAccountRecord[]>;
    };
    ticketTierAccount: {
      all(filters?: Array<{ memcmp: { offset: number; bytes: string } }>): Promise<RawAccountRecord[]>;
    };
    escrowAccount: {
      fetch(publicKey: PublicKey): Promise<EscrowAccountData>;
    };
  };
}

async function getEventCatalog(): Promise<ServerEventRecord[]> {
  const program = getReadonlyProgram();
  const accounts = getProgramAccounts(program);
  const [rawEvents, rawTiers] = await Promise.all([
    cachedFetch<RawAccountRecord[]>("assistant:eventAccount", () =>
      accounts.eventAccount.all()
    ),
    cachedFetch<RawAccountRecord[]>("assistant:ticketTierAccount", () =>
      accounts.ticketTierAccount.all()
    ),
  ]);

  return rawEvents
    .map((event) => normalizeEventRecord(event, rawTiers))
    .sort((left, right) => left.startTime - right.startTime);
}

async function getEventById(eventId: string): Promise<ServerEventRecord | null> {
  const events = await getEventCatalog();
  return events.find((event) => event.id === eventId) ?? null;
}

function parseDateInput(value: string | undefined): number | null {
  if (!value) return null;
  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : Math.floor(parsed / 1000);
}

function summarizeEventReason(event: ServerEventRecord, query?: string): string {
  const lowestTier = event.tiers[0];
  const queryNote = query ? ` Matches "${query}".` : "";
  const tierNote = lowestTier
    ? ` Lowest tier is ${lowestTier.priceSol} SOL.`
    : "";
  return `${event.type} event in ${event.location}.${tierNote}${queryNote}`.trim();
}

async function searchEventsTool(input: {
  query?: string;
  category?: string;
  format?: "physical" | "virtual";
  maxPriceSol?: number;
  dateFrom?: string;
  dateTo?: string;
}) {
  const events = await getEventCatalog();
  const lowerQuery = input.query?.trim().toLowerCase();
  const category = input.category?.trim().toLowerCase();
  const dateFromTs = parseDateInput(input.dateFrom);
  const dateToTs = parseDateInput(input.dateTo);
  const maxPriceSol = input.maxPriceSol;

  const matchesBase = events
    .filter((event) => event.contractStatus === "active")
    .filter((event) =>
      input.format ? event.type.toLowerCase() === input.format : true
    )
    .filter((event) =>
      category ? event.category === category || event.name.toLowerCase().includes(category) : true
    )
    .filter((event) =>
      lowerQuery
        ? `${event.name} ${event.location} ${event.description}`.toLowerCase().includes(lowerQuery)
        : true
    )
    .filter((event) =>
      typeof maxPriceSol === "number"
        ? event.tiers.some((tier) => parseFloat(tier.priceSol) <= maxPriceSol)
        : true
    )
    .filter((event) => (dateFromTs ? event.startTime >= dateFromTs : true))
    .filter((event) => (dateToTs ? event.startTime <= dateToTs : true))
    .slice(0, 6);

  const liveMatches = matchesBase
    .filter((event) => event.status !== "Ended")
    .slice(0, 3);
  const endedMatches = matchesBase
    .filter((event) => event.status === "Ended")
    .slice(0, 3);
  const matches = liveMatches.length > 0 ? liveMatches : endedMatches;
  const allMatchesEnded = liveMatches.length === 0 && endedMatches.length > 0;

  const titleParts = ["Recommended events"];
  if (typeof maxPriceSol === "number") {
    titleParts[0] = `Events Under ${maxPriceSol.toFixed(3)} SOL`;
  } else if (category) {
    titleParts[0] = `${category[0].toUpperCase()}${category.slice(1)} events`;
  }

  const structuredResult: AssistantEventRecommendationsResult = {
    type: "event_recommendations",
    title: titleParts[0],
    summary:
      matches.length > 0
        ? allMatchesEnded
          ? `No live events match right now, but ${matches.length} ended event${matches.length === 1 ? "" : "s"} still match the request.`
          : `Found ${matches.length} event${matches.length === 1 ? "" : "s"} that match the current request.`
        : "No matching events were found in the current catalog.",
    items: matches.map((event) => ({
      eventId: event.id,
      name: event.name,
      reason: allMatchesEnded
        ? `${summarizeEventReason(event, input.query)} This event has already ended.`
        : summarizeEventReason(event, input.query),
      location: event.location,
      priceFromSol: event.tiers[0]?.priceSol,
      availabilityText:
        event.status === "Ended"
          ? "Event ended"
          : `${event.available} tickets available`,
      href: event.href,
    })),
  };

  return {
    summary:
      matches.length > 0
        ? allMatchesEnded
          ? `Found ended events, but no currently live events.`
          : `Found ${matches.length} matching event${matches.length === 1 ? "" : "s"}.`
        : "No live events matched the current filters.",
    structuredResult,
  };
}

async function compareEventTiersTool(input: { eventId?: string | null; tierId?: string | null }) {
  const event = input.eventId ? await getEventById(input.eventId) : null;

  if (!event) {
    return {
      summary: "No event could be resolved for the tier comparison request.",
      structuredResult: null,
    };
  }

  const selectedTier = input.tierId
    ? event.tiers.find((tier) => tier.id === input.tierId)
    : null;

  const structuredResult: AssistantTierComparisonResult = {
    type: "tier_comparison",
    title: selectedTier
      ? `Tier comparison for ${selectedTier.name}`
      : "Ticket tier comparison",
    summary: selectedTier
      ? `The current checkout selection is ${selectedTier.name}.`
      : `Comparing all available tiers for ${event.name}.`,
    eventName: event.name,
    eventId: event.id,
    items: event.tiers.slice(0, 4).map((tier) => ({
      tierName: tier.name,
      priceSol: tier.priceSol,
      availabilityText: `${tier.available}/${tier.maxSupply} available`,
      reason:
        selectedTier && selectedTier.id === tier.id
          ? "This is the currently selected tier."
          : tier.available === 0
            ? "This tier is sold out."
            : "Use this if the price and remaining availability fit the buyer.",
    })),
  };

  return {
    summary: `Compared ${structuredResult.items.length} tier${structuredResult.items.length === 1 ? "" : "s"} for ${event.name}.`,
    structuredResult,
  };
}

async function organizerSummaryTool(input: { walletPublicKey?: string | null }) {
  if (!input.walletPublicKey) {
    return {
      summary: "Organizer summary is unavailable because no wallet is connected.",
      structuredResult: null,
    };
  }

  const organizer = parsePublicKeySafe(input.walletPublicKey);
  if (!organizer) {
    return {
      summary:
        "Organizer summary is unavailable because the connected wallet key could not be parsed.",
      structuredResult: null,
    };
  }

  const program = getReadonlyProgram();
  const accounts = getProgramAccounts(program);
  const escrowPDA = getEscrowPDA(organizer);

  let escrowLocked = 0;
  try {
    const escrowData = await accounts.escrowAccount.fetch(escrowPDA);
    escrowLocked = asNumber(escrowData.lockedAmount) / 1_000_000_000;
  } catch {
    escrowLocked = 0;
  }

  const rawEvents = await accounts.eventAccount.all([
    { memcmp: { offset: 8, bytes: organizer.toBase58() } },
  ]);

  const rawTiers = await cachedFetch<RawAccountRecord[]>("assistant:ticketTierAccount", () =>
    accounts.ticketTierAccount.all()
  );

  const events = (rawEvents as RawAccountRecord[]).map((event) =>
    normalizeEventRecord(event, rawTiers)
  );

  const totalRevenue = events.reduce(
    (sum, event) => sum + parseFloat(event.revenue || "0"),
    0
  );
  const totalSold = events.reduce((sum, event) => sum + event.sold, 0);
  const activeEvents = events.filter(
    (event) => event.status === "On Sale" || event.status === "Ongoing"
  ).length;

  const structuredResult: AssistantOrganizerSummaryResult = {
    type: "organizer_summary",
    title: "Organizer performance summary",
    summary:
      events.length > 0
        ? `The organizer currently has ${events.length} tracked event${events.length === 1 ? "" : "s"}.`
        : "No organizer events were found for the connected wallet.",
    metrics: [
      { label: "Escrow locked", value: `${escrowLocked.toFixed(3)} SOL` },
      { label: "Total revenue", value: `${totalRevenue.toFixed(3)} SOL` },
      { label: "Tickets sold", value: `${totalSold}` },
      { label: "Active events", value: `${activeEvents}` },
    ],
    nextStepHref: "/dashboard",
  };

  return {
    summary:
      events.length > 0
        ? "Organizer metrics were loaded successfully."
        : "No organizer metrics were available for the connected wallet.",
    structuredResult,
  };
}

async function userTicketSummaryTool(input: { walletPublicKey?: string | null }) {
  if (!input.walletPublicKey) {
    return {
      summary: "Ticket summary is unavailable because no wallet is connected.",
      structuredResult: null,
    };
  }

  const owner = parsePublicKeySafe(input.walletPublicKey);
  if (!owner) {
    return {
      summary:
        "Ticket summary is unavailable because the connected wallet key could not be parsed.",
      structuredResult: null,
    };
  }

  const program = getReadonlyProgram();
  const accounts = getProgramAccounts(program);
  const ticketAccounts = await fetchOwnerTickets(program, owner);

  if (ticketAccounts.length === 0) {
    const structuredResult: AssistantTicketSummaryResult = {
      type: "ticket_summary",
      title: "Ticket status summary",
      summary: "No tickets are currently associated with the connected wallet.",
      items: [],
      nextStepHref: "/my-tickets",
    };

    return {
      summary: "No tickets were found for the connected wallet.",
      structuredResult,
    };
  }

  const [rawEvents, rawTiers] = await Promise.all([
    cachedFetch<RawAccountRecord[]>("assistant:eventAccount", () =>
      accounts.eventAccount.all()
    ),
    cachedFetch<RawAccountRecord[]>("assistant:ticketTierAccount", () =>
      accounts.ticketTierAccount.all()
    ),
  ]);

  const events = rawEvents.map((event) => normalizeEventRecord(event, rawTiers));
  const eventByPda = new Map(events.map((event) => [event.eventPDA, event]));
  const now = Math.floor(Date.now() / 1000);

  const items = ticketAccounts.slice(0, 3).map((ticketRecord: RawAccountRecord) => {
    const ticketData = ticketRecord.account as TicketAccountData;
    const eventPubkey =
      ticketData.event ?? ticketData.eventAccount ?? ticketData.eventPubkey;
    const event = eventByPda.get(eventPubkey?.toBase58?.() ?? "");
    const status = event?.status === "Cancelled"
      ? "cancelled"
      : ticketData.isUsed || (event?.endTime ?? 0) < now
        ? "attended"
        : "upcoming";

    return {
      ticketTitle: event?.name ?? "Unknown Event",
      date: event ? formatDateLabel(event.startTime) : "TBA",
      status,
      reason:
        status === "cancelled"
          ? "The event is cancelled and the ticket should be reviewed for refund handling."
          : status === "attended"
            ? "This ticket is already used or the event window has passed."
            : "This ticket is still active for an upcoming event.",
    };
  });

  const structuredResult: AssistantTicketSummaryResult = {
    type: "ticket_summary",
    title: "Ticket status summary",
    summary: `Loaded ${ticketAccounts.length} ticket${ticketAccounts.length === 1 ? "" : "s"} for the connected wallet.`,
    items,
    nextStepHref: "/my-tickets",
  };

  return {
    summary: "Ticket status data was loaded successfully.",
    structuredResult,
  };
}

async function nextStepRouteTool(input: {
  goal: string;
  surface?: string;
  eventId?: string | null;
  walletPublicKey?: string | null;
}) {
  const goal = input.goal.toLowerCase();

  let recommendation: RouteRecommendation;

  if (
    goal.includes("ticket") ||
    goal.includes("qr") ||
    goal.includes("refund") ||
    goal.includes("status")
  ) {
    recommendation = {
      href: "/my-tickets",
      label: "Open My Tickets",
      reason: "This route is the right place to review owned tickets and their status.",
    };
  } else if (
    goal.includes("organizer") ||
    goal.includes("revenue") ||
    goal.includes("dashboard")
  ) {
    recommendation = {
      href: "/dashboard",
      label: "Open Organizer",
      reason: "This route shows organizer metrics and event management tools.",
    };
  } else if (goal.includes("validate")) {
    recommendation = {
      href: "/validate",
      label: "Open Validation",
      reason: "This route is used for validator and check-in flows.",
    };
  } else if (
    goal.includes("discover") ||
    goal.includes("browse") ||
    goal.includes("catalog") ||
    goal.includes("search")
  ) {
    recommendation = {
      href: "/discover",
      label: "Open Discover",
      reason: "This route is the direct catalog workspace for browsing live events.",
    };
  } else if (input.eventId) {
    recommendation = {
      href: `/events/${input.eventId}`,
      label: "Open Event",
      reason: "This route keeps the user in the current event workflow.",
    };
  } else {
    recommendation = {
      href: "/discover",
      label: "Open Discover",
      reason: "No event-specific route was resolved, so the catalog workspace is the safest next action.",
    };
  }

  return recommendation;
}

export function buildToolDrivenSystemPrompt(context: AssistantChatContext): string {
  const prefs = context.prefs;
  const preferenceLine =
    prefs && prefs.categories.length > 0
      ? `User preferences: categories=${prefs.categories.join(", ")} | format=${prefs.eventType}`
      : "User preferences: none supplied.";

  return `You are Flox AI, an event discovery and Solana ticketing assistant.

Use tools for live product data whenever the user asks for:
- event discovery, filtering, budget matching, or recommendations
- ticket tier comparison
- organizer metrics or dashboard summaries
- owned ticket summaries or ticket status explanation
- next-step route guidance

Context:
- route: ${context.route ?? "unknown"}
- surface: ${context.surface ?? "unknown"}
- wallet connected: ${context.walletPublicKey ? "yes" : "no"}
- selected event: ${context.eventId ?? "none"}
- selected tier: ${context.tierId ?? "none"}
- ${preferenceLine}
${context.workflowContext ? `- workflow hint: ${context.workflowContext}` : ""}

Rules:
- Prefer tools over guessing whenever current product data matters.
- Treat workflow hints as UI-only context, not authoritative data.
- If the surface is "chat-home-orchestrator" or the legacy "prototype-chat-home" and the user asks about owned tickets, ticket status, attendance, refunds, organizer performance, metrics, revenue, or dashboard state, call the matching summary tool before answering.
- If the surface is "organizer-copilot" or "dashboard" and the user asks about organizer performance, summary, revenue, attention, metrics, or event status, call getOrganizerSummary before answering.
- If the surface is "ticket-copilot" or "my-tickets" and the user asks about owned tickets, attendance, ticket status, or refunds, call getUserTicketSummary before answering.
- Do not infer organizer or ticket counts/statuses from workflow hints when a tool can fetch them.
- Keep responses concise but complete.
- Do not claim to execute transactions or signatures.
- When a tool returns route guidance, use the exact route in the answer.
- When a tool returns a structured result, summarize it naturally and keep supporting text short.
- ${prefs?.language === "id" ? "Respond in Bahasa Indonesia." : "Respond in English."}`;
}

export function createAssistantTools(context: AssistantChatContext) {
  return {
    searchEvents: tool({
      description:
        "Search current events by budget, category, format, date window, or keyword.",
      inputSchema: z.object({
        query: z.string().optional(),
        category: z.string().optional(),
        format: z.enum(["physical", "virtual"]).optional(),
        maxPriceSol: z.number().optional(),
        dateFrom: z.string().optional(),
        dateTo: z.string().optional(),
      }),
      execute: searchEventsTool,
    }),
    compareEventTiers: tool({
      description:
        "Compare ticket tiers for a selected event. Use the provided event id when available.",
      inputSchema: z.object({
        eventId: z.string().optional(),
        tierId: z.string().optional(),
      }),
      execute: async (input) =>
        compareEventTiersTool({
          eventId: input.eventId ?? context.eventId,
          tierId: input.tierId ?? context.tierId,
        }),
    }),
    getOrganizerSummary: tool({
      description:
        "Fetch organizer metrics for the connected wallet.",
      inputSchema: z.object({
        walletPublicKey: z.string().optional(),
      }),
      execute: async () =>
        organizerSummaryTool({
          walletPublicKey: resolveContextWallet(
            context.walletPublicKey,
            undefined
          ),
        }),
    }),
    getUserTicketSummary: tool({
      description:
        "Fetch a ticket summary for the connected wallet.",
      inputSchema: z.object({
        walletPublicKey: z.string().optional(),
      }),
      execute: async () =>
        userTicketSummaryTool({
          walletPublicKey: resolveContextWallet(
            context.walletPublicKey,
            undefined
          ),
        }),
    }),
    recommendNextStep: tool({
      description:
        "Return the best next route for the user based on the current goal and workflow.",
      inputSchema: z.object({
        goal: z.string(),
        surface: z.string().optional(),
        eventId: z.string().optional(),
        walletPublicKey: z.string().optional(),
      }),
      execute: async (input) =>
        nextStepRouteTool({
          goal: input.goal,
          surface: input.surface ?? context.surface,
          eventId: input.eventId ?? context.eventId,
          walletPublicKey: resolveContextWallet(
            input.walletPublicKey,
            context.walletPublicKey
          ),
        }),
    }),
  };
}

export const assistantStopWhen = stepCountIs(5);

export function getStructuredResultFromToolOutputs(
  toolResults: Array<{ output: unknown }>
): AssistantStructuredResult | null {
  for (let index = toolResults.length - 1; index >= 0; index -= 1) {
    const candidate = toolResults[index]?.output;
    if (
      candidate &&
      typeof candidate === "object" &&
      "structuredResult" in candidate
    ) {
      const structured = normalizeAssistantStructuredResult(
        (candidate as { structuredResult?: unknown }).structuredResult
      );
      if (structured) return structured;
    }
  }

  return null;
}
