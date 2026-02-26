"use client";

import { useState, useCallback } from "react";
import { useAnchorWallet, useConnection, useWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Scanner } from "@yudiel/react-qr-scanner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  getProgram,
  getValidatorPDA,
  validateTicket,
} from "@/lib/program";

interface ScanPayload {
  ticketId: string; 
  owner: string;    
  event: string;    
}

type ValidationState = "idle" | "checking" | "approved" | "denied" | "used" | "confirming" | "success" | "error";

export default function ValidatePage() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const anchorWallet = useAnchorWallet();

  const [isScanning, setIsScanning] = useState(true);
  const [payload, setPayload] = useState<ScanPayload | null>(null);
  const [ticketAccount, setTicketAccount] = useState<any>(null);
  const [eventAccount, setEventAccount] = useState<any>(null);
  const [validationState, setValidationState] = useState<ValidationState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [scannerKey, setScannerKey] = useState(0);

  const handleScan = useCallback(async (result: any) => {
    if (!result || !anchorWallet || !publicKey) return;

    try {
      const rawData = result[0]?.rawValue;
      const parsed: ScanPayload = JSON.parse(rawData);
      if (!parsed.ticketId || !parsed.owner) return;

      setPayload(parsed);
      setIsScanning(false);
      setValidationState("checking");

      const program = getProgram(connection, anchorWallet);
      const ticketPDA = new PublicKey(parsed.ticketId);

      const ticket = await (program.account as any).ticketNftAccount.fetch(ticketPDA);
      setTicketAccount(ticket);

      const event = await (program.account as any).eventAccount.fetch(ticket.event);
        setEventAccount(event);

        const now = Math.floor(Date.now() / 1000);
        const startTs = event.startTime.toNumber();
        const endTs = event.endTime.toNumber();

        if (now < startTs) {
        setValidationState("denied");
        setErrorMsg(
            `Event havent started. Starts at ${new Date(startTs * 1000).toLocaleString("en-US", {
            day: "numeric", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
            })}`
        );
        return;
        }

        if (now > endTs) {
        setValidationState("denied");
        setErrorMsg(
            `Event sudah berakhir sejak ${new Date(endTs * 1000).toLocaleString("en-US", {
            day: "numeric", month: "short", year: "numeric",
            hour: "2-digit", minute: "2-digit",
            })}`
        );
        return;
        }

        if (ticket.isUsed) {
        setValidationState("used");
        } else {
        setValidationState("approved");
        }
    } catch (err: any) {
      console.error("Scan error:", err);
      setValidationState("denied");
      setErrorMsg("Invalid QR code or ticket not found on-chain.");
    }
  }, [anchorWallet, publicKey, connection]);

  const handleConfirmCheckIn = async () => {
    if (!anchorWallet || !publicKey || !payload || !ticketAccount) return;

    setValidationState("confirming");
    try {
      const program = getProgram(connection, anchorWallet);
      const ticketPDA = new PublicKey(payload.ticketId);
      const eventPDA = ticketAccount.event as PublicKey;
      const validatorPDA = getValidatorPDA(eventPDA, publicKey);

      console.log("ticketPDA:", ticketPDA.toBase58());
      console.log("eventPDA:", eventPDA.toBase58());
      console.log("validatorPDA:", validatorPDA.toBase58());
      console.log("validator wallet:", publicKey.toBase58());

      try {
      const vAcc = await (program.account as any).validatorAccount.fetch(validatorPDA);
      console.log("validatorAccount found:", vAcc);
    } catch {
      console.error("validatorAccount NOT found at PDA:", validatorPDA.toBase58());
      console.error("→ Wallet ini belum di-add sebagai validator untuk event ini");
      setValidationState("error");
      setErrorMsg("Wallet ini belum terdaftar sebagai validator untuk event ini. Tambahkan di Dashboard → Validators.");
      return;
    }

      await validateTicket(program, publicKey, validatorPDA, ticketPDA);
      setValidationState("success");
    } catch (err: any) {
      console.error("Check-in error:", err);
      setValidationState("error");
      setErrorMsg(err.message ?? "Transaction failed.");
    }
  };

  const handleReset = () => {
    setPayload(null);
    setTicketAccount(null);
    setEventAccount(null);
    setValidationState("idle");
    setErrorMsg("");
    setIsScanning(true);
    setScannerKey(p => p + 1);
  };

  if (!publicKey) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f6f6f8] dark:bg-black">
        <Header />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <div className="size-20 rounded-2xl bg-[#5048e5]/10 flex items-center justify-center mx-auto mb-5">
              <span className="material-symbols-outlined text-5xl text-[#5048e5]">account_balance_wallet</span>
            </div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-2">Wallet Required</h2>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Connect your authorized validator wallet to access the ticket scanner.
            </p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const startTs = eventAccount?.startTime?.toNumber();
  const endTs   = eventAccount?.endTime?.toNumber();

  return (
    <div className="min-h-screen flex flex-col bg-[#f6f6f8] dark:bg-black">
      <Header />

      <main className="flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-10">
        {/* Page title */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <div className="size-9 rounded-xl bg-[#5048e5] flex items-center justify-center">
              <span className="material-symbols-outlined text-white text-xl">qr_code_scanner</span>
            </div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
              Entry Validation
            </h1>
          </div>
          <p className="text-slate-500 dark:text-slate-400 ml-12">
            Scan attendee QR code to verify and check in.
          </p>
        </div>

        {/* ── Scanner card ── */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden mb-5">
          <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
              <span className="material-symbols-outlined text-base text-[#5048e5]">videocam</span>
              Camera Scanner
            </p>
            {!isScanning && (
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 text-xs font-semibold text-[#5048e5] hover:text-[#5048e5]/80 transition-colors"
              >
                <span className="material-symbols-outlined text-sm">refresh</span>
                Scan Next
              </button>
            )}
          </div>

          <div className="aspect-video bg-slate-950 relative overflow-hidden">
            {isScanning ? (
              <>
                <Scanner
                  key={scannerKey}
                  onScan={handleScan}
                  styles={{ container: { width: "100%", height: "100%" } }}
                />
                {/* Corner guides */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  <div className="size-48 relative">
                    <span className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#5048e5] rounded-tl-lg" />
                    <span className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#5048e5] rounded-tr-lg" />
                    <span className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#5048e5] rounded-bl-lg" />
                    <span className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#5048e5] rounded-br-lg" />
                  </div>
                </div>
              </>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80">
                <div className="size-16 rounded-full bg-[#5048e5]/20 flex items-center justify-center mb-3">
                  <span className="material-symbols-outlined text-4xl text-[#5048e5]">check_circle</span>
                </div>
                <p className="text-white font-bold">QR Captured</p>
                <p className="text-slate-400 text-sm mt-1">Verifying on-chain...</p>
              </div>
            )}
          </div>

          {/* Scanner footer hint */}
          {isScanning && (
            <div className="px-5 py-3 bg-slate-50 dark:bg-slate-800/50 text-center">
              <p className="text-xs text-slate-400">Position the attendee QR code within the frame</p>
            </div>
          )}
        </div>

        {/* ── Result cards (shown after scan) ── */}
        {payload && validationState !== "idle" && (
          <div className="space-y-4">

            {/* Checking state */}
            {validationState === "checking" && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 flex items-center gap-4">
                <span className="material-symbols-outlined animate-spin text-3xl text-[#5048e5]">autorenew</span>
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">Verifying on Solana...</p>
                  <p className="text-sm text-slate-400">Fetching ticket account from devnet</p>
                </div>
              </div>
            )}

            {/* Ticket info card */}
            {ticketAccount && eventAccount && validationState !== "checking" && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Scanned Ticket</p>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h3 className="text-lg font-black text-slate-900 dark:text-white">
                        {eventAccount.name}
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{eventAccount.location}</p>
                    </div>
                    <span className="shrink-0 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold bg-[#5048e5]/10 text-[#5048e5]">
                      {payload.event || "Ticket"}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-0.5">Date</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {startTs ? new Date(startTs * 1000).toLocaleDateString("en-US", {
                          day: "numeric", month: "short", year: "numeric"
                        }) : "—"}
                      </p>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                      <p className="text-xs text-slate-400 mb-0.5">Time</p>
                      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {startTs ? new Date(startTs * 1000).toLocaleTimeString("en-US", {
                          hour: "2-digit", minute: "2-digit"
                        }) : "—"}
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-0.5">Ticket PDA</p>
                    <p className="text-xs font-mono text-slate-600 dark:text-slate-300 break-all">{payload.ticketId}</p>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-3">
                    <p className="text-xs text-slate-400 mb-0.5">Owner Wallet</p>
                    <p className="text-xs font-mono text-slate-600 dark:text-slate-300 break-all">{payload.owner}</p>
                  </div>
                </div>
              </div>
            )}

            {/* ── Validation verdict ── */}
            {(["approved","denied","used","confirming","success","error"] as ValidationState[]).includes(validationState) && (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Validation Result</p>
                </div>
                <div className="p-5 space-y-4">

                  {/* Verdict banner */}
                  {validationState === "approved" && (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <div className="size-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-3xl text-green-600 dark:text-green-400">check_circle</span>
                      </div>
                      <div>
                        <p className="font-black text-green-800 dark:text-green-300 text-lg">APPROVED</p>
                        <p className="text-sm text-green-700 dark:text-green-400">Valid ticket — attendee may enter</p>
                      </div>
                    </div>
                  )}

                  {validationState === "used" && (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                      <div className="size-12 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-3xl text-amber-600 dark:text-amber-400">warning</span>
                      </div>
                      <div>
                        <p className="font-black text-amber-800 dark:text-amber-300 text-lg">ALREADY USED</p>
                        <p className="text-sm text-amber-700 dark:text-amber-400">This ticket has already been validated</p>
                      </div>
                    </div>
                  )}

                  {validationState === "denied" && (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <div className="size-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-400">cancel</span>
                      </div>
                      <div>
                        <p className="font-black text-red-800 dark:text-red-300 text-lg">DENIED</p>
                        <p className="text-sm text-red-700 dark:text-red-400">{errorMsg || "Ticket not found on-chain"}</p>
                      </div>
                    </div>
                  )}

                  {validationState === "confirming" && (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-[#5048e5]/5 border border-[#5048e5]/20">
                      <span className="material-symbols-outlined animate-spin text-3xl text-[#5048e5] shrink-0">progress_activity</span>
                      <div>
                        <p className="font-black text-slate-900 dark:text-white text-lg">Confirming...</p>
                        <p className="text-sm text-slate-500">Sending transaction to Solana</p>
                      </div>
                    </div>
                  )}

                  {validationState === "success" && (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                      <div className="size-12 rounded-full bg-green-100 dark:bg-green-900/40 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-3xl text-green-600 dark:text-green-400">verified</span>
                      </div>
                      <div>
                        <p className="font-black text-green-800 dark:text-green-300 text-lg">CHECK-IN COMPLETE</p>
                        <p className="text-sm text-green-700 dark:text-green-400">Ticket marked as used on-chain</p>
                      </div>
                    </div>
                  )}

                  {validationState === "error" && (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                      <div className="size-12 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-3xl text-red-600 dark:text-red-400">error</span>
                      </div>
                      <div>
                        <p className="font-black text-red-800 dark:text-red-300 text-lg">TRANSACTION FAILED</p>
                        <p className="text-sm text-red-700 dark:text-red-400 wrap-break-word">{errorMsg}</p>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex gap-3">
                    {validationState === "approved" && (
                      <button
                        onClick={handleConfirmCheckIn}
                        className="flex-1 flex items-center justify-center gap-2 bg-[#5048e5] hover:bg-[#5048e5]/90 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-[#5048e5]/20"
                      >
                        <span className="material-symbols-outlined text-xl">how_to_reg</span>
                        Confirm Check-In
                      </button>
                    )}
                    <button
                      onClick={handleReset}
                      className={`flex items-center justify-center gap-2 font-bold py-3 rounded-xl transition-all border ${
                        validationState === "approved"
                          ? "px-4 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                          : "flex-1 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                      }`}
                    >
                      <span className="material-symbols-outlined text-xl">qr_code_scanner</span>
                      {validationState === "success" ? "Scan Next" : "Try Again"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}