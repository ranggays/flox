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

function getReadonlyProgram() {
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
  return new Program({ ...idl, address: PROGRAM_ID.toBase58() } as Idl, provider);
}

function enumKey(val: Record<string, unknown>): string {
  return val ? Object.keys(val)[0] : "unknown";
}

function formatDateRange(startTs: number, endTs: number): string {
  const start = new Date(startTs * 1000);
  const end   = new Date(endTs   * 1000);
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short", year: "numeric" };
  if (start.toDateString() === end.toDateString()) {
    return start.toLocaleDateString("en-US", opts);
  }
  return `${start.toLocaleDateString("en-US", { day: "numeric", month: "short" })} – ${end.toLocaleDateString("en-US", opts)}`;
}

function formatTime(startTs: number, endTs: number): string {
  const fmt = (ts: number) =>
    new Date(ts * 1000).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  return `${fmt(startTs)} – ${fmt(endTs)}`;
}

function getStatus(account: any): string {
  const now = Math.floor(Date.now() / 1000);
  if (enumKey(account.status) === "cancelled") return "Cancelled";
  if (now < account.startTime.toNumber())       return "Upcoming";
  if (now <= account.endTime.toNumber())         return "On Sale";
  return "Ended";
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;

  try {
    const program = getReadonlyProgram();
    const [rawEvents, rawTiers] = await Promise.all([
      cachedFetch<any[]>("eventAccount",      () => (program as any).account.eventAccount.all()),
      cachedFetch<any[]>("ticketTierAccount", () => (program as any).account.ticketTierAccount.all()),
    ]);

    const match = (rawEvents as any[]).find(
      (e: any) => e.account.eventId.toString() === id
    );

    if (!match) notFound();

    const data      = match.account;
    const eventPDA  = match.publicKey.toBase58();
    const startTs   = data.startTime.toNumber();
    const endTs     = data.endTime.toNumber();
    const eventTiers = rawTiers.filter((t: any) => {
      const addr = t.account.event ?? t.account.eventAccount ?? t.account.eventPubkey;
      return addr?.toBase58() === eventPDA;
    });

    const TIER_FEATURES: string[][] = [
      ["Priority Entry",        "Exclusive Lounge Access", "Meet & Greet Inclusion",  "Front Row Area"],
      ["All Area Access",       "Community Discord Access", "Digital Certificate"],
      ["General Admission",     "Public Event Access"],
    ];
    const TIER_BADGES   = ["Exclusive", "Popular", ""];
    const TIER_URGENCY  = ["Selling fast!", "", ""];

    const tickets: TicketTier[] = eventTiers
      .sort((a: any, b: any) => a.account.tierIndex - b.account.tierIndex)
      .map((t: any): TicketTier => {
        const idx = t.account.tierIndex ?? 0;
        const priceLamports = typeof t.account.price === "number"
          ? t.account.price
          : t.account.price?.toNumber() ?? 0;
        const maxSupply = typeof t.account.maxSupply === "number"
          ? t.account.maxSupply
          : t.account.maxSupply?.toNumber() ?? 0;
        const sold = typeof t.account.sold === "number"
          ? t.account.sold
          : t.account.sold?.toNumber() ?? 0;
        const remaining = maxSupply - sold;
        const soldPct = maxSupply > 0 ? sold / maxSupply : 0;

        return {
          id:          t.publicKey.toBase58(),
          name:        t.account.name,
          price:       (priceLamports / 1_000_000_000).toFixed(3),
          currency:    "SOL",
          features:    TIER_FEATURES[Math.min(idx, TIER_FEATURES.length - 1)],
          sold,
          total:       maxSupply,
          highlighted: idx === 0,
          badge:       TIER_BADGES[Math.min(idx, TIER_BADGES.length - 1)] || undefined,
          urgency:     remaining < maxSupply * 0.2 && remaining > 0
                         ? `Only ${remaining} left!`
                         : soldPct > 0.5 && TIER_URGENCY[Math.min(idx, TIER_URGENCY.length - 1)]
                           ? TIER_URGENCY[Math.min(idx, TIER_URGENCY.length - 1)]
                           : undefined,
        };
      });

    const event: EventDetail = {
      id:             parseInt(id),
      title:          data.name,
      status:         getStatus(data),
      dateRange:      formatDateRange(startTs, endTs),
      time:           formatTime(startTs, endTs),
      location:       data.location,
      heroImageUrl:   data.imageUri?.startsWith("http")
                        ? data.imageUri
                        : `https://placehold.co/1200x500/1e293b/ffffff?text=${encodeURIComponent(data.name)}`,
      heroImageAlt:   `${data.name} banner`,
      description:    data.description
                        ? [data.description]
                        : ["No description provided."],
      features: [
        { icon: "lock",       title: "Secure Escrow",    description: "Ticket payments are held in on-chain escrow and released to the organizer after the event." },
        { icon: "qr_code_2",  title: "On-Chain Verified", description: "Each ticket is a unique on-chain account. Validate instantly at the venue with a QR scan." },
      ],
      host: {
        initial:  data.organizer.toBase58().slice(0, 2).toUpperCase(),
        name:     `${data.organizer.toBase58().slice(0, 6)}...${data.organizer.toBase58().slice(-4)}`,
        subtitle: "Verified Organizer on Solana",
      },
      tickets,
      contractAddress: eventPDA,
      organizer: data.organizer.toBase58()
    };

    return (
      <div className="flex min-h-screen flex-col bg-[#f6f6f8] dark:bg-black">
        <Header />
        <main className="flex-1">
          <HeroBanner event={event} />
          <AboutSection event={event} />
          <TicketsSection tickets={event.tickets} event={event} />
        </main>
        <Footer />
      </div>
    );
  } catch {
    notFound();
  }
}