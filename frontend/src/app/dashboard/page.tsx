"use client";

import { useEffect, useState } from "react";
import DashboardStats from "@/components/dashboard/DashboardStats";
import ManageEventsTable from "@/components/dashboard/ManageEventStable";
import ValidatorsTable from "@/components/dashboard/ValidatorStable";
import Link from "next/link";
import { useAgentData } from "@/context/AgentDataContext";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { getProgram, getEscrowPDA } from "@/lib/program";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import WorkflowAssistant from "@/components/WorkflowAssistant";
import WorkspaceShell from "@/components/workspace/WorkspaceShell";

type NumberLike = number | { toNumber(): number } | null | undefined;
type AddressLike = { toBase58(): string };
type EnumLike = Record<string, unknown>;

interface DashboardEventRow {
  id: string;
  name: string;
  date: string;
  location: string;
  status: string;
  sold: number;
  revenue: string;
  type: "Physical" | "Virtual";
}

interface RawOrganizerEventData {
  eventId: { toString(): string };
  name: string;
  location: string;
  startTime: { toString(): string };
  endTime: { toString(): string };
  status: EnumLike;
  ticketsSold: NumberLike;
  totalRevenue: { toNumber(): number };
  eventType: EnumLike;
}

interface RawProgramAccount<T> {
  account: T;
}

interface DashboardProgram {
  account: {
    escrowAccount: {
      fetch(address: AddressLike): Promise<{ lockedAmount: { toNumber(): number } }>;
    };
    eventAccount: {
      all(filters: Array<{ memcmp: { offset: number; bytes: string } }>): Promise<
        Array<RawProgramAccount<RawOrganizerEventData>>
      >;
    };
  };
}

function toNumber(value: NumberLike): number {
  return typeof value === "number" ? value : value?.toNumber() ?? 0;
}

export default function DashboardPage() {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  
  const [events, setEvents] = useState<DashboardEventRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [escrowLocked, setEscrowLocked] = useState(0);
  const { pushOrganizerData } = useAgentData();
  const dashboardWorkflowContext = [
    "Surface: organizer dashboard.",
    `Wallet connected: ${wallet ? "yes" : "no"}.`,
    `Escrow locked: ${escrowLocked.toFixed(3)} SOL.`,
    `Loaded organizer event count: ${events.length}.`,
    ...(events.length > 0
      ? [
          "Organizer events:",
          ...events.slice(0, 8).map(
            (event) =>
              `- ${event.name} | ${event.date} | ${event.location} | status: ${event.status} | sold: ${event.sold} | revenue: ${event.revenue}`
          ),
        ]
      : ["No organizer events are currently loaded."]),
  ].join("\n");

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!wallet) {
        setEvents([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const program = getProgram(connection, wallet) as unknown as DashboardProgram;
        const escrowPDA = getEscrowPDA(wallet.publicKey);
        let lockedSol = 0;

        try {
          const escrowData = await program.account.escrowAccount.fetch(escrowPDA);
          lockedSol = escrowData.lockedAmount.toNumber() / LAMPORTS_PER_SOL;
          setEscrowLocked(lockedSol);
        } catch {
          console.log("Escrow havent created for this wallet.");
        }

        const rawEvents = await program.account.eventAccount.all([
          {
            memcmp: {
              offset: 8,
              bytes: wallet.publicKey.toBase58(),
            },
          },
        ]);

        const formattedEvents: DashboardEventRow[] = rawEvents.map((evt) => {
          const data = evt.account;
          
          const nowSeconds = Math.floor(Date.now() / 1000);
          
          const start = Number(data.startTime.toString());
          const end = Number(data.endTime.toString());

          let statusStr = "";

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
            sold: toNumber(data.ticketsSold),
            revenue: `${(data.totalRevenue.toNumber() / 1_000_000_000).toFixed(2)} SOL`,
            type: data.eventType.physical ? "Physical" : "Virtual",
          };
        });

        formattedEvents.sort((a, b) => Number(b.id) - Number(a.id));

        setEvents(formattedEvents);

        const totalRevenue = formattedEvents.reduce((sum, event) => {
          const val = parseFloat(event.revenue.replace(" SOL", "") || "0");
          return sum + val;
        }, 0);
        const totalSold = formattedEvents.reduce((sum, event) => sum + event.sold, 0);

        pushOrganizerData({
          escrowLocked:    lockedSol,
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
  }, [wallet, connection, pushOrganizerData]);

  return (
    <WorkspaceShell
      eyebrow="Organizer Workspace"
      title="Organizer dashboard"
      description="Review escrow health, event performance, and operations from a single organizer workspace with route-local AI help."
      contentClassName="mx-auto flex w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8"
      headerActions={
        <Link href="/dashboard/create" className="px-4 py-2.5 bg-[#5048e5] text-white font-bold rounded-xl text-sm hover:bg-[#5048e5]/90 transition-all flex items-center gap-2 self-start">
          <span className="material-symbols-outlined text-base">add</span>
          Create Event
        </Link>
      }
    >
      <main>
        <div className="mb-8">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Performance overview
          </h2>
          <p className="mt-1.5 text-slate-600 dark:text-slate-400">
            Manage your event performance on Solana Devnet.
          </p>
        </div>

        <WorkflowAssistant
          eyebrow="Organizer Copilot"
          title="Use the dashboard copilot before changing routes"
          description="This copilot is grounded in the organizer events and escrow data already loaded on this page, so it should summarize performance and surface the next issue to investigate."
          suggestions={[
            "Summarize my performance",
            "What needs attention?",
          ]}
          route="/dashboard"
          surface="organizer-copilot"
          workflowContext={dashboardWorkflowContext}
          placeholder="Ask about event performance or what needs attention..."
          emptyState="Use the copilot to summarize the current dashboard, highlight weak spots, or turn the loaded event table into an action list."
          className="mb-8"
        />

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm text-slate-600 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">
            Organizer workspace is separated from AI Home so you can act directly once the orchestration step is done.
          </div>
          <Link href="/" className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">
            <span className="material-symbols-outlined text-base">auto_awesome</span>
            Back to AI Home
          </Link>
        </div>

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

        <DashboardStats events={events}/>

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
               <p className="text-sm text-slate-500 mb-4">You haven&apos;t deployed any events to the blockchain yet.</p>
               <Link href="/dashboard/create" className="text-[#5048e5] font-bold hover:underline text-sm">Deploy an Event now →</Link>
            </div>
          ) : (
            <ManageEventsTable events={events} />
          )}
        </div>

        <ValidatorsTable />
      </main>
    </WorkspaceShell>
  );
}
