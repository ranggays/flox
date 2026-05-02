import Link from "next/link";
import { notFound } from "next/navigation";
import { Connection, PublicKey } from "@solana/web3.js";
import { AnchorProvider, Program, Idl } from "@coral-xyz/anchor";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeroBanner from "@/components/event-detail/HeroBanner";
import AboutSection from "@/components/event-detail/AboutSection";
import TicketsSection from "@/components/event-detail/TicketsSection";
import type { EventDetail, TicketTier } from "@/lib/types";
import { PROGRAM_ID } from "@/lib/program";
import idl from "@/lib/idl/locketing_contract.json";
const { cachedFetch } = await import("@/lib/programCache");

interface PageProps {
  params: Promise<{ id: string }>;
}

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
  ticketsSold?: NumberLike;
}

interface RawTierAccountData {
  tierIndex?: number;
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

interface ReadonlyProgram {
  account: {
    eventAccount: {
      all(): Promise<Array<RawProgramAccount<RawEventAccountData>>>;
    };
    ticketTierAccount: {
      all(): Promise<Array<RawProgramAccount<RawTierAccountData>>>;
    };
  };
}

function getReadonlyProgram(): ReadonlyProgram {
  const rpc = process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";
  const connection = new Connection(rpc, "confirmed");
  const provider = new AnchorProvider(
    connection,
    {
      publicKey: PublicKey.default,
      signTransaction: async (tx) => tx,
      signAllTransactions: async (txs) => txs,
    },
    { commitment: "confirmed" }
  );
  return new Program(
    { ...idl, address: PROGRAM_ID.toBase58() } as Idl,
    provider
  ) as unknown as ReadonlyProgram;
}

function enumKey(val: Record<string, unknown>): string {
  return val ? Object.keys(val)[0] : "unknown";
}

function toNumber(value: NumberLike): number {
  return typeof value === "number" ? value : value?.toNumber() ?? 0;
}

function toBase58(value: AddressLike): string {
  return value?.toBase58() ?? "";
}

function formatDateRange(startTs: number, endTs: number): string {
  const start = new Date(startTs * 1000);
  const end = new Date(endTs * 1000);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  if (start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString("en-US", opts);
  }
  return `${start.toLocaleDateString("en-US", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("en-US", opts)}`;
}

function formatTime(startTs: number, endTs: number): string {
  const fmt = (ts: number) =>
    new Date(ts * 1000).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  return `${fmt(startTs)} - ${fmt(endTs)}`;
}

function getStatus(account: RawEventAccountData): string {
  const now = Math.floor(Date.now() / 1000);
  if (enumKey(account.status) === "cancelled") return "Cancelled";
  if (now < account.startTime.toNumber()) return "Upcoming";
  if (now <= account.endTime.toNumber()) return "On Sale";
  return "Ended";
}

function buildTicketTiers(
  eventPda: string,
  rawTiers: Array<RawProgramAccount<RawTierAccountData>>
): TicketTier[] {
  const tierFeatures: string[][] = [
    ["Priority Entry", "Exclusive Lounge Access", "Meet & Greet Inclusion", "Front Row Area"],
    ["All Area Access", "Community Discord Access", "Digital Certificate"],
    ["General Admission", "Public Event Access"],
  ];
  const tierBadges = ["Exclusive", "Popular", ""];
  const tierUrgency = ["Selling fast!", "", ""];

  return rawTiers
    .filter((tier) => {
      const addr = tier.account.event ?? tier.account.eventAccount ?? tier.account.eventPubkey;
      return addr?.toBase58() === eventPda;
    })
    .sort((a, b) => (a.account.tierIndex ?? 0) - (b.account.tierIndex ?? 0))
    .map((tier) => {
      const idx = tier.account.tierIndex ?? 0;
      const priceLamports = toNumber(tier.account.price);
      const maxSupply = toNumber(tier.account.maxSupply);
      const sold = toNumber(tier.account.sold);
      const remaining = maxSupply - sold;
      const soldPct = maxSupply > 0 ? sold / maxSupply : 0;

      return {
        id: tier.publicKey.toBase58(),
        name: tier.account.name,
        price: (priceLamports / 1_000_000_000).toFixed(3),
        currency: "SOL",
        features: tierFeatures[Math.min(idx, tierFeatures.length - 1)],
        sold,
        total: maxSupply,
        highlighted: idx === 0,
        badge: tierBadges[Math.min(idx, tierBadges.length - 1)] || undefined,
        urgency:
          remaining < maxSupply * 0.2 && remaining > 0
            ? `Only ${remaining} left!`
            : soldPct > 0.5 && tierUrgency[Math.min(idx, tierUrgency.length - 1)]
              ? tierUrgency[Math.min(idx, tierUrgency.length - 1)]
              : undefined,
      };
    });
}

async function loadEventDetail(id: string): Promise<EventDetail | null> {
  try {
    const program = getReadonlyProgram();
    const [rawEvents, rawTiers] = await Promise.all([
      cachedFetch<Array<RawProgramAccount<RawEventAccountData>>>("eventAccount", () =>
        program.account.eventAccount.all()
      ),
      cachedFetch<Array<RawProgramAccount<RawTierAccountData>>>("ticketTierAccount", () =>
        program.account.ticketTierAccount.all()
      ),
    ]);

    const match = rawEvents.find((eventAccount) => eventAccount.account.eventId.toString() === id);
    if (!match) return null;

    const data = match.account;
    const eventPda = match.publicKey.toBase58();
    const startTs = data.startTime.toNumber();
    const endTs = data.endTime.toNumber();
    const organizer = toBase58(data.organizer);
    const tickets = buildTicketTiers(eventPda, rawTiers);

    return {
      id: Number.parseInt(id, 10),
      title: data.name,
      status: getStatus(data),
      dateRange: formatDateRange(startTs, endTs),
      time: formatTime(startTs, endTs),
      location: data.location,
      heroImageUrl: data.imageUri?.startsWith("http")
        ? data.imageUri
        : `https://placehold.co/1200x500/1e293b/ffffff?text=${encodeURIComponent(data.name)}`,
      heroImageAlt: `${data.name} banner`,
      description: data.description ? [data.description] : ["No description provided."],
      features: [
        {
          icon: "lock",
          title: "Secure Escrow",
          description: "Ticket payments are held in on-chain escrow and released to the organizer after the event.",
        },
        {
          icon: "qr_code_2",
          title: "On-Chain Verified",
          description: "Each ticket is a unique on-chain account. Validate instantly at the venue with a QR scan.",
        },
      ],
      host: {
        initial: organizer.slice(0, 2).toUpperCase(),
        name: `${organizer.slice(0, 6)}...${organizer.slice(-4)}`,
        subtitle: "Verified Organizer on Solana",
      },
      tickets,
      contractAddress: eventPda,
      organizer,
    };
  } catch {
    return null;
  }
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;
  const event = await loadEventDetail(id);

  if (!event) {
    notFound();
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f6f8] dark:bg-black">
      <Header />
      <main className="flex-1">
        <section className="px-6 pt-8">
          <div className="mx-auto max-w-7xl">
            <div className="mb-6 flex flex-col gap-4 rounded-[28px] border border-slate-200 bg-white px-6 py-5 shadow-sm dark:border-slate-800 dark:bg-slate-900 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--flox-primary)]">
                  Event Workspace
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  Review the event, compare tiers, and buy with confidence.
                </h2>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">
                  This page is the direct event workflow. Use AI Home when you still need help deciding whether this event fits your budget or goals, and use Discover when you want to return to the wider catalog.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  <span className="material-symbols-outlined text-base">auto_awesome</span>
                  AI Home
                </Link>
                <Link href="/discover" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
                  <span className="material-symbols-outlined text-base">travel_explore</span>
                  Back to Discover
                </Link>
              </div>
            </div>
          </div>
        </section>
        <HeroBanner event={event} />
        <AboutSection event={event} />
        <TicketsSection tickets={event.tickets} event={event} />
      </main>
      <Footer />
    </div>
  );
}
