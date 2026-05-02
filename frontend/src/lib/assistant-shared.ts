export interface AssistantActionLink {
  href: string;
  label: string;
}

export interface AssistantRequestPreferences {
  categories: string[];
  eventType: "all" | "physical" | "virtual";
  language: "en" | "id";
}

export interface AssistantChatContext {
  route?: string;
  surface?: string;
  walletPublicKey?: string | null;
  eventId?: string | null;
  tierId?: string | null;
  workflowContext?: string;
  prefs?: AssistantRequestPreferences;
}

export type AssistantStructuredResult =
  | AssistantEventRecommendationsResult
  | AssistantTierComparisonResult
  | AssistantOrganizerSummaryResult
  | AssistantTicketSummaryResult;

export interface AssistantEventRecommendationsResult {
  type: "event_recommendations";
  title: string;
  summary?: string;
  items: Array<{
    eventId: string;
    name: string;
    reason: string;
    location: string;
    priceFromSol?: string;
    availabilityText?: string;
    href: string;
  }>;
}

export interface AssistantTierComparisonResult {
  type: "tier_comparison";
  title: string;
  summary?: string;
  eventName: string;
  eventId: string;
  items: Array<{
    tierName: string;
    priceSol: string;
    availabilityText: string;
    reason: string;
  }>;
}

export interface AssistantOrganizerSummaryResult {
  type: "organizer_summary";
  title: string;
  summary?: string;
  metrics: Array<{
    label: string;
    value: string;
  }>;
  nextStepHref?: string;
}

export interface AssistantTicketSummaryResult {
  type: "ticket_summary";
  title: string;
  summary?: string;
  items: Array<{
    ticketTitle: string;
    date: string;
    status: string;
    reason: string;
  }>;
  nextStepHref?: string;
}

export const STRUCTURED_RESULT_TAG = "flox-result";

export function extractAssistantActionLinks(text: string): AssistantActionLink[] {
  const paths =
    text.match(/\/events\/\d+|\/discover|\/my-tickets|\/dashboard|\/validate/gi) ??
    [];
  const uniquePaths = [...new Set(paths)];

  return uniquePaths.map((href) => ({
    href,
    label: getActionLabel(href),
  }));
}

export function extractAssistantStructuredResult(
  text: string
): AssistantStructuredResult | null {
  const match = text.match(
    new RegExp(`<${STRUCTURED_RESULT_TAG}>([\\s\\S]*?)</${STRUCTURED_RESULT_TAG}>`, "i")
  );
  if (!match) return null;

  try {
    return normalizeAssistantStructuredResult(JSON.parse(match[1].trim()));
  } catch {
    return null;
  }
}

export function stripAssistantStructuredResult(text: string): string {
  const completeBlockPattern = new RegExp(
    `\\s*<${STRUCTURED_RESULT_TAG}>[\\s\\S]*?</${STRUCTURED_RESULT_TAG}>\\s*`,
    "i"
  );
  const danglingBlockPattern = new RegExp(`\\s*<${STRUCTURED_RESULT_TAG}>[\\s\\S]*$`, "i");

  return text
    .replace(completeBlockPattern, "\n")
    .replace(danglingBlockPattern, "\n")
    .trim();
}

export function extractAssistantActionLinksFromResult(
  result: AssistantStructuredResult | null
): AssistantActionLink[] {
  if (!result) return [];

  if (result.type === "event_recommendations") {
    return dedupeActionLinks(
      result.items.map((item) => ({
        href: item.href,
        label: "Open Event",
      }))
    );
  }

  if (result.type === "tier_comparison") {
    return dedupeActionLinks([
      {
        href: `/events/${result.eventId}`,
        label: "Open Event",
      },
    ]);
  }

  if (result.nextStepHref) {
    return dedupeActionLinks([
      {
        href: result.nextStepHref,
        label: getActionLabel(result.nextStepHref),
      },
    ]);
  }

  return [];
}

