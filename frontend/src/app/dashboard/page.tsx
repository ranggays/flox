"use client";

import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DashboardStats from "@/components/dashboard/DashboardStats";
import ManageEventsTable from "@/components/dashboard/ManageEventStable";
import ValidatorsTable from "@/components/dashboard/ValidatorStable";
import Link from "next/link";
import { useAgentData } from "@/context/AgentDataContext";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { getProgram, getEscrowPDA } from "@/lib/program";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export default function DashboardPage() {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [escrowLocked, setEscrowLocked] = useState(0);
  const { pushOrganizerData } = useAgentData();

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!wallet) {
        setEvents([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const program = getProgram(connection, wallet);
        const escrowPDA = getEscrowPDA(wallet.publicKey);

        try {
          const escrowData = await (program as any).account.escrowAccount.fetch(escrowPDA);
          setEscrowLocked(escrowData.lockedAmount.toNumber() / LAMPORTS_PER_SOL);
        } catch (e) {
          console.log("Escrow havent created for this wallet.");
        }

        const rawEvents = await (program as any).account.eventAccount.all([
          {
            memcmp: {
              offset: 8,
              bytes: wallet.publicKey.toBase58(),
            },
          },
        ]);

        const formattedEvents = rawEvents.map((evt: any) => {
          const data = evt.account;
          
          const nowSeconds = Math.floor(Date.now() / 1000);
          
          const start = Number(data.startTime.toString());
          const end = Number(data.endTime.toString());

          let statusStr = "";

          console.log(`Event: ${data.name} | Now: ${nowSeconds} | Start: ${start} | End: ${end} | Status: ${data.status.active}`);

          if (data.status.cancelled) {
            statusStr = "Cancelled";
          } else if (data.status.ended){
            statusStr = "Withdrawn";
          }
          else if (nowSeconds < start) {
            statusStr = "On Sale"; 
          } 
          else if (nowSeconds >= start && nowSeconds <= end) {
            statusStr = "Ongoing"; 
          } 
          else {
            statusStr = "Ended";
          }

          return {
            id: data.eventId.toString(),
            name: data.name,
            date: new Date(start * 1000).toLocaleDateString("id-ID", {
              day: 'numeric', month: 'short', year: 'numeric'
            }),
            location: data.location,
            status: statusStr,
            sold: data.ticketsSold,
            revenue: `${(data.totalRevenue.toNumber() / 1_000_000_000).toFixed(2)} SOL`,
            type: data.eventType.physical ? "Physical" : "Virtual"
          };
        });

        formattedEvents.sort((a: any, b: any) => Number(b.id) - Number(a.id));

        setEvents(formattedEvents);

        const totalRevenue = formattedEvents.reduce((sum: any, e: any) => {
          const val = parseFloat(e.revenue?.replace(" SOL","") ?? "0");
          return sum + val;
        }, 0);
        const totalSold = formattedEvents.reduce((sum: any, e: any) => sum + (e.sold ?? 0), 0);

        pushOrganizerData({
          escrowLocked:    escrowLocked,          
          escrowAvailable: 0,                     
          totalRevenue:    totalRevenue.toFixed(3),
          totalSold,
          eventCount:      formattedEvents.length,
        });
      } catch (error) {
        console.error("Failed fetch data from Solana:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [wallet, connection]);

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f6f8] dark:bg-black">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 mb-6">
          <Link href="/" className="hover:text-[#5048e5] transition-colors">Home</Link>
          <span className="material-symbols-outlined text-xs">chevron_right</span>
          <span className="text-slate-900 dark:text-slate-100 font-medium">Organizer Dashboard</span>
        </nav>

        {/* Page title & Create Button */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Organizer Dashboard
            </h1>
            <p className="mt-1.5 text-slate-600 dark:text-slate-400">
              Manage your event performance on Solana Devnet.
            </p>
          </div>
          <Link href="/dashboard/create" className="px-5 py-2.5 bg-[#5048e5] text-white font-bold rounded-xl text-sm hover:bg-[#5048e5]/90 transition-all flex items-center gap-2 self-start">
            <span className="material-symbols-outlined text-base">add</span>
            Create Event
          </Link>
        </div>

        {/* Stats */}
        <DashboardStats events={events}/>

        <div className={`mb-4 border rounded-xl p-4 flex items-start gap-3 ${
          escrowLocked >= 0.05 
            ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800" 
            : "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800"
        }`}>
          <span className={`material-symbols-outlined mt-0.5 shrink-0 ${
            escrowLocked >= 0.05 ? "text-green-600 dark:text-green-400" : "text-amber-600 dark:text-amber-400"
          }`}>
            {escrowLocked >= 0.05 ? "verified_user" : "warning"}
          </span>
          <div>
            <p className={`text-sm font-bold ${escrowLocked >= 0.05 ? "text-green-800 dark:text-green-200" : "text-amber-800 dark:text-amber-200"}`}>
              {escrowLocked >= 0.05 ? "Organizer Account Verified" : "Action Required"}
            </p>
            <p className={`text-sm ${escrowLocked >= 0.05 ? "text-green-700 dark:text-green-300" : "text-amber-800 dark:text-amber-200"}`}>
              {escrowLocked >= 0.05 
                ? `You have successfully locked ${escrowLocked} SOL stake. You can create unlimited events.` 
                : "Requires a 0.05 SOL refundable stake to prevent spam before you can create an event."}
            </p>
          </div>
        </div>

        <div className="mb-8">
          {loading ? (
            <div className="py-12 flex justify-center items-center bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="material-symbols-outlined animate-spin text-4xl text-[#5048e5]">autorenew</span>
              <span className="ml-3 font-medium text-slate-500">Loading events from Solana...</span>
            </div>
          ) : events.length === 0 ? (
            <div className="py-12 flex flex-col justify-center items-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
               <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">event_busy</span>
               <h3 className="font-bold text-slate-700 dark:text-slate-200 mb-1">No Events Found</h3>
               <p className="text-sm text-slate-500 mb-4">You haven't deployed any events to the blockchain yet.</p>
               <Link href="/dashboard/create" className="text-[#5048e5] font-bold hover:underline text-sm">Deploy an Event now →</Link>
            </div>
          ) : (
            <ManageEventsTable events={events} />
          )}
        </div>

        {/* Validators table */}
        <ValidatorsTable />

      </main>

      <Footer />
    </div>
  );
}