"use client";

import { useState } from "react";
import type { MyTicket, TicketStatus } from "@/lib/types";
import TicketItem from "@/components/my-tickets/TicketItem";

interface TicketListProps {
  tickets: MyTicket[];
}

const TABS: { label: string; value: string | "all" }[] = [
  { label: "Upcoming", value: "upcoming" },
  { label: "Attended", value: "attended" },
  { label: "Cancelled", value: "cancelled" },
  { label: "Listed", value: "listed" },
];

export default function TicketList({ tickets }: TicketListProps) {
  const [activeTab, setActiveTab] = useState<string | "all">("upcoming");
  const [visibleCount, setVisibleCount] = useState(5);

  const filtered =
    activeTab === "all"
      ? tickets
      : tickets.filter((t) => t.status === activeTab);

  const visible = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  return (
    <>
      {/* Filter tabs */}
      <div className="flex gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 w-fit rounded-xl mb-8">
        {TABS.map(({ label, value }) => {
          const isActive = activeTab === value;
          const count = tickets.filter((t) => t.status === value).length;
          return (
            <button
              key={value}
              onClick={() => {
                setActiveTab(value);
                setVisibleCount(5);
              }}
              className={`flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-bold transition-all ${
                isActive
                  ? "bg-white dark:bg-slate-700 shadow-sm text-[#5048e5]"
                  : "text-slate-600 dark:text-slate-400 hover:bg-white/50 dark:hover:bg-slate-700/50"
              }`}
            >
              {label}
              {count > 0 && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? "bg-[#5048e5]/10 text-[#5048e5]"
                      : "bg-slate-200 dark:bg-slate-600 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Ticket list */}
      {visible.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <span className="material-symbols-outlined text-6xl text-slate-300 dark:text-slate-700 mb-4">
            confirmation_number
          </span>
          <p className="text-slate-500 dark:text-slate-400 font-medium text-lg">
            No tickets here yet.
          </p>
          <p className="text-slate-400 dark:text-slate-600 text-sm mt-1">
            Browse events and grab your first ticket!
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {visible.map((ticket) => (
            <TicketItem key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}

      {/* Load more */}
      {hasMore && (
        <div className="mt-10 flex justify-center">
          <button
            onClick={() => setVisibleCount((c) => c + 5)}
            className="px-8 py-3 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            Load more tickets
          </button>
        </div>
      )}
    </>
  );
}