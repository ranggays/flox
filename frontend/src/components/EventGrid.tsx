"use client";

import { useState, useMemo } from "react";
import type { FilterCategory } from "@/lib/types";
import { filterEvents } from "@/lib/utils";
import FilterBar from "@/components/FilterBar";
import EventCard from "@/components/EventCard";

interface EventGridProps {
  events:     any[];
  loading?:   boolean;
  onRefresh?: () => void;
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-white/10 animate-pulse">
      <div className="h-52 bg-slate-200 dark:bg-white/5" />
      <div className="p-5 space-y-3">
        <div className="h-4 bg-slate-200 dark:bg-white/5 rounded w-3/4" />
        <div className="h-3 bg-slate-200 dark:bg-white/5 rounded w-1/2" />
        <div className="h-8 bg-slate-200 dark:bg-white/5 rounded mt-4" />
      </div>
    </div>
  );
}

export default function EventGrid({
  events,
  loading = false,
  onRefresh,
}: EventGridProps) {
  const [activeFilter, setActiveFilter] = useState<FilterCategory>("all");
  const [searchQuery,  setSearchQuery]  = useState("");

  const filtered = useMemo(
    () => filterEvents(events, activeFilter, searchQuery),
    [events, activeFilter, searchQuery]
  );

  return (
    <section id="events" className="bg-[#f6f6f8] dark:bg-black py-16">
      <div className="container mx-auto px-6 max-w-7xl">

        {/* FilterBar — contains "Upcoming Events" title + search + category buttons */}
        <div className="flex flex-col gap-4 mb-10">
          <FilterBar
            activeFilter={activeFilter}
            onFilter={setActiveFilter}
            searchQuery={searchQuery}
            onSearch={setSearchQuery}
          />

          {/* Devnet badge + refresh */}
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              {loading
                ? "Fetching from Solana devnet..."
                : `${events.length} active event${events.length !== 1 ? "s" : ""} on-chain`}
            </p>
            <div className="flex items-center gap-2">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={loading}
                  title="Refresh from blockchain"
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-white/10 text-slate-400 hover:text-[#5048e5] hover:border-[#5048e5]/40 disabled:opacity-40 transition-all"
                >
                  <svg
                    className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              )}
              <span className="px-3 py-1 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">
                Devnet
              </span>
            </div>
          </div>
        </div>

        {/* Grid content */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-16 h-16 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center mb-4 bg-white dark:bg-black">
              <svg
                className="w-8 h-8 text-slate-300 dark:text-slate-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">No events found</p>
            <p className="text-slate-400 dark:text-slate-600 text-sm mt-1">
              {searchQuery || activeFilter !== "all"
                ? "Try a different search or category filter."
                : "No active events on-chain yet."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}