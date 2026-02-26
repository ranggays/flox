"use client";

import type { TicketTier } from "@/lib/types";

interface TicketCardProps {
  ticket: TicketTier;
  onSelect: () => void;
}

export default function TicketCard({ ticket, onSelect }: TicketCardProps) {
  const soldPct = Math.round((ticket.sold / ticket.total) * 100);
  const remaining = ticket.total - ticket.sold;
  const displayRemaining = remaining.toLocaleString();
  const displayTotal = ticket.total.toLocaleString();

  return (
    <div
      className={`group relative flex flex-col rounded-xl p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-slate-900
        ${
          ticket.highlighted
            ? "border-2 border-[#5048e5] shadow-xl"
            : "border border-slate-200 dark:border-slate-800 hover:border-[#5048e5]/50 hover:shadow-lg"
        }`}
    >
      {/* Top badge */}
      {ticket.badge && ticket.highlighted && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 rounded-full bg-[#5048e5] px-4 py-1 text-xs font-black text-white uppercase tracking-widest">
          {ticket.badge}
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-start">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white">
            {ticket.name}
          </h3>
          {ticket.badge && !ticket.highlighted && (
            <span className="rounded-lg bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-[10px] font-bold uppercase text-slate-500">
              {ticket.badge}
            </span>
          )}
        </div>
        <div className="mt-4 flex items-baseline gap-2">
          <span
            className={`text-4xl font-black ${ticket.highlighted ? "text-[#5048e5]" : "text-slate-900 dark:text-white"}`}
          >
            {ticket.price} {ticket.currency}
          </span>
          <span className="text-sm font-medium text-slate-400">/ ticket</span>
        </div>
      </div>

      {/* Features */}
      <div className="flex-1 space-y-4 mb-8">
        {ticket.features.map((feat) => (
          <div key={feat} className="flex items-start gap-3">
            <span className="material-symbols-outlined text-[#5048e5] text-xl shrink-0">
              {ticket.highlighted ? "star" : "check_circle"}
            </span>
            <span className="text-sm text-slate-700 dark:text-slate-300">
              {feat}
            </span>
          </div>
        ))}
      </div>

      {/* Supply bar */}
      <div className="mt-auto">
        <div className="mb-4">
          <div className="flex justify-between text-xs font-bold mb-1">
            <span className="text-slate-500 uppercase tracking-tighter">
              Remaining Supply
            </span>
            <span className={ticket.highlighted ? "text-[#5048e5]" : "text-slate-900 dark:text-white"}>
              {displayRemaining} / {displayTotal}
            </span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${ticket.highlighted ? "bg-[#5048e5]" : "bg-slate-400 dark:bg-slate-600"}`}
              style={{ width: `${soldPct}%` }}
            />
          </div>
          {ticket.urgency && (
            <p className="mt-1.5 text-[10px] text-red-500 font-bold uppercase tracking-tight">
              {ticket.urgency}
            </p>
          )}
        </div>

        {/* CTA — calls onSelect to open modal */}
        <button
          onClick={onSelect}
          className={`w-full rounded-lg py-4 text-sm font-black transition-all active:scale-[0.98]
            ${
              ticket.highlighted
                ? "bg-[#5048e5] text-white shadow-lg shadow-[#5048e5]/20 hover:bg-[#5048e5]/90"
                : "border border-[#5048e5] text-[#5048e5] hover:bg-[#5048e5] hover:text-white"
            }`}
        >
          SELECT {ticket.name.toUpperCase()}
        </button>
      </div>
    </div>
  );
}