export function normalizeAssistantStructuredResult(
  value: unknown
): AssistantStructuredResult | null {
  if (!value || typeof value !== "object") return null;

  const record = value as Record<string, unknown>;
  const type = asTrimmedString(record.type);
  if (!type) return null;

  switch (type) {
    case "event_recommendations": {
      const items = asRecordArray(record.items)
        .map((item) => {
          const eventId = asTrimmedString(item.eventId);
          const name = asTrimmedString(item.name);
          const reason = asTrimmedString(item.reason);
          const location = asTrimmedString(item.location);
          const href =
            sanitizeAssistantHref(asTrimmedString(item.href)) ??
            (eventId ? `/events/${eventId}` : null);

          if (!eventId || !name || !reason || !location || !href) return null;

          return {
            eventId,
            name,
            reason,
            location,
            priceFromSol: asOptionalTrimmedString(item.priceFromSol),
            availabilityText: asOptionalTrimmedString(item.availabilityText),
            href,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (items.length === 0) return null;

      return {
        type,
        title: asTrimmedString(record.title) ?? "Recommended events",
        summary: asOptionalTrimmedString(record.summary),
        items,
      };
    }

    case "tier_comparison": {
      const eventId = asTrimmedString(record.eventId);
      const eventName = asTrimmedString(record.eventName);
      const items = asRecordArray(record.items)
        .map((item) => {
          const tierName = asTrimmedString(item.tierName);
          const priceSol = asTrimmedString(item.priceSol);
          const availabilityText = asTrimmedString(item.availabilityText);
          const reason = asTrimmedString(item.reason);

          if (!tierName || !priceSol || !availabilityText || !reason) return null;

          return {
            tierName,
            priceSol,
            availabilityText,
            reason,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (!eventId || !eventName || items.length === 0) return null;

      return {
        type,
        title: asTrimmedString(record.title) ?? "Ticket tier comparison",
        summary: asOptionalTrimmedString(record.summary),
        eventName,
        eventId,
        items,
      };
    }

    case "organizer_summary": {
      const metrics = asRecordArray(record.metrics)
        .map((item) => {
          const label = asTrimmedString(item.label);
          const valueText = asTrimmedString(item.value);
          if (!label || !valueText) return null;

          return {
            label,
            value: valueText,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (metrics.length === 0) return null;

      return {
        type,
        title: asTrimmedString(record.title) ?? "Organizer summary",
        summary: asOptionalTrimmedString(record.summary),
        metrics,
        nextStepHref:
          sanitizeAssistantHref(asOptionalTrimmedString(record.nextStepHref)) ??
          "/dashboard",
      };
    }

    case "ticket_summary": {
      const items = asRecordArray(record.items)
        .map((item) => {
          const ticketTitle = asTrimmedString(item.ticketTitle);
          const date = asTrimmedString(item.date);
          const status = asTrimmedString(item.status);
          const reason = asTrimmedString(item.reason);
          if (!ticketTitle || !date || !status || !reason) return null;

          return {
            ticketTitle,
            date,
            status,
            reason,
          };
        })
        .filter((item): item is NonNullable<typeof item> => item !== null);

      if (items.length === 0) return null;

      return {
        type,
        title: asTrimmedString(record.title) ?? "Ticket summary",
        summary: asOptionalTrimmedString(record.summary),
        items,
        nextStepHref:
          sanitizeAssistantHref(asOptionalTrimmedString(record.nextStepHref)) ??
          "/my-tickets",
      };
    }

    default:
      return null;
  }
}

export function serializeAssistantStructuredResult(
  result: AssistantStructuredResult
): string {
  return `<${STRUCTURED_RESULT_TAG}>${JSON.stringify(result)}</${STRUCTURED_RESULT_TAG}>`;
}

export function finalizeAssistantText(text: string): string {
  const visibleText = stripAssistantStructuredResult(text);
  const structuredResult = extractAssistantStructuredResult(text);

  if (!structuredResult) return visibleText;
  if (!visibleText) return serializeAssistantStructuredResult(structuredResult);

  return `${visibleText}\n\n${serializeAssistantStructuredResult(structuredResult)}`;
}

function dedupeActionLinks(links: AssistantActionLink[]): AssistantActionLink[] {
  const seen = new Set<string>();

  return links.filter((link) => {
    if (seen.has(link.href)) return false;
    seen.add(link.href);
    return true;
  });
}

function getActionLabel(href: string): string {
  if (href.startsWith("/events/")) return "Open Event";
  if (href === "/discover") return "Open Discover";
  if (href === "/my-tickets") return "Open My Tickets";
  if (href === "/dashboard") return "Open Organizer";
  if (href === "/validate") return "Open Validation";
  return "Open Page";
}

function asTrimmedString(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function asOptionalTrimmedString(value: unknown): string | undefined {
  return asTrimmedString(value) ?? undefined;
}

function asRecordArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (item): item is Record<string, unknown> =>
      !!item && typeof item === "object" && !Array.isArray(item)
  );
}

function sanitizeAssistantHref(value: string | null | undefined): string | null {
  if (!value) return null;
  if (/^\/events\/[^/\s]+$/i.test(value)) return value;
  if (value === "/discover") return value;
  if (value === "/my-tickets") return value;
  if (value === "/dashboard") return value;
  if (value === "/validate") return value;
  return null;
}
