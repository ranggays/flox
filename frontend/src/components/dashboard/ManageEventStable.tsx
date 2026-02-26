"use client";

import { useState, useEffect } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { 
  getProgram, 
  getEventPDA, 
  cancelEvent, 
  withdrawFunds 
} from "@/lib/program";
import { ToastProvider, useToast, ConfirmProvider, useConfirm } from "@/components/Toast";

interface ManageEventsTableProps {
  events: any[];
}

export default function ManageEventsTable({ events: initial }: ManageEventsTableProps) {
  const [events, setEvents] = useState(initial);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const { success, error: toastError, warning, info } = useToast();
  const confirm = useConfirm();

  useEffect(() => {
    setEvents(initial);
  }, [initial]);

  const handleCancel = async (eventId: string) => {
    if (!wallet) return warning("Please connect a wallet!");
    
    const confirmed = await confirm({
      title:        "Cancel this event?",
      description:  "This will lock the event. Buyers may request refunds.",
      confirmLabel: "Yes, Cancel",
      cancelLabel:  "Keep Event",
      variant:      "danger",   // "danger" | "warning" | "info"
    });
    if (!confirmed) return;

    try {
      setLoadingAction(eventId);
      const program = getProgram(connection, wallet);
      const eventPDA = getEventPDA(wallet.publicKey, parseInt(eventId));

      console.log("Membatalkan Event PDA:", eventPDA.toBase58());

      const tx = await cancelEvent(program, wallet.publicKey, eventPDA);
      
      console.log("Cancel Signature:", tx);
      success("Event successfully cancelled!");
      window.location.reload();
    } catch (error: any) {
      console.error("Gagal Cancel:", error);
      toastError(`Failed: ${error.message || "Something Wrong Happened"}`);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleWithdraw = async (eventId: string) => {
    if (!wallet) return warning("Please connect a wallet!");

    try {
      setLoadingAction(eventId);
      const program = getProgram(connection, wallet);
      const eventPDA = getEventPDA(wallet.publicKey, parseInt(eventId));

      console.log("Melakukan Withdraw untuk PDA:", eventPDA.toBase58());

      const tx = await withdrawFunds(program, wallet.publicKey, eventPDA);

      console.log("Withdraw Signature:", tx);
      success("Fund (Revenue + Stake) successfully withdraw to Wallet!");
      window.location.reload();
    } catch (error: any) {
      console.error("Gagal Withdraw:", error);
      toastError("Failed to withdraw");
    } finally {
      setLoadingAction(null);
    }
  };

  const getStatusStyle = (status: string) => {
    if (status === "On Sale") return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    if (status === "Ongoing") return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    if (status === "Ended") return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400";
    if (status === "Cancelled") return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    if (status === "Withdrawn") return "bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-500";
    
    return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400";
  };

  return (
    <>
      <ToastProvider />
      <ConfirmProvider />
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-10">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500">Event</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 text-center">Status</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 text-center">Sold</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 text-center">Revenue</th>
                <th className="px-6 py-4 text-xs font-bold uppercase text-slate-500 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {events.map((event) => {
                const isProcessing = loadingAction === event.id;
                const isCancelable = event.status === "On Sale" || event.status === "Ongoing";
                const isWithdrawn = event.status === "Withdrawn";
                const isCancelled = event.status === "Cancelled";

                return (
                  <tr key={event.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">{event.name}</div>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5 uppercase">ID: {event.id} • {event.location}</div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${getStatusStyle(event.status)}`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-slate-600 dark:text-slate-400 font-medium">
                      {event.sold}
                    </td>
                    <td className="px-6 py-4 text-center font-mono font-bold text-[#5048e5]">
                      {event.revenue}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-3">
                        {isCancelable ? (
                          <button 
                            onClick={() => handleCancel(event.id)}
                            disabled={isProcessing}
                            className={`text-xs font-bold text-red-500 hover:text-red-700 transition-all ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
                          >
                            {isProcessing ? "Processing..." : "Cancel Event"}
                          </button>
                        ) : (
                          <button 
                            onClick={() => handleWithdraw(event.id)}
                            disabled={isProcessing || isWithdrawn || isCancelled}
                            className={`bg-[#5048e5] text-white px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                              isWithdrawn || isCancelled
                                ? "opacity-50 grayscale cursor-not-allowed" 
                                : "hover:bg-[#4338ca]"
                            }`}
                          >
                            {isProcessing ? "Wait..." : isWithdrawn ? "Already Withdrawn" : "Withdraw Funds"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {events.length === 0 && (
          <div className="p-10 text-center text-slate-500 text-sm italic">
            No events found on the blockchain for this wallet.
          </div>
        )}
      </div>
    </>
  );
}