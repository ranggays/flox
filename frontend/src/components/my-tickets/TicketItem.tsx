"use client";

import { useState } from "react";
import QRModal from "@/components/my-tickets/QRModal";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getProgram, claimRefund, getEscrowPDA } from "@/lib/program";
import { ToastProvider, useToast } from "../Toast";

interface TicketItemProps {
  ticket: any; 
}

const STATUS_CONFIG: Record<string, any> = {
  upcoming: {
    badgeBg: "bg-[#5048e5]", badgeText: "Upcoming",
    cardBg: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
    titleColor: "text-slate-900 dark:text-white",
    categoryColor: "text-[#5048e5]", dateColor: "text-slate-500 dark:text-slate-400",
    grayscale: "", opacity: "", hover: "hover:shadow-md hover:border-[#5048e5]/50",
  },
  attended: {
    badgeBg: "bg-slate-500", badgeText: "Attended",
    cardBg: "bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800",
    titleColor: "text-slate-500 dark:text-slate-400",
    categoryColor: "text-slate-400", dateColor: "text-slate-400 dark:text-slate-500",
    grayscale: "grayscale opacity-70", opacity: "", hover: "",
  },
  listed: {
    badgeBg: "bg-amber-500", badgeText: "Listed",
    cardBg: "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800",
    titleColor: "text-slate-900 dark:text-white",
    categoryColor: "text-[#5048e5]", dateColor: "text-slate-500 dark:text-slate-400",
    grayscale: "", opacity: "", hover: "hover:shadow-md hover:border-[#5048e5]/50",
  },
  cancelled: {
    badgeBg: "bg-red-500", badgeText: "Cancelled",
    cardBg: "bg-red-50/50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50",
    titleColor: "text-slate-700 dark:text-slate-300 line-through decoration-red-500",
    categoryColor: "text-red-500 font-bold", dateColor: "text-slate-500 dark:text-slate-400",
    grayscale: "grayscale opacity-50", opacity: "", hover: "hover:shadow-md hover:border-red-300 dark:hover:border-red-800",
  },
};

export default function TicketItem({ ticket }: TicketItemProps) {
  const [showQR, setShowQR] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const safeStatus = ticket.status?.toLowerCase() || "upcoming"; 
  const cfg = STATUS_CONFIG[safeStatus] || STATUS_CONFIG["upcoming"];
  
  const isAttended = safeStatus === "attended";
  const isCancelled = safeStatus === "cancelled";

  const { success, error: toastError, warning, info } = useToast();

  const handleRefund = async () => {
    if (!wallet) return warning("Please connect a wallet!");

    try {
      setIsRefunding(true);
      const program = getProgram(connection, wallet);
      
      const eventPDA = new PublicKey(ticket.eventPDA);
      const tierPDA = new PublicKey(ticket.tierPDA);
      const ticketPDA = new PublicKey(ticket.id); 
      const organizerPubkey = new PublicKey(ticket.organizer);
      const escrowPDA = getEscrowPDA(organizerPubkey);

      console.log("Memproses Refund...");
      
      const tx = await claimRefund(
        program, 
        wallet.publicKey, 
        eventPDA, 
        tierPDA, 
        escrowPDA, 
        ticketPDA
      );

      console.log("Refund Berhasil:", tx);
      success("Refund Success! SOL have been sent back into wallet.");
      window.location.reload();
      
    } catch (error: any) {
      console.error("Gagal Refund:", error);
      toastError(`Failed refund: ${error.message}`);
    } finally {
      setIsRefunding(false);
    }
  };

  return (
    <>
      <ToastProvider />
      <div className={`group rounded-xl p-4 shadow-sm border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row items-center gap-6 transition-all ${cfg.cardBg} ${cfg.hover} ${cfg.opacity}`}>
        <div className="relative w-full md:w-48 h-32 shrink-0 overflow-hidden rounded-lg">
          <img src={ticket.imageUrl || "https://placehold.co/600x400/1e293b/ffffff"} alt={ticket.imageAlt} className={`w-full h-full object-cover transition-transform duration-500 ${isAttended || isCancelled ? cfg.grayscale : "group-hover:scale-105"}`} />
          <div className={`absolute top-2 left-2 px-2 py-1 ${cfg.badgeBg} text-white text-[10px] font-bold uppercase tracking-widest rounded`}>{cfg.badgeText}</div>
        </div>

        <div className="flex-1 w-full space-y-1">
          <p className={`text-xs font-bold uppercase tracking-wider mb-1 ${cfg.categoryColor}`}>{ticket.category}</p>
          <h3 className={`text-xl font-bold leading-tight ${cfg.titleColor}`}>{ticket.title}</h3>
          <div className={`flex items-center gap-4 mt-2 text-sm ${cfg.dateColor}`}>
            <div className="flex items-center gap-1"><span className="material-symbols-outlined text-lg">calendar_today</span><span>{ticket.date}</span></div>
            <div className="flex items-center gap-1"><span className="material-symbols-outlined text-lg">schedule</span><span>{ticket.time}</span></div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row md:flex-col lg:flex-row gap-3 w-full md:w-auto shrink-0">
          {isCancelled ? (
            <button
              onClick={handleRefund}
              disabled={isRefunding}
              className={`flex-1 md:w-44 flex items-center cursor-pointer justify-center gap-2 bg-red-500 text-dark px-4 py-2.5 rounded-lg font-bold text-sm shadow-lg shadow-red-500/20 transition-all ${isRefunding ? "opacity-50 cursor-not-allowed" : "hover:bg-red-600 active:scale-95"}`}
            >
              <span className="material-symbols-outlined text-xl">{isRefunding ? "hourglass_empty" : "account_balance_wallet"}</span>
              {isRefunding ? "Processing..." : "Claim Refund"}
            </button>
          ) : isAttended ? (
            <button disabled className="flex-1 md:w-40 flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700 text-slate-400 px-4 py-2.5 rounded-lg font-bold text-sm cursor-not-allowed">
              <span className="material-symbols-outlined text-xl">verified</span> Event Ended
            </button>
          ) : (
            <button onClick={() => setShowQR(true)} className="flex-1 md:w-40 flex items-center justify-center gap-2 bg-[#5048e5] text-white px-4 py-2.5 rounded-lg font-bold text-sm hover:bg-[#5048e5]/90 transition-colors">
              <span className="material-symbols-outlined text-xl">qr_code_2</span> View QR
            </button>
          )}
        </div>
      </div>

      {showQR && <QRModal ticket={ticket} onClose={() => setShowQR(false)} />}
    </>
  );
}