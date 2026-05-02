"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAgentData } from "@/context/AgentDataContext";
import {
  ASSISTANT_SUGGESTIONS,
  ASSISTANT_WELCOME_MESSAGE,
  type AssistantChatContext,
  extractAssistantActionLinks,
  extractAssistantActionLinksFromResult,
  extractAssistantStructuredResult,
  stripAssistantStructuredResult,
  type AssistantStructuredResult,
  type AssistantPreferences,
} from "@/lib/assistant";

const DEFAULT_PREFS: AssistantPreferences = {
  categories: [],
  eventType: "all",
  language: "en",
};

const HOME_ASSISTANT_STORAGE_KEY = "flox-home-assistant-messages";

interface AssistantMessage {
  content?: string;
  parts?: Array<{
    type: string;
    text?: string;
  }>;
}

function getMessageText(msg: AssistantMessage): string {
  return msg.parts
    ? msg.parts
        .filter((p) => p.type === "text")
        .map((p) => p.text ?? "")
        .join("")
    : msg.content ?? "";
}

function StructuredResultCard({
  result,
}: {
  result: AssistantStructuredResult;
}) {
  if (result.type === "event_recommendations") {
    return (
      <div className="rounded-xl border border-[var(--flox-border)] bg-[var(--flox-surface)] p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          AI Picks
        </p>
        <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
          {result.title}
        </h3>
        {result.summary && (
          <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {result.summary}
          </p>
        )}
        <div className="mt-4 space-y-3">
          {result.items.map((item) => (
            <div
              key={`${item.eventId}-${item.href}`}
              className="rounded-xl border border-[var(--flox-border)] bg-[var(--flox-surface-muted)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {item.name}
                  </p>
                  <p className="mt-1 text-xs uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                    {item.location}
                  </p>
                </div>
                {item.priceFromSol && (
                  <div className="rounded-full border border-[var(--flox-border)] bg-[var(--flox-surface-muted)] px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                    From {item.priceFromSol} SOL
                  </div>
                )}
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {item.reason}
              </p>
              {item.availabilityText && (
                <p className="mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  {item.availabilityText}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (result.type === "tier_comparison") {
    return (
      <div className="rounded-xl border border-[var(--flox-border)] bg-[var(--flox-surface)] p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Tier Comparison
        </p>
        <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
          {result.title}
        </h3>
        <p className="mt-1 text-sm font-medium text-slate-700 dark:text-slate-200">
          {result.eventName}
        </p>
        {result.summary && (
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {result.summary}
          </p>
        )}
        <div className="mt-4 space-y-3">
          {result.items.map((item) => (
            <div
              key={item.tierName}
              className="rounded-xl border border-[var(--flox-border)] bg-[var(--flox-surface-muted)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">
                    {item.tierName}
                  </p>
                  <p className="mt-1 text-xs font-medium uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                    {item.availabilityText}
                  </p>
                </div>
                <div className="rounded-full border border-[var(--flox-border)] bg-[var(--flox-surface-muted)] px-3 py-1 text-xs font-medium text-slate-700 dark:text-slate-200">
                  {item.priceSol} SOL
                </div>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
                {item.reason}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (result.type === "organizer_summary") {
    return (
      <div className="rounded-xl border border-[var(--flox-border)] bg-[var(--flox-surface)] p-4">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
          Organizer Snapshot
        </p>
        <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
          {result.title}
        </h3>
        {result.summary && (
          <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
            {result.summary}
          </p>
        )}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {result.metrics.map((metric) => (
            <div
              key={metric.label}
              className="rounded-xl border border-[var(--flox-border)] bg-[var(--flox-surface-muted)] p-4"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                {metric.label}
              </p>
              <p className="mt-2 text-lg font-semibold text-slate-900 dark:text-white">
                {metric.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[var(--flox-border)] bg-[var(--flox-surface)] p-4">
      <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
        Ticket Summary
      </p>
      <h3 className="mt-2 text-base font-semibold text-slate-900 dark:text-white">
        {result.title}
      </h3>
      {result.summary && (
        <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
          {result.summary}
        </p>
      )}
      <div className="mt-4 space-y-3">
        {result.items.map((item, index) => (
          <div
            key={`${item.ticketTitle}-${item.date}-${item.status}-${index}`}
            className="rounded-xl border border-[var(--flox-border)] bg-[var(--flox-surface-muted)] p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">
                  {item.ticketTitle}
                </p>
                <p className="mt-1 text-xs uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">
                  {item.date}
                </p>
              </div>
              <div className="rounded-full border border-[var(--flox-border)] bg-[var(--flox-surface-muted)] px-3 py-1 text-xs font-medium uppercase text-slate-700 dark:text-slate-200">
                {item.status}
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">
              {item.reason}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function HomeAssistant() {
  const [localInput, setLocalInput] = useState("");
  const [prefs] = useState<AssistantPreferences>(DEFAULT_PREFS);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);
  const hasRestoredChatRef = useRef(false);
  const pendingRestoreCountRef = useRef<number | null>(null);

  const { publicKey } = useWallet();
  const { events } = useAgentData();

  const { messages, sendMessage, setMessages, status } = useChat<UIMessage>({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "streaming" || status === "submitted";
  const allMessages = [ASSISTANT_WELCOME_MESSAGE, ...messages];

  useEffect(() => {
    try {
      const stored = localStorage.getItem(HOME_ASSISTANT_STORAGE_KEY);
      if (!stored) {
        hasRestoredChatRef.current = true;
        return;
      }

      const parsed = JSON.parse(stored) as UIMessage[];
      pendingRestoreCountRef.current = parsed.length;
      setMessages(parsed);
    } catch {
      localStorage.removeItem(HOME_ASSISTANT_STORAGE_KEY);
    } finally {
      hasRestoredChatRef.current = true;
    }
  }, [setMessages]);

  useEffect(() => {
    if (!hasRestoredChatRef.current) return;
    if (
      pendingRestoreCountRef.current !== null &&
      messages.length !== pendingRestoreCountRef.current
    ) {
      return;
    }

    pendingRestoreCountRef.current = null;
    localStorage.setItem(HOME_ASSISTANT_STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    const panel = chatScrollRef.current;
    if (!panel) return;

    const shouldAutoScroll =
      hasRestoredChatRef.current &&
      (messages.length > lastMessageCountRef.current || isLoading);

    if (!shouldAutoScroll) {
      lastMessageCountRef.current = messages.length;
      return;
    }

    panel.scrollTo({
      top: panel.scrollHeight,
      behavior: lastMessageCountRef.current === 0 ? "auto" : "smooth",
    });
    lastMessageCountRef.current = messages.length;
  }, [messages.length, isLoading]);

  const handleSend = (text?: string) => {
    const content = text ?? localInput.trim();
    if (!content || isLoading) return;

    const context: AssistantChatContext = {
      route: "/",
      surface: "home-assistant",
      walletPublicKey: publicKey?.toBase58() ?? null,
      prefs,
    };

    sendMessage(
      { text: content },
      {
        body: {
          context,
        },
      }
    );

    setLocalInput("");
  };

  const clearConversation = () => {
    localStorage.removeItem(HOME_ASSISTANT_STORAGE_KEY);
    pendingRestoreCountRef.current = null;
    lastMessageCountRef.current = 0;
    setMessages([]);
  };

  return (
    <section className="relative overflow-hidden py-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-6">
        <div className="space-y-3 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[var(--flox-border)] bg-[var(--flox-surface)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
            <span className="size-1.5 rounded-full bg-slate-400" />
            Flox AI
          </div>
          <h2 className="text-balance text-center text-[29px] font-semibold tracking-tighter text-slate-900 sm:text-[32px] md:text-[42px] dark:text-white">
            Prompt. Refine. Explore.
          </h2>
          <p className="mx-auto max-w-2xl text-balance text-base text-slate-500 dark:text-slate-400">
            Search events, compare ticket tiers, and get routed to the right page without leaving the current flow.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
            <span className="rounded-full border border-[var(--flox-border)] bg-[var(--flox-surface)] px-3 py-1.5">
              {events.length} events loaded
            </span>
            <span className="rounded-full border border-[var(--flox-border)] bg-[var(--flox-surface)] px-3 py-1.5">
              {publicKey ? "Wallet context on" : "Wallet optional"}
            </span>
            <span className="rounded-full border border-[var(--flox-border)] bg-[var(--flox-surface)] px-3 py-1.5">
              {messages.length > 0 ? `${messages.length} saved messages` : "New conversation"}
            </span>
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-[var(--flox-border)] bg-[var(--flox-surface)] shadow-sm">
          <div
            ref={chatScrollRef}
            className="h-[34rem] overflow-y-auto px-4 py-4 sm:px-5"
          >
            <div className="space-y-4">
              {allMessages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--flox-border)] bg-[var(--flox-surface)] text-slate-500 dark:text-slate-400">
                      <span className="material-symbols-outlined text-sm">auto_awesome</span>
                    </div>
                  )}
                  {(() => {
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
                              arr.findIndex((candidate) => candidate.href === action.href) === index
                          )
                        : [];

                    return (
                      <div className={`flex max-w-[92%] min-w-0 flex-col gap-2 ${msg.role === "user" ? "items-end" : "items-start"}`}>
                        <div
                          className={`min-w-0 rounded-2xl px-4 py-3 text-sm leading-7 whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${
                            msg.role === "user"
                              ? "rounded-tr-md bg-[var(--flox-primary)] text-[var(--flox-primary-foreground)]"
                              : "rounded-tl-md border border-[var(--flox-border)] bg-[var(--flox-surface)] text-slate-700 dark:text-slate-200"
                          }`}
                        >
                          {visibleText}
                        </div>
                        {msg.role === "assistant" && structuredResult && (
                          <StructuredResultCard result={structuredResult} />
                        )}
                        {msg.role === "assistant" && actionLinks.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {actionLinks.map((action) => (
                              <Link
                                key={`${msg.id}-${action.href}`}
                                href={action.href}
                                className="inline-flex items-center gap-2 rounded-full border border-[var(--flox-border)] bg-[var(--flox-surface)] px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-[var(--flox-surface-muted)] dark:text-slate-300"
                              >
                                <span className="material-symbols-outlined text-sm">arrow_outward</span>
                                {action.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3">
                  <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--flox-border)] bg-[var(--flox-surface)] text-slate-500 dark:text-slate-400">
                    <span className="material-symbols-outlined text-sm">auto_awesome</span>
                  </div>
                    <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-[var(--flox-border)] bg-[var(--flox-surface)] px-4 py-4">
                    {[0, 160, 320].map((delay) => (
                      <span
                        key={delay}
                        className="size-2 rounded-full bg-slate-400 animate-bounce"
                        style={{ animationDelay: `${delay}ms` }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-[var(--flox-border)] p-3 sm:p-4">
            <div className="rounded-xl border border-[var(--flox-border)] p-2 transition-colors focus-within:border-slate-400">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                {ASSISTANT_SUGGESTIONS.map((suggestion) => (
                  <button
                    key={suggestion}
                    onClick={() => handleSend(suggestion)}
                    disabled={isLoading}
                    className="rounded-full border border-[var(--flox-border)] bg-[var(--flox-surface)] px-3 py-1.5 text-xs font-medium text-slate-600 transition-colors hover:bg-[var(--flox-surface-muted)] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
              <div className="flex items-end gap-2">
                <textarea
                  value={localInput}
                  onChange={(e) => setLocalInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={isLoading}
                  rows={1}
                  placeholder="Ask Flox AI to find, compare, or explain events..."
                  className="max-h-40 min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={clearConversation}
                    disabled={messages.length === 0}
                    className="rounded-md border border-[var(--flox-border)] px-3 py-2 text-xs font-medium text-slate-500 transition-colors hover:bg-[var(--flox-surface-muted)] hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:text-slate-200"
                  >
                    Clear
                  </button>
                  <button
                    onClick={() => handleSend()}
                    disabled={!localInput.trim() || isLoading}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-900 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-slate-100 dark:text-slate-900"
                  >
                    <span className="material-symbols-outlined text-base">arrow_upward</span>
                  </button>
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              AI can guide you, but ticket purchase still happens on the event page.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
