"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { useConnection, useWallet, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { 
  getProgram, 
  getEscrowPDA, 
  getTicketPDA,
} from "@/lib/program";
import { ToastProvider, useToast } from "@/components/Toast";

interface CheckoutModalProps {
  ticket: any; 
  event: any;
  onClose: () => void;
}

const MAX_QTY = 4;
const SOLANA_BASE_FEE = 0.000005; 

export default function CheckoutModal({ ticket, event, onClose }: CheckoutModalProps) {
  const [qty, setQty] = useState(1);
  const [isPaying, setIsPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [txSignature, setTxSignature] = useState("");
  const [solPrice, setSolPrice] = useState<number | null>(null);
  const { success, error: toastError, warning, info } = useToast();

  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();
  const anchorWallet = useAnchorWallet(); 

  const unitPrice = parseFloat(ticket.price);
  const subtotal = unitPrice * qty;
  const total = subtotal + SOLANA_BASE_FEE;
  const totalUSD = solPrice !== null ? (total * solPrice).toFixed(2) : "...";

  const shortAddress = publicKey 
    ? `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`
    : "Not Connected";

  useEffect(() => {
    const fetchSolPrice = async () => {
      try {
        const response = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd");
        const data = await response.json();
        if (data.solana && data.solana.usd) setSolPrice(data.solana.usd);
      } catch (error) {
        console.error("Gagal mengambil harga SOL", error);
        setSolPrice(150); 
      }
    };

    fetchSolPrice();
    const interval = setInterval(fetchSolPrice, 60000);

    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const handleBackdropClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => { if (e.target === e.currentTarget) onClose(); },
    [onClose]
  );

  const handlePay = async () => {
    if (!publicKey || !anchorWallet) {
      warning("Please connect your Phantom Wallet first!");
      return;
    }

    setIsPaying(true);
    try {
      const program = getProgram(connection, anchorWallet);

      const eventPubkey = new PublicKey(event.contractAddress);
      const tierPubkey = new PublicKey(ticket.id);
      const organizerPubkey = new PublicKey(event.organizer);
      const escrowPDA = getEscrowPDA(organizerPubkey);

      const tx = new Transaction();

      for (let i = 0; i < qty; i++) {
        const tokenId = ticket.sold + i + 1;
        const ticketPDA = getTicketPDA(eventPubkey, tokenId);

        const instruction = await (program.methods as any)
          .mintTicket(new BN(tokenId))
          .accounts({
            eventAccount: eventPubkey,
            tierAccount: tierPubkey,
            escrowAccount: escrowPDA,     
            ticketAccount: ticketPDA,     
            buyer: publicKey,
            systemProgram: SystemProgram.programId
          })
          .instruction();
        
        tx.add(instruction);
      }

      const signature = await sendTransaction(tx, connection);
      await connection.confirmTransaction(signature, "confirmed");

      setTxSignature(signature);
      setPaid(true);

    } catch (error: any) {
      console.error("Transaction Failed:", error);
      toastError(`Transaction Failed: ${error.message || "Unknown error"}`);
    } finally {
      setIsPaying(false);
    }
  };

  return createPortal(
    <>
      <ToastProvider />    
      <div className="fixed inset-0 z-999 flex items-center justify-center p-4 md:p-8 bg-black/60 backdrop-blur-sm" onClick={handleBackdropClick}>
        {/* Container utama */}
        <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">
          {/* Tombol Close */}
          <button onClick={onClose} aria-label="Close checkout" className="absolute top-4 right-4 z-10 flex items-center justify-center size-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all">
            <span className="material-symbols-outlined text-lg">close</span>
          </button>

          {paid ? (
            <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
              <div className="size-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-6">
                <span className="material-symbols-outlined text-5xl text-green-500">check_circle</span>
              </div>
              <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Ticket Purchased!</h2>
              <p className="text-slate-500 dark:text-slate-400 text-sm mb-2">
                Your <span className="font-bold text-[#5048e5]">{qty}x {ticket.name}</span> for{" "}
                <span className="font-bold text-slate-700 dark:text-slate-200">{event.title}</span>{" "}
                has been securely issued to your wallet.
              </p>
              <p className="text-xs text-slate-400 mb-8 font-mono">{shortAddress}</p>
              
              <a href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`} target="_blank" rel="noopener noreferrer" className="px-8 py-3 bg-[#5048e5] text-white font-bold rounded-xl hover:bg-[#5048e5]/90 transition-all text-sm mb-3">
                View on Solana Explorer
              </a>
              <button onClick={onClose} className="text-sm font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-white">
                Close
              </button>
            </div>
          ) : (
            <>
              {/* Bagian Header UI */}
              <div className="shrink-0 px-6 pt-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                <h1 className="text-xl font-black text-slate-900 dark:text-white tracking-tight pr-8">
                  Complete Your Purchase
                </h1>
                <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
                  Secure your entry with a verified NFT ticket on Solana.
                </p>
              </div>

              {/* Bagian Body UI */}
              <div className="flex-1 overflow-y-auto min-h-0">
                {/* Ticket summary */}
                <div className="px-6 pt-5 pb-0">
                  <div className="flex gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <div
                      className="size-16 shrink-0 rounded-lg bg-center bg-cover bg-no-repeat bg-slate-200"
                      style={{ backgroundImage: `url('${event.heroImageUrl}')` }}
                    />
                    <div className="flex flex-col justify-center gap-1 min-w-0">
                      <span className="inline-flex items-center rounded-full bg-[#5048e5]/10 px-2 py-0.5 text-xs font-semibold text-[#5048e5] w-fit">
                        {ticket.name}
                      </span>
                      <p className="text-slate-900 dark:text-white text-sm font-bold leading-tight truncate">
                        {event.title}
                      </p>
                      <p className="text-slate-500 dark:text-slate-400 text-xs flex items-center gap-1">
                        <span className="material-symbols-outlined text-xs">calendar_today</span>
                        {event.date} • {event.location}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quantity + pricing */}
                <div className="px-6 py-5 space-y-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-900 dark:text-white font-bold text-sm">Quantity</p>
                      <p className="text-slate-400 text-xs">Limit {MAX_QTY} per wallet</p>
                    </div>
                    <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                      <button onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} className="flex h-8 w-8 items-center justify-center rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm hover:bg-slate-50 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                        <span className="material-symbols-outlined text-lg">remove</span>
                      </button>
                      <span className="text-base font-black w-6 text-center text-slate-900 dark:text-white">{qty}</span>
                      <button onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))} disabled={qty >= MAX_QTY || qty >= ticket.available} className="flex h-8 w-8 items-center justify-center rounded-md bg-[#5048e5] text-white shadow-sm hover:bg-[#5048e5]/90 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                        <span className="material-symbols-outlined text-lg">add</span>
                      </button>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-100 dark:border-slate-800 overflow-hidden">
                    <div className="px-4 py-2.5 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Order Summary</p>
                    </div>
                    <div className="px-4 py-3 space-y-2.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">{qty}× {ticket.name}</span>
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {subtotal.toFixed(4).replace(/\.?0+$/, "")} SOL
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
                          <span>Network Fee</span>
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">~{SOLANA_BASE_FEE} SOL</span>
                      </div>
                      <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">Total</p>
                          <p className="text-slate-400 text-xs">≈ ${totalUSD} USD</p>
                        </div>
                        <p className="text-[#5048e5] text-xl font-black">
                          {total.toFixed(4)} SOL
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#5048e5]/5 border border-[#5048e5]/20 rounded-xl p-3.5 flex gap-3">
                    <span className="material-symbols-outlined text-[#5048e5] shrink-0 text-xl mt-0.5">confirmation_number</span>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-200 mb-0.5">On-Chain Ticket Notice</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                        A secure on-chain ticket will be issued directly to your wallet{" "}
                        <span className="font-mono font-medium text-slate-700 dark:text-slate-300">{shortAddress}</span>{" "}
                        as your permanent proof of ownership.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bagian Footer UI */}
              <div className="shrink-0 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-b-2xl space-y-3">
                <button onClick={handlePay} disabled={isPaying || !publicKey} className="w-full bg-[#5048e5] hover:bg-[#5048e5]/90 text-white font-bold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#5048e5]/20 group disabled:opacity-70 disabled:cursor-not-allowed">
                  {isPaying ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-xl">progress_activity</span>
                      Confirming on Solana...
                    </>
                  ) : !publicKey ? (
                    <>Wallet Not Connected</>
                  ) : (
                    <>
                      <span className="material-symbols-outlined group-hover:scale-110 transition-transform">account_balance_wallet</span>
                      Pay with Phantom
                    </>
                  )}
                </button>

                <div className="flex items-center justify-between">
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">
                    Secured by Locketing V2
                  </p>
                  <div className="flex items-center gap-3 text-slate-300 dark:text-slate-600">
                    <span className="text-xs font-bold uppercase">Solana Devnet</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </>,
    document.body
  );
}