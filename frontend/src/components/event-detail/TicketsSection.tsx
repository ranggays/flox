"use client";

import { useState } from "react";
import type { TicketTier, EventDetail } from "@/lib/types";
import TicketCard from "@/components/event-detail/TicketCard";
import CheckoutModal from "@/components/event-detail/CheckoutModal";

interface TicketsSectionProps {
  tickets: TicketTier[];
  event: EventDetail;
}

export default function TicketsSection({ tickets, event }: TicketsSectionProps) {
  const [selectedTicket, setSelectedTicket] = useState<TicketTier | null>(null);

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