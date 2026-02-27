"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// https://drive.google.com/file/d/1GCy8B_G6zM6Su-bu8C-2vauHr1Ko5pN3/view?usp=sharing
const YOUTUBE_VIDEO_ID = "YOUR_VIDEO_ID";
// Ganti konstanta di bagian atas file
const GDRIVE_FILE_ID = "1GCy8B_G6zM6Su-bu8C-2vauHr1Ko5pN3";

const SECTIONS = [
  {
    id: "demo",
    icon: "play_circle",
    label: "Demo Video",
  },
  {
    id: "overview",
    icon: "info",
    label: "Overview",
  },
  {
    id: "how-it-works",
    icon: "schema",
    label: "How It Works",
  },
  {
    id: "roles",
    icon: "people",
    label: "User Roles",
  },
  {
    id: "escrow",
    icon: "shield",
    label: "Escrow & Security",
  },
  {
    id: "ai-agent",
    icon: "auto_awesome",
    label: "AI Assistant",
  },
  {
    id: "full-docs",
    icon: "description",
    label: "Full Documentation",
  },
];

const ROLE_CARDS = [
  {
    icon: "confirmation_number",
    role: "Buyer",
    color: "from-blue-500 to-cyan-500",
    bg: "bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800",
    steps: [
      "Connect Phantom Wallet",
      "Browse events on homepage",
      "Select a ticket tier & buy",
      "Ticket stored in your wallet",
      "Show QR code at event entrance",
    ],
  },
  {
    icon: "event",
    role: "Organizer",
    color: "from-[#5048e5] to-violet-500",
    bg: "bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800",
    steps: [
      "Connect wallet & go to Dashboard",
      "Stake 0.05 SOL (anti-spam deposit)",
      "Fill event form (5 sections)",
      "Deploy event to Solana",
      "Withdraw revenue after event ends",
    ],
  },
  {
    icon: "qr_code_scanner",
    role: "Validator",
    color: "from-green-500 to-emerald-500",
    bg: "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800",
    steps: [
      "Get authorized by organizer",
      "Your wallet added on-chain",
      "Scan attendee QR codes",
      "Ticket marked as used on-chain",
      "Cannot reuse validated tickets",
    ],
  },
];

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Organizer Creates Event",
    description:
      "Organizer stakes 0.05 SOL as a spam-prevention deposit, then deploys the event smart contract to Solana Devnet with ticket tiers and pricing.",
    icon: "rocket_launch",
  },
  {
    step: "02",
    title: "Buyer Purchases Ticket",
    description:
      "Buyer pays in SOL. Funds go directly into the escrow account on-chain — not to the organizer yet. A unique ticket PDA is minted to the buyer's wallet.",
    icon: "shopping_cart",
  },
  {
    step: "03",
    title: "Validator Verifies Entry",
    description:
      "Authorized validators scan QR codes at the venue. Validation is an on-chain transaction — ticket is permanently marked as used, preventing double-entry.",
    icon: "verified",
  },
  {
    step: "04",
    title: "Organizer Withdraws Revenue",
    description:
      "After the event ends, the organizer withdraws accumulated revenue plus the 0.05 SOL stake refund — all from the escrow account via a single transaction.",
    icon: "account_balance_wallet",
  },
];

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("demo");
  const [videoLoaded, setVideoLoaded] = useState(false);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  };

  // const isPlaceholder = YOUTUBE_VIDEO_ID === "YOUR_VIDEO_ID";
  const isPlaceholder = false;

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f6f8] dark:bg-black">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">

        {/* Page title */}
        <div className="mb-10">
          <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-4">
            <Link href="/" className="hover:text-[#5048e5] transition-colors">Home</Link>
            <span className="material-symbols-outlined text-xs">chevron_right</span>
            <span className="text-slate-900 dark:text-slate-100 font-medium">Documentation</span>
          </nav>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Documentation
          </h1>
          <p className="mt-2 text-slate-500 dark:text-slate-400 text-lg max-w-2xl">
            Learn how Flox works — from buying your first ticket to deploying an event on Solana.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

          {/* Sidebar */}
          <aside className="hidden lg:block space-y-1 sticky top-24 h-fit">
            {SECTIONS.map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                  activeSection === id
                    ? "bg-[#5048e5] text-white"
                    : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                }`}
              >
                <span className="material-symbols-outlined text-base">{icon}</span>
                {label}
              </button>
            ))}
          </aside>

          {/* Content */}
          <div className="lg:col-span-3 space-y-10">

            <section id="demo" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-[#5048e5]/10 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[#5048e5]">play_circle</span>
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">Demo Video</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      Full walkthrough — organizer creates event, buyer purchases ticket, validator verifies entry
                    </p>
                  </div>
                </div>
              </div>

              {/* Video embed */}
              <div className="relative bg-black" style={{ aspectRatio: "16/9" }}>
                {isPlaceholder ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 gap-4">
                    <div className="size-20 rounded-full bg-[#5048e5]/20 flex items-center justify-center">
                      <span className="material-symbols-outlined text-[#5048e5] text-5xl">play_circle</span>
                    </div>
                    <div className="text-center">
                      <p className="text-white font-bold text-lg">Demo Video</p>
                      <p className="text-slate-400 text-sm mt-1">
                        Upload your video to YouTube, then replace{" "}
                        <code className="text-[#5048e5] font-mono">YOUR_VIDEO_ID</code>{" "}
                        in <code className="text-slate-300 font-mono">app/docs/page.tsx</code>
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-800 rounded-xl border border-slate-700">
                      <span className="material-symbols-outlined text-slate-400 text-sm">info</span>
                      <p className="text-slate-400 text-xs font-mono">
                        const YOUTUBE_VIDEO_ID = "YOUR_VIDEO_ID"
                      </p>
                    </div>
                  </div>
                ) : (
                  <iframe
                    src={`https://drive.google.com/file/d/${GDRIVE_FILE_ID}/preview`}
                    title="Flox Demo"
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    onLoad={() => setVideoLoaded(true)}
                  />
                )}
              </div>

              {/* Video chapters */}
              {/* {!isPlaceholder && (
                <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {[
                    { time: "0:00", label: "Introduction" },
                    { time: "0:20", label: "Create Event" },
                    { time: "1:00", label: "Homepage Live" },
                    { time: "1:30", label: "Buy Ticket" },
                    { time: "2:00", label: "Validate Entry" },
                    { time: "2:30", label: "AI Assistant" },
                  ].map((c) => (
                    <div
                      key={c.time}
                      className="flex items-center gap-2.5 px-3 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg"
                    >
                      <span className="font-mono text-xs font-bold text-[#5048e5]">{c.time}</span>
                      <span className="text-xs text-slate-600 dark:text-slate-300">{c.label}</span>
                    </div>
                  ))}
                </div>
              )} */}
            </section>

            <section id="overview" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-xl bg-[#5048e5]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#5048e5]">info</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">What is Flox?</h2>
              </div>

              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                Flox is a decentralized event ticketing platform built on <strong className="text-slate-900 dark:text-white">Solana Devnet</strong>. It eliminates ticketing middlemen by recording every ticket as a unique on-chain account — meaning tickets cannot be faked, revenue is protected in escrow, and all data is publicly verifiable.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { icon: "verified_user", label: "Anti-Counterfeit", desc: "Every ticket is a unique on-chain PDA — impossible to duplicate" },
                  { icon: "lock", label: "Revenue Escrow", desc: "Buyer funds are held on-chain until the event ends" },
                  { icon: "bolt", label: "Instant & Cheap", desc: "Solana transactions confirm in ~1 second for <$0.01" },
                ].map((item) => (
                  <div key={item.label} className="p-4 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="material-symbols-outlined text-[#5048e5] text-2xl mb-2 block">{item.icon}</span>
                    <p className="font-bold text-slate-900 dark:text-white text-sm mb-1">{item.label}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="how-it-works" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="size-10 rounded-xl bg-[#5048e5]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#5048e5]">schema</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">How It Works</h2>
              </div>

              <div className="space-y-6">
                {HOW_IT_WORKS.map((item, i) => (
                  <div key={item.step} className="flex gap-5">
                    {/* Step number + line */}
                    <div className="flex flex-col items-center">
                      <div className="size-10 rounded-xl bg-[#5048e5] text-white flex items-center justify-center font-black text-sm shrink-0">
                        {item.step}
                      </div>
                      {i < HOW_IT_WORKS.length - 1 && (
                        <div className="w-px flex-1 bg-slate-200 dark:bg-slate-700 mt-2" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="pb-6 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="material-symbols-outlined text-[#5048e5] text-lg">{item.icon}</span>
                        <h3 className="font-bold text-slate-900 dark:text-white">{item.title}</h3>
                      </div>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section id="roles" className="space-y-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="size-10 rounded-xl bg-[#5048e5]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#5048e5]">people</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">User Roles</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {ROLE_CARDS.map((card) => (
                  <div key={card.role} className={`rounded-2xl border p-5 ${card.bg}`}>
                    <div className={`size-10 rounded-xl bg-linear-to-br ${card.color} flex items-center justify-center mb-4`}>
                      <span className="material-symbols-outlined text-white text-xl">{card.icon}</span>
                    </div>
                    <h3 className="font-black text-slate-900 dark:text-white text-lg mb-3">{card.role}</h3>
                    <ol className="space-y-2">
                      {card.steps.map((step, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <span className="size-5 rounded-full bg-white/60 dark:bg-black/20 text-slate-600 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                ))}
              </div>
            </section>

            <section id="escrow" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-xl bg-[#5048e5]/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-[#5048e5]">shield</span>
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Escrow & Security</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="p-5 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <h3 className="font-bold text-blue-900 dark:text-blue-200 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">savings</span>
                    Revenue Escrow
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                    Ticket payments go into an on-chain escrow account — not directly to the organizer. Funds are only released after the event ends, protecting buyers from fraudulent organizers.
                  </p>
                </div>
                <div className="p-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl">
                  <h3 className="font-bold text-amber-900 dark:text-amber-200 mb-2 flex items-center gap-2">
                    <span className="material-symbols-outlined text-lg">lock</span>
                    Anti-Spam Stake
                  </h3>
                  <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                    Organizers must deposit 0.05 SOL before creating an event. This is fully refunded when they withdraw after the event — it just ensures they have skin in the game.
                  </p>
                </div>
              </div>

              {/* Escrow flow diagram */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-5">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Escrow Flow</p>
                <div className="flex flex-col sm:flex-row items-center gap-3 text-sm">
                  {[
                    { label: "Organizer Stakes", sub: "0.05 SOL locked", icon: "lock" },
                    { label: "Buyers Pay", sub: "SOL → escrow", icon: "payments" },
                    { label: "Event Ends", sub: "time-based unlock", icon: "event_available" },
                    { label: "Organizer Withdraws", sub: "revenue + stake back", icon: "account_balance_wallet" },
                  ].map((item, i) => (
                    <div key={item.label} className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="size-10 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center mx-auto mb-1.5 shadow-sm">
                          <span className="material-symbols-outlined text-[#5048e5] text-lg">{item.icon}</span>
                        </div>
                        <p className="font-semibold text-slate-900 dark:text-white text-xs">{item.label}</p>
                        <p className="text-slate-500 text-[10px]">{item.sub}</p>
                      </div>
                      {i < 3 && (
                        <span className="material-symbols-outlined text-slate-400 hidden sm:block">arrow_forward</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <section id="ai-agent" className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 shadow-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-xl bg-linear-to-br from-[#5048e5] to-violet-500 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white">auto_awesome</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">AI Assistant</h2>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Powered by Google Gemini</p>
                </div>
              </div>

              <p className="text-slate-600 dark:text-slate-400 leading-relaxed mb-6">
                The floating button on every page opens an AI assistant that reads live on-chain data — with zero extra RPC calls. Data is pushed to the AI from whatever page you've already visited, so the AI knows about events, your tickets, and organizer revenue without making duplicate blockchain requests.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { q: "What events are available?", icon: "search" },
                  { q: "How much does a VIP ticket cost?", icon: "confirmation_number" },
                  { q: "What is my total event revenue?", icon: "analytics" },
                  { q: "Show my ticket status", icon: "qr_code" },
                  { q: "What is the escrow system?", icon: "help" },
                  { q: "Which events are selling out?", icon: "trending_up" },
                ].map((item) => (
                  <div key={item.q} className="flex items-center gap-3 px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                    <span className="material-symbols-outlined text-[#5048e5] text-lg shrink-0">{item.icon}</span>
                    <p className="text-sm text-slate-700 dark:text-slate-300 italic">"{item.q}"</p>
                  </div>
                ))}
              </div>
            </section>

            <section id="full-docs" className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <a
                href="/docs/technical"
                className="group p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#5048e5] transition-all shadow-sm hover:shadow-md"
              >
                <div className="size-12 rounded-xl bg-[#5048e5]/10 flex items-center justify-center mb-4 group-hover:bg-[#5048e5] transition-colors">
                  <span className="material-symbols-outlined text-[#5048e5] group-hover:text-white transition-colors">code</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">Technical Documentation</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Smart contract architecture, PDA structures, RPC caching strategy, API routes, and component deep-dives.
                </p>
                <p className="text-xs text-[#5048e5] font-semibold mt-3 flex items-center gap-1">
                  For developers
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </p>
              </a>

              <a
                href="/docs/guide"
                className="group p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 hover:border-[#5048e5] transition-all shadow-sm hover:shadow-md"
              >
                <div className="size-12 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-4 group-hover:bg-[#5048e5] transition-colors">
                  <span className="material-symbols-outlined text-violet-600 dark:text-violet-400 group-hover:text-white transition-colors">menu_book</span>
                </div>
                <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-1">User Guide</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Step-by-step guide for buyers, organizers, and validators. No technical background required.
                </p>
                <p className="text-xs text-[#5048e5] font-semibold mt-3 flex items-center gap-1">
                  For everyone
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </p>
              </a>
            </section>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}