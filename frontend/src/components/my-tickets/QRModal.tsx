"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useWallet } from "@solana/wallet-adapter-react";
import QRCode from "qrcode";
import type { MyTicket } from "@/lib/types";

interface QRModalProps {
  ticket: MyTicket;
  onClose: () => void;
}

export default function QRModal({ ticket, onClose }: QRModalProps) {
  const { publicKey } = useWallet();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const payload = JSON.stringify({
      ticketId: ticket.id,
      owner: publicKey?.toBase58() ?? "unknown",
      event: ticket.title,
    });

    QRCode.toCanvas(canvasRef.current, payload, {
      width: 220,
      margin: 2,
      color: {
        dark: "#0f172a",
        light: "#ffffff",
      },
    });
  }, [ticket, publicKey]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handler);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const shortAddress = publicKey
    ? `${publicKey.toBase58().slice(0, 6)}...${publicKey.toBase58().slice(-4)}`
    : "Unknown Wallet";

  return createPortal(
    <div
      className="fixed inset-0 z-999 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 flex items-center justify-center size-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white transition-all"
        >
          <span className="material-symbols-outlined text-lg">close</span>
        </button>

        {/* Header strip with event image */}
        <div className="relative h-28 overflow-hidden">
          <img
            src={ticket.imageUrl}
            alt={ticket.imageAlt}
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-linear-to-b from-black/20 to-black/70" />
          <div className="absolute bottom-3 left-4">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#5048e5] text-white text-[10px] font-bold uppercase tracking-widest mb-1">
              <span className="material-symbols-outlined text-xs">confirmation_number</span>
              Entry Pass
            </span>
            <p className="text-white font-black text-base leading-tight drop-shadow">{ticket.title}</p>
          </div>
        </div>

        {/* QR area */}
        <div className="flex flex-col items-center px-6 py-6 gap-4">
          {/* QR code canvas */}
          <div className="p-3 bg-white rounded-xl shadow-inner border border-slate-100">
            <canvas ref={canvasRef} className="rounded-lg" />
          </div>

          {/* Ticket details */}
          <div className="w-full space-y-2 text-sm">
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                Date
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{ticket.date}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">schedule</span>
                Time
              </span>
              <span className="font-semibold text-slate-700 dark:text-slate-200">{ticket.time}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">category</span>
                Tier
              </span>
              <span className="font-semibold text-[#5048e5]">{ticket.category}</span>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-400 flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
                Wallet
              </span>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">{shortAddress}</span>
            </div>
          </div>

          {/* Warning */}
          <div className="w-full flex items-center gap-2 bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 rounded-xl px-3 py-2.5">
            <span className="material-symbols-outlined text-red-500 text-lg shrink-0">warning</span>
            <p className="text-xs font-bold text-red-500 dark:text-red-400">
              DO NOT share this QR code. It grants entry to the event.
            </p>
          </div>

          {/* Verified badge */}
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="material-symbols-outlined text-[#5048e5] text-sm">verified</span>
            Verified on-chain · Locketing V2 · Solana Devnet
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}