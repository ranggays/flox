"use client";

import type { FilterCategory } from "@/lib/types";
import { FILTER_LABELS } from "@/lib/utils";

interface FilterBarProps {
  activeFilter: FilterCategory;
  onFilter: (filter: FilterCategory) => void;
  searchQuery: string;
  onSearch: (q: string) => void;
}

const FILTERS: FilterCategory[] = ["all", "music", "conference", "sports", "art", "other"];

export default function FilterBar({ activeFilter, onFilter, searchQuery, onSearch }: FilterBarProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10">
      <div>
        <h2 className="text-4xl font-black text-slate-900 dark:text-white">Upcoming Events</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
          Discover and reserve your NFT tickets
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Search events..."
            value={searchQuery}
            onChange={(e) => onSearch(e.target.value)}
            className="pl-9 pr-4 py-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-600 outline-none focus:border-[#5048e5] dark:focus:border-white/30 transition-all w-full sm:w-48"
          />
        </div>

        {/* Category filters */}
        <div className="flex gap-1.5 flex-wrap">
          {FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => onFilter(filter)}
              className={`px-3.5 py-2 rounded-lg text-xs font-semibold transition-all border ${
                activeFilter === filter
                  ? "bg-[#5048e5] text-white border-[#5048e5]"
                  : "border-slate-200 dark:border-white/10 text-slate-600 dark:text-slate-400 hover:border-[#5048e5]/50 dark:hover:border-white/20 hover:text-[#5048e5] dark:hover:text-white"
              }`}
            >
              {FILTER_LABELS[filter]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}