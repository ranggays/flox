"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import ThemeToggle from "@/components/ThemeToggle";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import {
  extractAssistantActionLinks,
  extractAssistantActionLinksFromResult,
  extractAssistantStructuredResult,
  stripAssistantStructuredResult,
  type AssistantChatContext,
  type AssistantStructuredResult,
} from "@/lib/assistant";

const STORAGE_KEY = "flox-chat-home-orchestrator-messages";

const NAV_ITEMS = [
  {
    label: "AI Home",
    href: "/",
    description: "Start with AI-led guidance and route orchestration.",
    icon: "auto_awesome",
    current: true,
  },
  {
    label: "Discover",
    href: "/discover",
    description: "Browse the live event catalog directly.",
    icon: "travel_explore",
  },
  {
    label: "My Tickets",
    href: "/my-tickets",
    description: "Review owned tickets, status, and QR access.",
    icon: "confirmation_number",
  },
  {
    label: "Organizer",
    href: "/dashboard",
    description: "Check organizer performance and event operations.",
    icon: "dashboard",
  },
];

const STARTERS = [
  "Find the best events under 0.02 SOL",
  "Compare ticket tiers for an event before I buy",
  "Summarize my ticket status and tell me what to open next",
  "Give me an organizer performance snapshot",
];

const ORCHESTRATION_PILLARS = [
  {
    title: "Discover",
    description: "Find events by budget, category, or fit before opening the catalog.",
    href: "/discover",
    icon: "explore",
  },
  {
    title: "My Tickets",
    description: "Check ticket status, attendance state, and next actions in one place.",
    href: "/my-tickets",
    icon: "badge",
  },
  {
    title: "Organizer",
    description: "Jump into dashboard metrics and event operations when the assistant flags something.",
    href: "/dashboard",
    icon: "monitoring",
  },
];

interface AssistantMessage {
  content?: string;
  parts?: Array<{
    type: string;
    text?: string;
  }>;
}

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function getMessageText(msg: AssistantMessage): string {
  return msg.parts
    ? msg.parts
        .filter((part) => part.type === "text")
        .map((part) => part.text ?? "")
        .join("")
    : msg.content ?? "";
}

