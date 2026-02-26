"use client";

import { useEffect, useState, useCallback } from "react";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import EventGrid from "@/components/EventGrid";
import FeaturesSection from "@/components/FeatureSection";
import Footer from "@/components/Footer";
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
      await new Promise((r) => setTimeout(r, delayMs));
      return fetchWithRetry(fn, retries - 1, delayMs * 2);
    }
    throw err;
  }
}

function enumKey(val: Record<string, unknown>): string {
  return val ? Object.keys(val)[0] : "unknown";
}

export default function Home() {
  const [events,  setEvents]  = useState<BlockchainEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const { pushEvents } = useAgentData();

  const fetchEvents = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh) {
      const cached = getCachedEvents();
      if (cached) {
        setEvents(cached);
        setLoading(false);
        pushEvents(cached.map(ev => ({
          id:        ev.id,
          name:      ev.name,
          location:  ev.location,
          category:  getCategoryKey(ev.category),
          type:      (ev.eventType as any)?.virtual ? "Virtual" : "Physical",
          status:    getCategoryKey(ev.status as any),
          startTime: ev.startTime,
          endTime:   ev.endTime,
          revenue:   ev.revenue,
          sold:      ev.sold,
          available: ev.available,
          pda:       ev.organizer,
          tiers:     [],
        })));
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      const connection = getConnection();
      const provider   = new AnchorProvider(
        connection,
        {
          publicKey:           null as unknown as import("@solana/web3.js").PublicKey,
          signTransaction:     async (tx) => tx,
          signAllTransactions: async (txs) => txs,
        },
        { commitment: "confirmed" }
      );

      const program = new Program(
        { ...idl, address: PROGRAM_ID.toBase58() } as Idl,
        provider
      );

      const [rawEvents, rawTiers] = await fetchWithRetry(() =>
        Promise.all([
          cachedFetch<any[]>("eventAccount",      () => (program as any).account.eventAccount.all()),
          cachedFetch<any[]>("ticketTierAccount", () => (program as any).account.ticketTierAccount.all()),
        ])
      );

      const formatted: BlockchainEvent[] = rawEvents
        .filter((evt: any) => enumKey(evt.account.status) === "active")
        .map((evt: any) => {
          const data     = evt.account;
          const eventPDA = evt.publicKey.toBase58();

          const eventTiers = rawTiers.filter((tier: any) => {
            const addr =
              tier.account.event ??
              tier.account.eventAccount ??
              tier.account.eventPubkey;
            return addr?.toBase58() === eventPDA;
          });

          const totalCapacity = eventTiers.reduce((acc: number, tier: any) => {
            const s = tier.account.maxSupply;
            return acc + (typeof s === "number" ? s : s?.toNumber?.() ?? 0);
          }, 0);

          const sold = data.ticketsSold
            ? typeof data.ticketsSold === "number"
              ? data.ticketsSold
              : data.ticketsSold.toNumber()
            : 0;

          const lowestPriceLamports = eventTiers.reduce(
            (min: number, tier: any) => {
              const p       = tier.account.price;
              const lamports = typeof p === "number" ? p : p?.toNumber?.() ?? 0;
              return lamports < min ? lamports : min;
            },
            Infinity
          );
          const lowestPriceSol =
            lowestPriceLamports === Infinity
              ? "0"
              : (lowestPriceLamports / 1_000_000_000).toFixed(3);

          return {
            id:       data.eventId.toString(),
            name:     data.name,
            organizer: data.organizer.toBase58(),
            location: data.location,
            startTime: data.startTime.toNumber(),
            endTime:   data.endTime.toNumber(),
            imageUri:
              data.imageUri?.startsWith("http")
                ? data.imageUri
                : "https://placehold.co/600x400/1e293b/ffffff?text=" +
                  encodeURIComponent(data.name || "Event"),
            status:        data.status,
            category:      data.category,
            eventType:     data.eventType,
            sold,
            available:     Math.max(0, totalCapacity - sold),
            revenue:       ((data.totalRevenue?.toNumber?.() ?? 0) / 1_000_000_000).toFixed(3),
            lowestPriceSol,
          };
        })
        .sort(
          (a: BlockchainEvent, b: BlockchainEvent) => b.startTime - a.startTime
        );

      setCachedEvents(formatted);
      setEvents(formatted);
      pushEvents(formatted.map(ev => ({
        id:        ev.id,
        name:      ev.name,
        location:  ev.location,
        category:  getCategoryKey(ev.category),
        type:      (ev.eventType as any)?.virtual ? "Virtual" : "Physical",
        status:    getCategoryKey(ev.status as any),
        startTime: ev.startTime,
        endTime:   ev.endTime,
        revenue:   ev.revenue,
        sold:      ev.sold,
        available: ev.available,
        pda:       ev.organizer,
        tiers:     [],
      })));
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
    fetchEvents();
  }, [fetchEvents]);

  return (
    <div className="min-h-screen bg-[#f6f6f8] dark:bg-black text-slate-900 dark:text-white transition-colors">
      <Header />

      <main>
        <HeroSection events={events} />

        {/* Error banner */}
        {error && (
          <div className="container mx-auto px-6 max-w-7xl pt-8">
            <div className="px-5 py-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl flex items-center gap-3 text-sm text-amber-700 dark:text-amber-400">
              <span className="material-symbols-outlined text-base shrink-0">warning</span>
              <span className="flex-1">{error}</span>
              <button
                onClick={() => fetchEvents(true)}
                className="underline font-semibold shrink-0"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        <EventGrid events={events} loading={loading} onRefresh={() => fetchEvents(true)} />

        <FeaturesSection />
      </main>

      <Footer />
    </div>
  );
}