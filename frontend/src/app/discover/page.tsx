"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import EventGrid from "@/components/EventGrid";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";
import { PROGRAM_ID } from "@/lib/program";
import { getConnection } from "@/lib/rpc";
import {
  getCachedEvents,
  setCachedEvents,
  type BlockchainEvent,
} from "@/lib/eventCache";
import idl from "@/lib/idl/locketing_contract.json";
import { useAgentData } from "@/context/AgentDataContext";
import { getCategoryKey } from "@/lib/utils";
import { cachedFetch } from "@/lib/programCache";

type NumberLike = number | { toNumber(): number } | null | undefined;
type AddressLike = { toBase58(): string } | null | undefined;
type EnumLike = Record<string, unknown>;

interface RawEventAccountData {
  eventId: { toString(): string };
  name: string;
  description: string;
  organizer: AddressLike;
  location: string;
  startTime: { toNumber(): number };
  endTime: { toNumber(): number };
  imageUri?: string;
  status: EnumLike;
  category: EnumLike;
  eventType: EnumLike;
  ticketsSold?: NumberLike;
  totalRevenue?: NumberLike;
}

interface RawTierAccountData {
  event?: AddressLike;
  eventAccount?: AddressLike;
  eventPubkey?: AddressLike;
  price: NumberLike;
  maxSupply: NumberLike;
  sold: NumberLike;
  name: string;
}

interface RawProgramAccount<T> {
  publicKey: { toBase58(): string };
  account: T;
}

interface DiscoverProgram {
  account: {
    eventAccount: {
      all(): Promise<Array<RawProgramAccount<RawEventAccountData>>>;
    };
    ticketTierAccount: {
      all(): Promise<Array<RawProgramAccount<RawTierAccountData>>>;
    };
  };
}

function toNumber(value: NumberLike): number {
  return typeof value === "number" ? value : value?.toNumber() ?? 0;
}

function isVirtualEvent(eventType: EnumLike | undefined): boolean {
  return Boolean(eventType?.virtual);
}

function toBase58(value: AddressLike): string {
  return value?.toBase58() ?? "";
}

function toAgentEvent(ev: BlockchainEvent) {
  return {
    id: ev.id,
    name: ev.name,
    description: ev.description,
    location: ev.location,
    category: getCategoryKey(ev.category),
    type: isVirtualEvent(ev.eventType) ? "Virtual" : "Physical",
    status: getCategoryKey(ev.status),
    startTime: ev.startTime,
    endTime: ev.endTime,
    revenue: ev.revenue,
    sold: ev.sold,
    available: ev.available,
    pda: ev.organizer,
    tiers: ev.tiers,
  };
}

async function fetchWithRetry<T>(
  fn: () => Promise<T>,
  retries = 3,
  delayMs = 1500
): Promise<T> {
  try {
    return await fn();
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    const isRateLimit =
      msg.includes("429") ||
      msg.includes("Too Many Requests") ||
      msg.includes("rate limit");
    if (retries > 0 && isRateLimit) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      return fetchWithRetry(fn, retries - 1, delayMs * 2);
    }
    throw err;
  }
}

function enumKey(val: Record<string, unknown>): string {
  return val ? Object.keys(val)[0] : "unknown";
}

