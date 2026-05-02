"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { UIMessage } from "ai";
import { DefaultChatTransport } from "ai";
import { useChat } from "@ai-sdk/react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  type AssistantChatContext,
  extractAssistantActionLinks,
  extractAssistantActionLinksFromResult,
  extractAssistantStructuredResult,
  stripAssistantStructuredResult,
  type AssistantPreferences,
  type AssistantStructuredResult,
} from "@/lib/assistant";

const DEFAULT_PREFS: AssistantPreferences = {
  categories: [],
  eventType: "all",
  language: "en",
};

interface AssistantMessage {
  content?: string;
  parts?: Array<{
    type: string;
    text?: string;
  }>;
}

interface WorkflowAssistantProps {
  eyebrow: string;
  title: string;
  description: string;
  suggestions: string[];
  route: string;
  surface: string;
  workflowContext: string;
  placeholder: string;
  emptyState: string;
  className?: string;
  eventId?: string;
  tierId?: string;
  prefs?: AssistantPreferences;
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

export default function WorkflowAssistant({
  eyebrow,
  title,
  description,
  suggestions,
  route,
  surface,
  workflowContext,
  placeholder,
  emptyState,
  className,
  eventId,
  tierId,
  prefs = DEFAULT_PREFS,
}: WorkflowAssistantProps) {
  const [localInput, setLocalInput] = useState("");
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const lastMessageCountRef = useRef(0);
  const { publicKey } = useWallet();
  const { messages, sendMessage, status } = useChat<UIMessage>({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading = status === "streaming" || status === "submitted";

  const handleSend = (text?: string) => {
    const content = text ?? localInput.trim();
    if (!content || isLoading) return;

    const context: AssistantChatContext = {
      route,
      surface,
      walletPublicKey: publicKey?.toBase58() ?? null,
      eventId,
      tierId,
      workflowContext,
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

  useEffect(() => {
    const panel = chatScrollRef.current;
    if (!panel) return;

    const shouldAutoScroll =
      messages.length > lastMessageCountRef.current || isLoading;

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

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-[var(--flox-border)] bg-[var(--flox-surface)] shadow-sm ${className ?? ""}`}
    >
      <div className="flex h-[30rem] min-h-0 flex-col lg:h-[32rem]">
        <div className="border-b border-[var(--flox-border)] px-5 py-5">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--flox-border)] bg-[var(--flox-surface)] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">
              <span className="size-1.5 rounded-full bg-[var(--flox-primary)]" />
              {eyebrow}
            </div>
            <div>
              <h3 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                {title}
              </h3>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-400">
                {description}
              </p>
              <p className="mt-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
                Context-bound to this page
              </p>
            </div>
          </div>
        </div>

        <div
          ref={chatScrollRef}
          className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5"
        >
          <div className="space-y-4">
            {messages.length === 0 ? (
              <div className="rounded-xl border border-dashed border-[var(--flox-border)] bg-[var(--flox-surface-muted)] px-4 py-5 text-sm leading-6 text-slate-500 dark:text-slate-400">
                {emptyState}
              </div>
            ) : (
              messages.map((msg) => {
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

                return (
                  <div
                    key={msg.id}
                    className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
                  >
                    {msg.role === "assistant" && (
                      <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--flox-border)] bg-[var(--flox-surface)] text-slate-500 dark:text-slate-400">
                        <span className="material-symbols-outlined text-sm">
                          auto_awesome
                        </span>
                      </div>
                    )}
                    <div
                      className={`flex min-w-0 max-w-[92%] flex-col gap-2 ${
                        msg.role === "user" ? "items-end" : "items-start"
                      }`}
                    >
                      <div
                        className={`min-w-0 rounded-3xl px-4 py-3 text-sm leading-7 whitespace-pre-wrap break-words [overflow-wrap:anywhere] ${
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
              })
            )}

            {isLoading && (
              <div className="flex gap-3">
                <div className="mt-1 flex size-8 shrink-0 items-center justify-center rounded-full border border-[var(--flox-border)] bg-[var(--flox-surface)] text-slate-500 dark:text-slate-400">
                  <span className="material-symbols-outlined text-sm">auto_awesome</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md border border-[var(--flox-border)] bg-[var(--flox-surface)] px-4 py-4">
                  {[0, 160, 320].map((delay) => (
                    <span
                      key={delay}
                      className="size-2 animate-bounce rounded-full bg-slate-400"
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
            <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">
              Quick tasks
            </p>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {suggestions.map((suggestion) => (
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
                placeholder={placeholder}
                className="max-h-32 min-h-12 flex-1 resize-none bg-transparent px-2 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-400 dark:text-slate-100"
              />
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
      </div>
    </section>
  );
}
