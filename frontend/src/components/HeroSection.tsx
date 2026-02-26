"use client";

import { useMemo } from "react";

interface HeroSectionProps {
  events: any[]; 
}

export default function HeroSection({ events }: HeroSectionProps) {
  const totalEvents = events.length;

  const totalMinted = useMemo(() => {
    return events.reduce((acc, curr) => acc + (curr.sold || 0), 0);
  }, [events]);

  const stats = [
    {
      icon: (
        <svg className="w-6 h-6 text-slate-700 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      label: "Active Events",
      value: String(totalEvents),
    },
    {
      icon: (
        <svg className="w-6 h-6 text-slate-700 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m-4 4v2m4 4v2M5 5a2 2 0 012-2h6a2 2 0 012 2v12a2 2 0 01-2 2H7a2 2 0 01-2-2V5z" />
        </svg>
      ),
      label: "Tickets Minted", 
      value: totalMinted.toLocaleString(), 
    },
    {
      icon: <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />,
      label: "Platform Status",
      value: "Live",
    },
  ];

  const marqueeItems = events.length > 0 
    ? events.map((e) => e.name) 
    : ["Web3 Ticketing", "Secure Tickets", "Decentralized Events"];
    
  const repeated = Array(5).fill(marqueeItems).flat();

  return (
    <section className="pt-28 pb-0 overflow-hidden bg-[#f6f6f8] dark:bg-black">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* Badge */}
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-sm shadow-sm dark:shadow-none">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium tracking-wide">
              Powered by Solana 
            </span>
          </div>

          {/* Headline */}
          <h1 className="text-6xl md:text-7xl font-black text-slate-900 dark:text-white leading-tight tracking-tight">
            Web3 Ticketing{" "}
            <span className="text-[#5048e5]">Platform</span>
          </h1>

          <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto leading-relaxed">
            Secure, transparent, and decentralized ticket marketplace powered
            by blockchain technology. Own your tickets, control your experience.
          </p>

          <div className="flex items-center justify-center gap-4 pt-2">
            <a
              href="#events"
              className="px-8 py-3 bg-[#5048e5] text-white font-bold rounded-xl hover:bg-[#5048e5]/90 transition-all text-sm shadow-lg shadow-[#5048e5]/20"
            >
              Explore Events
            </a>
            <a
              href="/dashboard"
              className="px-8 py-3 border border-slate-200 dark:border-white/20 text-slate-700 dark:text-white font-bold rounded-xl hover:bg-slate-100 dark:hover:bg-white/10 transition-all text-sm"
            >
              Create Event
            </a>
          </div>
        </div>

        {/* Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-16">
          {stats.map(({ icon, label, value }) => (
            <div
              key={label}
              className="border border-slate-200 dark:border-white/10 rounded-xl p-6 bg-white dark:bg-white/3 shadow-sm dark:shadow-none"
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 uppercase tracking-wider font-medium mb-2">
                    {label}
                  </p>
                  <p className="text-3xl font-bold text-slate-900 dark:text-white">{value}</p>
                </div>
                <div className="w-12 h-12 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 flex items-center justify-center">
                  {icon}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dual Marquee */}
      <div className="w-full border-y border-slate-200 dark:border-white/10 py-10 space-y-4 bg-white dark:bg-black overflow-hidden">
        <style>{`
          @keyframes marquee-r { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
          @keyframes marquee-l { 0% { transform: translateX(-50%); } 100% { transform: translateX(0); } }
          .mq-right { animation: marquee-r 40s linear infinite; }
          .mq-left  { animation: marquee-l 40s linear infinite; }
        `}</style>

        {/* Row 1 — faded, right */}
        <div className="overflow-hidden">
          <div className="mq-right flex gap-10 whitespace-nowrap">
            {[...repeated, ...repeated].map((title, i) => (
              <span key={i} className="text-5xl font-black text-slate-200 dark:text-white/10 tracking-tight">
                {title}
              </span>
            ))}
          </div>
        </div>

        {/* Row 2 — solid, left */}
        <div className="overflow-hidden">
          <div className="mq-left flex gap-10 whitespace-nowrap">
            {[...repeated, ...repeated].map((title, i) => (
              <div key={i} className="flex items-center gap-10 shrink-0">
                <span className="text-5xl font-black text-slate-800 dark:text-white tracking-tight">
                  {title}
                </span>
                <span className="text-slate-300 dark:text-white/30 text-2xl">✦</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}