export default function DiscoverPage() {
  const [events, setEvents] = useState<BlockchainEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { pushEvents } = useAgentData();

  const fetchEvents = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = getCachedEvents();
      if (cached) {
        setEvents(cached);
        setLoading(false);
        pushEvents(cached.map(toAgentEvent));
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const connection = getConnection();
      const provider = new AnchorProvider(
        connection,
        {
          publicKey: null as unknown as import("@solana/web3.js").PublicKey,
          signTransaction: async (tx) => tx,
          signAllTransactions: async (txs) => txs,
        },
        { commitment: "confirmed" }
      );

      const program = new Program(
        { ...idl, address: PROGRAM_ID.toBase58() } as Idl,
        provider
      ) as unknown as DiscoverProgram;

      const [rawEvents, rawTiers] = await fetchWithRetry(() =>
        Promise.all([
          cachedFetch<Array<RawProgramAccount<RawEventAccountData>>>("eventAccount", () =>
            program.account.eventAccount.all()
          ),
          cachedFetch<Array<RawProgramAccount<RawTierAccountData>>>("ticketTierAccount", () =>
            program.account.ticketTierAccount.all()
          ),
        ])
      );

      const formatted: BlockchainEvent[] = rawEvents
        .filter((evt) => enumKey(evt.account.status) === "active")
        .map((evt) => {
          const data = evt.account;
          const eventPDA = evt.publicKey.toBase58();

          const eventTiers = rawTiers.filter((tier) => {
            const addr =
              tier.account.event ??
              tier.account.eventAccount ??
              tier.account.eventPubkey;
            return addr?.toBase58() === eventPDA;
          });

          const totalCapacity = eventTiers.reduce((acc: number, tier) => {
            const supply = tier.account.maxSupply;
            return acc + toNumber(supply);
          }, 0);

          const sold = toNumber(data.ticketsSold);

          const lowestPriceLamports = eventTiers.reduce((min: number, tier) => {
            const price = tier.account.price;
            const lamports = toNumber(price);
            return lamports < min ? lamports : min;
          }, Infinity);

          const tiers = eventTiers
            .map((tier) => {
              const priceLamports = toNumber(tier.account.price);
              const maxSupply = toNumber(tier.account.maxSupply);
              const soldCount = toNumber(tier.account.sold);

              return {
                id: tier.publicKey.toBase58(),
                name: tier.account.name,
                priceSol: (priceLamports / 1_000_000_000).toFixed(3),
                available: Math.max(0, maxSupply - soldCount),
                maxSupply,
              };
            })
            .sort((a, b) => parseFloat(a.priceSol) - parseFloat(b.priceSol));

          return {
            id: data.eventId.toString(),
            name: data.name,
            description: data.description,
            organizer: toBase58(data.organizer),
            location: data.location,
            startTime: data.startTime.toNumber(),
            endTime: data.endTime.toNumber(),
            imageUri:
              data.imageUri?.startsWith("http")
                ? data.imageUri
                : "https://placehold.co/600x400/1e293b/ffffff?text=" +
                  encodeURIComponent(data.name || "Event"),
            status: data.status,
            category: data.category,
            eventType: data.eventType,
            sold,
            available: Math.max(0, totalCapacity - sold),
            revenue: (toNumber(data.totalRevenue) / 1_000_000_000).toFixed(3),
            lowestPriceSol:
              lowestPriceLamports === Infinity
                ? "0"
                : (lowestPriceLamports / 1_000_000_000).toFixed(3),
            tiers,
          };
        })
        .sort((a: BlockchainEvent, b: BlockchainEvent) => b.startTime - a.startTime);

      setCachedEvents(formatted);
      setEvents(formatted);
      pushEvents(formatted.map(toAgentEvent));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error("Failed to fetch events:", msg);
      const stale = getCachedEvents();
      if (stale) {
        setEvents(stale);
        setError("Data may be stale — failed to refresh from blockchain.");
      } else {
        setError("Failed to load events from Solana. Try refreshing the page.");
      }
    } finally {
      setLoading(false);
    }
  }, [pushEvents]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void fetchEvents();
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [fetchEvents]);

  return (
    <WorkspaceShell
      eyebrow="Discover Workspace"
      title="Browse live events directly"
      description="Use this page when you already know you want the visual catalog. AI Home is the main decision surface, and this workspace handles direct exploration."
      contentClassName="mx-auto flex w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8"
      headerActions={
        <Link href="/app" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
          <span className="material-symbols-outlined text-base">auto_awesome</span>
          Back to AI Home
        </Link>
      }
    >
      <section className="mb-8 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
        <div className="rounded-[28px] border border-slate-200 bg-[#fbfaf7] p-6 shadow-[0_20px_50px_rgba(71,85,105,0.08)] dark:border-zinc-800 dark:bg-[#171717] dark:shadow-[0_24px_60px_rgba(0,0,0,0.22)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--flox-primary)]">
            Direct Catalog
          </p>
          <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
            Browse first when your intent is already clear.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-600 dark:text-zinc-300">
            This workspace is for visual exploration of the live event catalog. Use AI Home when you
            still need help narrowing options by budget, fit, ticket strategy, or the best next route.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#171717]">
            <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              Active catalog
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-zinc-300">
              {loading
                ? "Syncing the current on-chain event set."
                : `${events.length} active event${events.length !== 1 ? "s" : ""} available to browse right now.`}
            </p>
          </div>
          <div className="rounded-[24px] border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#171717]">
            <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
              AI handoff
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-zinc-300">
              If the catalog is too broad, jump back to AI Home and ask for filtered recommendations
              before opening an event.
            </p>
          </div>
        </div>
      </section>

      {error && (
        <div className="mb-8 px-5 py-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3 text-sm text-amber-700 dark:text-amber-400">
          <span className="material-symbols-outlined text-base shrink-0">warning</span>
          <span className="flex-1">{error}</span>
          <button
            onClick={() => fetchEvents(true)}
            className="underline font-semibold shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      <EventGrid events={events} loading={loading} onRefresh={() => fetchEvents(true)} />
    </WorkspaceShell>
  );
}
