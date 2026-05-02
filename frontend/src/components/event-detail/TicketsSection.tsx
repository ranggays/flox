"use client";

import { useState } from "react";
import type { TicketTier, EventDetail } from "@/lib/types";
import TicketCard from "@/components/event-detail/TicketCard";
import CheckoutModal from "@/components/event-detail/CheckoutModal";
import WorkflowAssistant from "@/components/WorkflowAssistant";

interface TicketsSectionProps {
  tickets: TicketTier[];
  event: EventDetail;
}

export default function TicketsSection({ tickets, event }: TicketsSectionProps) {
  const [selectedTicket, setSelectedTicket] = useState<TicketTier | null>(null);
  const workflowContext = [
    `Surface: event detail page for "${event.title}".`,
    `Status: ${event.status}.`,
    `Schedule: ${event.dateRange} at ${event.time}.`,
    `Location: ${event.location}.`,
    `Description: ${event.description.join(" ")}`,
    `Organizer: ${event.organizer ?? "unknown"}.`,
    "Ticket tiers:",
    ...tickets.map(
      (ticket) =>
        `- ${ticket.name}: ${ticket.price} ${ticket.currency}, sold ${ticket.sold}/${ticket.total}, features: ${ticket.features.join(", ")}`
    ),
  ].join("\n");

  return (
    <>
      <section className="px-6 py-12 bg-slate-50 dark:bg-black">
        <div className="mx-auto max-w-7xl">
          {/* Header */}
          <div className="mb-10 text-center">
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">
              Select Your Experience
            </h2>
            <p className="text-slate-500">
              Secure your spot in the metaverse. Payment processed on Solana.
            </p>
          </div>

          <WorkflowAssistant
            eyebrow="Event Copilot"
            title="Use the event copilot before you choose a ticket"
            description="This copilot is grounded in the current event, schedule, and tier stack so it can help you decide before you buy without replacing the main AI Home flow."
            suggestions={[
              "Ask AI if this event fits me",
              "Summarize this event",
            ]}
            route={`/events/${event.id}`}
            surface="event-copilot"
            workflowContext={workflowContext}
            placeholder="Ask about this event or its ticket tiers..."
            emptyState="Ask Flox AI to evaluate this event, explain the audience fit, or summarize the differences between its ticket options."
            className="mb-10"
            eventId={String(event.id)}
          />

          {/* Ticket grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onSelect={() => setSelectedTicket(ticket)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Checkout modal — rendered outside section to avoid z-index issues */}
      {selectedTicket && (
        <CheckoutModal
          ticket={selectedTicket}
          event={event}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </>
  );
}