function StructuredResultCard({
  result,
}: {
  result: AssistantStructuredResult;
}) {
  if (result.type === "organizer_summary") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
          Organizer Summary
        </p>
        <h3 className="mt-2 text-base font-medium text-slate-900 dark:text-zinc-50">
          {result.title}
        </h3>
        {result.summary && (
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-zinc-300">
            {result.summary}
          </p>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {result.metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
                {metric.label}
              </p>
              <p className="mt-2 text-lg font-medium text-slate-900 dark:text-zinc-100">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (result.type === "ticket_summary") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
          Ticket Summary
        </p>
        <h3 className="mt-2 text-base font-medium text-slate-900 dark:text-zinc-50">
          {result.title}
        </h3>
        {result.summary && (
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-zinc-300">
            {result.summary}
          </p>
        )}
        <div className="mt-4 space-y-3">
          {result.items.map((item, index) => (
            <div
              key={`${item.ticketTitle}-${item.date}-${item.status}-${index}`}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                    {item.ticketTitle}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.15em] text-slate-400 dark:text-zinc-500">
                    {item.date}
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium uppercase text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {item.status}
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-zinc-300">
                {item.reason}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (result.type === "tier_comparison") {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
          Tier Comparison
        </p>
        <h3 className="mt-2 text-base font-medium text-slate-900 dark:text-zinc-50">
          {result.title}
        </h3>
        <p className="mt-1 text-sm font-medium text-slate-600 dark:text-zinc-300">
          {result.eventName}
        </p>
        {result.summary && (
          <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-zinc-300">
            {result.summary}
          </p>
        )}
        <div className="mt-4 space-y-3">
          {result.items.map((item) => (
            <div
              key={item.tierName}
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                    {item.tierName}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.15em] text-slate-400 dark:text-zinc-500">
                    {item.availabilityText}
                  </p>
                </div>
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  {item.priceSol} SOL
                </span>
              </div>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-zinc-300">
                {item.reason}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-slate-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
        Event Recommendations
      </p>
      <h3 className="mt-2 text-base font-medium text-slate-900 dark:text-zinc-50">
        {result.title}
      </h3>
      {result.summary && (
        <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-zinc-300">
          {result.summary}
        </p>
      )}
      <div className="mt-4 space-y-3">
        {result.items.map((item) => (
          <div
            key={`${item.eventId}-${item.href}`}
            className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-zinc-100">
                  {item.name}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.15em] text-slate-400 dark:text-zinc-500">
                  {item.location}
                </p>
              </div>
              {item.priceFromSol && (
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                  From {item.priceFromSol} SOL
                </span>
              )}
            </div>
            <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-zinc-300">
              {item.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function NavigationContent({
  connected,
  publicKey,
  walletName,
  balanceDisplay,
  onDisconnect,
  onNavigate,
}: {
  connected: boolean;
  publicKey: string | null;
  walletName: string | null;
  balanceDisplay: string;
  onDisconnect: () => void;
  onNavigate?: () => void;
}) {
  const address = publicKey ?? "";
  const initials = address ? address.slice(0, 2).toUpperCase() : "FL";

  return (
    <>
      <div className="border-b border-slate-200 p-4 dark:border-zinc-800/80">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-2 py-1"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#5048e5] text-white">
            <span className="material-symbols-outlined text-xl">airwave</span>
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900 dark:text-zinc-100">
              Flox
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              AI event concierge
            </p>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-3 px-2 text-[11px] uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
          Routes
        </div>
        <nav className="space-y-2">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onClick={onNavigate}
              className={`block rounded-2xl border px-4 py-3 transition ${
                item.current
                  ? "border-slate-900 bg-slate-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                  : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-zinc-800 dark:bg-[#171717] dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-[#1d1d1d]"
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-lg">
                  {item.icon}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p
                    className={`mt-1 text-xs leading-5 ${
                      item.current
                        ? "text-slate-200 dark:text-zinc-700"
                        : "text-slate-500 dark:text-zinc-400"
                    }`}
                  >
                    {item.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </nav>
      </div>

      <div className="border-t border-slate-200 p-3 dark:border-zinc-800/80">
        {!connected || !publicKey ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-[#171717]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-medium text-white dark:bg-zinc-700">
                F
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-zinc-100">
                  Flox
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
                  Connect a wallet for ticket and organizer context
                </p>
              </div>
            </div>
            <ConnectWalletButton className="w-full justify-center rounded-xl bg-[#5048e5] px-4 py-3 text-sm font-semibold text-white shadow-none" />
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-[#171717]">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[#5048e5] to-blue-400 text-sm font-bold text-white">
                  {initials}
                </div>
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-slate-50 bg-green-500 dark:border-[#171717]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
                  {walletName ?? "Wallet"}
                </p>
                <p className="truncate text-sm font-medium text-slate-900 dark:text-zinc-100">
                  {shortenAddress(address)}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-[#0f0f0f]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                  Balance
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  {balanceDisplay}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Link
                href="/my-tickets"
                onClick={onNavigate}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-center text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-[#212121] dark:hover:text-white"
              >
                My Tickets
              </Link>
              <button
                onClick={onDisconnect}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-[#212121] dark:hover:text-white"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function ChatHomePrototypePage() {
  const [input, setInput] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const restoredRef = useRef(false);
  const lastCountRef = useRef(0);
  const pendingRestoreCountRef = useRef<number | null>(null);
  const lastWalletKeyRef = useRef<string | null | undefined>(undefined);
  const { publicKey, connected, disconnect, wallet } = useWallet();
  const { connection } = useConnection();

  const { messages, sendMessage, setMessages, status } = useChat<UIMessage>({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "streaming" || status === "submitted";
  const walletAddress = publicKey?.toBase58() ?? null;
  const balanceDisplay = balance !== null ? `${balance.toFixed(4)} SOL` : "...";

  useEffect(() => {
    let cancelled = false;

    async function fetchBalance() {
      if (!publicKey) {
        setBalance(null);
        return;
      }

      try {
        const lamports = await connection.getBalance(publicKey);
        if (!cancelled) {
          setBalance(lamports / LAMPORTS_PER_SOL);
        }
      } catch {
        if (!cancelled) {
          setBalance(null);
        }
      }
    }

    fetchBalance();
    const interval = setInterval(fetchBalance, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [publicKey, connection]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) {
        restoredRef.current = true;
        return;
      }

      const parsed = JSON.parse(stored) as UIMessage[];
      pendingRestoreCountRef.current = parsed.length;
      setMessages(parsed);
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    } finally {
      restoredRef.current = true;
    }
  }, [setMessages]);

  useEffect(() => {
    const walletKey = publicKey?.toBase58() ?? null;

    if (lastWalletKeyRef.current === undefined) {
      lastWalletKeyRef.current = walletKey;
      return;
    }

    if (lastWalletKeyRef.current === walletKey) {
      return;
    }

    lastWalletKeyRef.current = walletKey;
    localStorage.removeItem(STORAGE_KEY);
    pendingRestoreCountRef.current = null;
    lastCountRef.current = 0;
    setMessages([]);
  }, [publicKey, setMessages]);

  useEffect(() => {
    if (!restoredRef.current) return;
    if (
      pendingRestoreCountRef.current !== null &&
      messages.length !== pendingRestoreCountRef.current
    ) {
      return;
    }

    pendingRestoreCountRef.current = null;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (!menuOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  useEffect(() => {
    const panel = scrollRef.current;
    if (!panel) return;

    const shouldAutoScroll =
      restoredRef.current &&
      (messages.length > lastCountRef.current || isLoading);

    if (!shouldAutoScroll) {
      lastCountRef.current = messages.length;
      return;
    }

    panel.scrollTo({
      top: panel.scrollHeight,
      behavior: lastCountRef.current === 0 ? "auto" : "smooth",
    });
    lastCountRef.current = messages.length;
  }, [messages.length, isLoading]);

  const handleSend = (text?: string) => {
    const content = text ?? input.trim();
    if (!content || isLoading) return;

    const workflowContext = [
      "Primary surface: AI orchestrator for Flox.",
      "Route destinations available: /discover, /my-tickets, /dashboard.",
      "Treat /discover as direct catalog browsing, /my-tickets as buyer workspace, and /dashboard as organizer workspace.",
      walletAddress
        ? "Wallet is connected, so organizer and ticket summary tools can be used when relevant."
        : "Wallet is not connected, so explain when wallet-specific summaries are unavailable.",
    ].join(" ");

    const context: AssistantChatContext = {
      route: "/",
      surface: "chat-home-orchestrator",
      walletPublicKey: walletAddress,
      workflowContext,
    };

    sendMessage(
      { text: content },
      {
        body: {
          context,
        },
      }
    );

    setInput("");
  };

  const clearConversation = () => {
    localStorage.removeItem(STORAGE_KEY);
    pendingRestoreCountRef.current = null;
    lastCountRef.current = 0;
    setMessages([]);
  };

  return (
    <main className="h-screen bg-[#f3f1eb] text-slate-900 dark:bg-[#121212] dark:text-zinc-100">
      <div className="flex h-full w-full overflow-hidden">
        <aside className="hidden h-full min-h-0 w-[320px] shrink-0 flex-col border-r border-slate-200 bg-[#fbfaf7] dark:border-zinc-800/80 dark:bg-[#101010] lg:flex">
          <NavigationContent
            connected={connected}
            publicKey={walletAddress}
            walletName={wallet?.adapter.name ?? null}
            balanceDisplay={balanceDisplay}
            onDisconnect={() => disconnect()}
          />
        </aside>

        <section className="relative flex h-full min-h-0 flex-1 flex-col bg-[#f3f1eb] dark:bg-[#121212]">
          <header className="flex items-center justify-between border-b border-slate-200 bg-[#fbfaf7] px-4 py-4 sm:px-6 lg:px-8 dark:border-zinc-800/80 dark:bg-[#121212]">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 lg:hidden dark:border-zinc-700 dark:bg-[#1d1d1d] dark:text-zinc-300"
              >
                <span className="material-symbols-outlined text-lg">menu</span>
              </button>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-zinc-500">
                  AI Home
                </p>
                <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
                  Flox AI Home
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="rounded-lg border border-slate-200 bg-white dark:border-zinc-700 dark:bg-[#1d1d1d]">
                <ThemeToggle />
              </div>
              {!connected && (
                <ConnectWalletButton className="rounded-lg bg-[var(--flox-primary)] px-3 py-2 text-sm font-semibold text-[var(--flox-primary-foreground)] shadow-none hover:opacity-90" />
              )}
              <button
                onClick={clearConversation}
                disabled={messages.length === 0}
                className="inline-flex h-10 items-center justify-center rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-700 dark:bg-[#1d1d1d] dark:text-zinc-300 dark:hover:bg-[#212121]"
              >
                Clear conversation
              </button>
            </div>
          </header>

          {menuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMenuOpen(false)}
                className="absolute inset-0 bg-slate-950/40"
              />
              <aside className="relative z-10 flex h-full w-[320px] max-w-[88vw] flex-col border-r border-slate-200 bg-[#fbfaf7] shadow-2xl dark:border-zinc-800 dark:bg-[#101010]">
                <NavigationContent
                  connected={connected}
                  publicKey={walletAddress}
                  walletName={wallet?.adapter.name ?? null}
                  balanceDisplay={balanceDisplay}
                  onDisconnect={() => {
                    setMenuOpen(false);
                    disconnect();
                  }}
                  onNavigate={() => setMenuOpen(false)}
                />
              </aside>
            </div>
          )}

          <section ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
            <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-8 sm:px-6 lg:px-8">
              <div className="mb-10 grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.9fr)]">
                <div className="rounded-[28px] border border-slate-200 bg-[#fbfaf7] p-6 shadow-[0_20px_50px_rgba(71,85,105,0.08)] dark:border-zinc-800 dark:bg-[#171717] dark:shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--flox-primary)]">
                    Main Surface
                  </p>
                  <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
                    Start with intent, then move into the right workspace.
                  </h2>
                  <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-zinc-300">
                    Use Flox AI to discover events, compare ticket options, inspect ticket status, or
                    review organizer performance. The assistant should decide with you first, then route
                    you into the page that fits the task.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    {STARTERS.map((starter) => (
                      <button
                        key={starter}
                        onClick={() => handleSend(starter)}
                        disabled={isLoading}
                        className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:bg-[#1d1d1d] dark:text-zinc-300 dark:hover:bg-[#242424] dark:hover:text-white"
                      >
                        {starter}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
                  {ORCHESTRATION_PILLARS.map((pillar) => (
                    <Link
                      key={pillar.title}
                      href={pillar.href}
                      className="rounded-[24px] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_36px_rgba(71,85,105,0.08)] dark:border-zinc-800 dark:bg-[#171717] dark:hover:border-zinc-700 dark:hover:shadow-[0_16px_36px_rgba(0,0,0,0.2)]"
                    >
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--flox-primary)] text-[var(--flox-primary-foreground)]">
                        <span className="material-symbols-outlined text-lg">
                          {pillar.icon}
                        </span>
                      </div>
                      <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-zinc-100">
                        {pillar.title}
                      </h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-zinc-300">
                        {pillar.description}
                      </p>
                    </Link>
                  ))}
                </div>
              </div>

              <div className="space-y-8">
                <div className="flex items-start gap-4">
                  <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--flox-primary)] text-xs font-semibold text-[var(--flox-primary-foreground)]">
                    AI
                  </div>
                  <div className="flex-1">
                    <div className="rounded-[24px] border border-slate-200 bg-[#fbfaf7] p-5 text-sm leading-6 text-slate-700 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-200">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--flox-primary)]">
                        AI Home
                      </p>
                      <h2 className="mt-2 text-xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
                        Decide first, then move into the right workspace.
                      </h2>
                      <p className="mt-3">
                        Use AI Home for budget-based event discovery, tier comparison before checkout,
                        wallet-aware ticket status, and organizer guidance that ends with the route to open next.
                      </p>
                      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]">
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-[#171717]">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
                            Best for
                          </p>
                          <p className="mt-2 text-sm text-slate-700 dark:text-zinc-200">
                            &ldquo;Show events under my budget&rdquo;, &ldquo;Compare tiers&rdquo;,
                            &ldquo;Explain what I should do next&rdquo;
                          </p>
                          <p className="mt-3 text-xs text-slate-500 dark:text-zinc-400">
                            {publicKey
                              ? "Wallet connected. Ticket and organizer summaries can use wallet-aware context."
                              : "Wallet not connected. Discovery still works, but ticket and organizer summaries stay limited."}
                          </p>
                        </div>
                        <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-zinc-700 dark:bg-[#171717]">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-zinc-400">
                            Quick routes
                          </p>
                          <div className="mt-3 space-y-2">
                            {ORCHESTRATION_PILLARS.map((pillar) => (
                              <Link
                                key={pillar.title}
                                href={pillar.href}
                                className="flex items-start gap-3 rounded-xl border border-slate-200 px-3 py-3 transition hover:bg-slate-50 dark:border-zinc-700 dark:hover:bg-[#202020]"
                              >
                                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[var(--flox-primary)] text-[var(--flox-primary-foreground)]">
                                  <span className="material-symbols-outlined text-sm">
                                    {pillar.icon}
                                  </span>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                                    {pillar.title}
                                  </p>
                                  <p className="mt-1 text-xs leading-5 text-slate-500 dark:text-zinc-400">
                                    {pillar.description}
                                  </p>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {messages.map((msg) => {
                  const rawText = getMessageText(msg);
                  const structuredResult =
                    msg.role === "assistant"
                      ? extractAssistantStructuredResult(rawText)
                      : null;
                  const visibleText =
                    msg.role === "assistant"
                      ? stripAssistantStructuredResult(rawText)
                      : rawText;
                  const actionLinks =
                    msg.role === "assistant"
                      ? [
                          ...extractAssistantActionLinksFromResult(structuredResult),
                          ...extractAssistantActionLinks(visibleText),
                        ].filter(
                          (action, index, arr) =>
                            arr.findIndex((candidate) => candidate.href === action.href) ===
                            index
                        )
                      : [];

                  if (msg.role === "user") {
                    return (
                      <div key={msg.id} className="flex justify-end">
                        <div className="max-w-[85%] rounded-3xl bg-slate-900 px-5 py-4 text-sm leading-7 text-white shadow-[0_16px_36px_rgba(15,23,42,0.18)] dark:bg-zinc-100 dark:text-zinc-900 dark:shadow-[0_16px_36px_rgba(0,0,0,0.18)]">
                          {visibleText}
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div key={msg.id} className="flex items-start gap-4">
                      <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--flox-primary)] text-xs font-semibold text-[var(--flox-primary-foreground)]">
                        AI
                      </div>
                      <div className="flex-1 text-sm leading-7 text-slate-700 dark:text-zinc-200">
                        {visibleText && (
                          <div className="whitespace-pre-wrap">{visibleText}</div>
                        )}
                        {structuredResult && (
                          <div className={visibleText ? "mt-4" : ""}>
                            <StructuredResultCard result={structuredResult} />
                          </div>
                        )}
                        {actionLinks.length > 0 && (
                          <div className="mt-4 flex flex-wrap gap-2">
                            {actionLinks.map((action) => (
                              <Link
                                key={`${msg.id}-${action.href}`}
                                href={action.href}
                                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-zinc-700 dark:bg-[#1d1d1d] dark:text-zinc-300 dark:hover:bg-[#262626] dark:hover:text-white"
                              >
                                <span className="material-symbols-outlined text-sm">
                                  arrow_outward
                                </span>
                                {action.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="flex items-start gap-4">
                    <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--flox-primary)] text-xs font-semibold text-[var(--flox-primary-foreground)]">
                      AI
                    </div>
                    <div className="flex items-center gap-1.5 rounded-2xl border border-slate-200 bg-white px-4 py-4 dark:border-zinc-700 dark:bg-[#1d1d1d]">
                      {[0, 160, 320].map((delay) => (
                        <span
                          key={delay}
                          className="size-2 animate-bounce rounded-full bg-slate-400 dark:bg-zinc-500"
                          style={{ animationDelay: `${delay}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          <div className="border-t border-slate-200 bg-white p-3 dark:border-zinc-700 dark:bg-[#1d1d1d] sm:p-4">
            <div className="mx-auto w-full max-w-5xl">
              <div className="mb-3 flex flex-wrap gap-2">
                {STARTERS.map((starter) => (
                  <button
                    key={starter}
                    onClick={() => handleSend(starter)}
                    disabled={isLoading}
                    className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-[#212121] dark:hover:text-zinc-200"
                  >
                    {starter}
                  </button>
                ))}
              </div>

              <div className="flex items-end gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-2.5 dark:border-zinc-700 dark:bg-[#111111]">
                <div className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--flox-primary-soft)] text-[var(--flox-primary)]">
                  <span className="material-symbols-outlined text-lg">forum</span>
                </div>
                <label className="block flex-1">
                  <span className="sr-only">Message input</span>
                  <textarea
                    rows={1}
                    value={input}
                    onChange={(event) => setInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" && !event.shiftKey) {
                        event.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={isLoading}
                    placeholder="Ask Flox what you want to do, then let it route you."
                    className="block max-h-40 min-h-[44px] w-full resize-none bg-transparent px-1 py-2 text-sm leading-6 text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-zinc-100 dark:placeholder:text-zinc-500"
                  />
                </label>
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim() || isLoading}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                >
                  <span className="material-symbols-outlined text-lg">north_east</span>
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
