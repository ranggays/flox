"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import TicketList from "@/components/my-tickets/TicketList";
import { useConnection, useAnchorWallet, useWallet } from "@solana/wallet-adapter-react";
import { getProgram, fetchOwnerTickets } from "@/lib/program";
import type { MyTicket } from "@/lib/types";
import { useAgentData } from "@/context/AgentDataContext";
import { cachedFetch } from "@/lib/programCache";

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<MyTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const anchorWallet = useAnchorWallet();
  const { pushUserTickets } = useAgentData();

  function enumKey(val: Record<string, unknown> | undefined): string {
  return val ? Object.keys(val)[0] : "other";
}

  useEffect(() => {
    const fetchMyTickets = async () => {
      if (!publicKey || !anchorWallet) {
        setTickets([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        const program = getProgram(connection, anchorWallet);
        console.log("Available accounts:", Object.keys(program.account));

        const myRawTickets = await fetchOwnerTickets(program, publicKey);
        console.log("Total tickets found:", myRawTickets.length);
        if (myRawTickets.length > 0) {
          console.log("Raw ticket account keys:", Object.keys(myRawTickets[0].account));
          console.log("Raw ticket data:", myRawTickets[0].account);
        }

        if (myRawTickets.length === 0) {
          setTickets([]);
          return;
        }

        const [allRawEvents, allRawTiers] = await Promise.all([
          cachedFetch<any[]>("eventAccount",      () => (program.account as any).eventAccount.all()),
          cachedFetch<any[]>("ticketTierAccount", () => (program.account as any).ticketTierAccount.all()),
        ]);

        const now = Math.floor(Date.now() / 1000);

        const formattedTickets: MyTicket[] = myRawTickets.map((rawTicket: any) => {
          const ticketData = rawTicket.account;

          const eventPubkey = ticketData.event ?? ticketData.eventAccount ?? ticketData.eventPubkey;
          const tierPubkey  = ticketData.tier  ?? ticketData.tierAccount  ?? ticketData.tierPubkey;

          const eventPubkeyStr = eventPubkey?.toBase58();
          const tierPubkeyStr  = tierPubkey?.toBase58();

          const eventMatch = allRawEvents.find((e: any) => e.publicKey.toBase58() === eventPubkeyStr);
          const tierMatch  = allRawTiers.find((t: any) => t.publicKey.toBase58() === tierPubkeyStr);

          const eData = eventMatch?.account;
          const tData = tierMatch?.account;

          const startTs = eData?.startTime?.toNumber() ?? 0;
          const endTs   = eData?.endTime?.toNumber()   ?? 0;

          let status: any;
          if (eData?.status?.cancelled){
            status = "cancelled";
          } else if (ticketData.isUsed || now > endTs) {
            status = "attended";
          } else {
            status = "upcoming";
          }

          return {
            id: rawTicket.publicKey.toBase58(),
            status,
            category: enumKey(eData?.category) ?? "other",
            title:    eData?.name    ?? "Unknown Event",
            date:     startTs ? new Date(startTs * 1000).toLocaleDateString("en-US", { weekday: "short", year: "numeric", month: "short",   day: "numeric",
            }) : "TBA",
            time: startTs ? new Date(startTs * 1000).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit",
            }) : "TBA",
            imageUrl: eData?.imageUri?.startsWith("http") ? eData.imageUri : `https://placehold.co/600x400/1e293b/ffffff?text=${encodeURIComponent(eData?.name ?? "Ticket")}`,
            imageAlt: `${eData?.name ?? "Event"} ticket`,
            eventPDA: eventPubkeyStr,
            tierPDA: tierPubkeyStr,
            organizer: eData?.organizer?.toBase58(),
          };
        }).filter(Boolean) as MyTicket[];

        setTickets(formattedTickets.reverse());

        pushUserTickets(formattedTickets.map(t => ({
          id:       t.id,
          title:    t.title,
          date:     t.date,
          status:   t.status,
          category: t.category,
        })));
      } catch (error) {
        console.error("Failed fetch ticket:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTickets();
  }, [publicKey, anchorWallet, connection]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f6f8] dark:bg-black">
      <Header />
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="mb-8">
          <h2 className="text-4xl font-black text-slate-900 dark:text-white">
            My Ticket Collection
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {publicKey ? (
              loading ? "Syncing with blockchain..." : `${tickets.length} ticket${tickets.length !== 1 ? "s" : ""} securely held in your wallet`
            ) : (
              "Connect your wallet to view your tickets"
            )}
          </p>
        </div>

        {/* State Management UI */}
        {!publicKey ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="material-symbols-outlined text-5xl text-slate-400 mb-4">account_balance_wallet</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Wallet Disconnected</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-center max-w-sm">
              Please connect your Phantom wallet to view and manage your verified event tickets.
            </p>
          </div>
        ) : loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <span className="material-symbols-outlined animate-spin text-4xl text-[#5048e5] mb-4">autorenew</span>
            <p className="text-slate-500 font-medium">Fetching on-chain data...</p>
          </div>
        ) : tickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
            <span className="material-symbols-outlined text-5xl text-slate-400 mb-4">confirmation_number</span>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Tickets Found</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6 text-center max-w-sm">
              You haven't purchased any tickets yet. Explore upcoming events and secure your spot!
            </p>
            <a href="/#events" className="px-6 py-3 bg-[#5048e5] text-white font-bold rounded-xl hover:bg-[#5048e5]/90 transition-all shadow-lg shadow-[#5048e5]/20">
              Explore Events
            </a>
          </div>
        ) : (
          <TicketList tickets={tickets} />
        )}
      </main>
      <Footer />
    </div>
  );
}