"use client";

import { useState, useEffect, useCallback } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { getProgram, addValidator } from "@/lib/program";
import { cachedFetch, invalidateProgramCache } from "@/lib/programCache";

interface ValidatorRow {
  id:        string;
  address:   string;
  eventName: string;
  eventPDA:  string;
}

function shortenAddr(addr: string) {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function ValidatorsTable() {
  const wallet     = useAnchorWallet();
  const { connection } = useConnection();

  const [validators,       setValidators]       = useState<ValidatorRow[]>([]);
  const [events,           setEvents]           = useState<{ pda: string; name: string }[]>([]);
  const [selectedEventPDA, setSelectedEventPDA] = useState("");
  const [input,            setInput]            = useState("");
  const [loading,          setLoading]          = useState(true);
  const [adding,           setAdding]           = useState(false);
  const [copied,           setCopied]           = useState<string | null>(null);
  const [error,            setError]            = useState<string | null>(null);

  const fetchAll = useCallback(async (force = false) => {
    if (!wallet) return;
    setLoading(true);
    try {
      const program = getProgram(connection, wallet);
      const walletKey = wallet.publicKey.toBase58();

      const evCacheKey  = `orgEvents:${walletKey}`;
      const valCacheKey = `validatorAccount`;

      if (force) {
        invalidateProgramCache(evCacheKey);
        invalidateProgramCache(valCacheKey);
      }

      const [rawEvents, rawValidators] = await Promise.all([
        cachedFetch<any[]>(evCacheKey, () =>
          (program.account as any).eventAccount.all([
            { memcmp: { offset: 8, bytes: walletKey } },
          ])
        ),
        cachedFetch<any[]>(valCacheKey, () =>
          (program.account as any).validatorAccount.all()
        ),
      ]);

      const eventList = rawEvents.map((e: any) => ({
        pda:  e.publicKey.toBase58(),
        name: e.account.name,
      }));
      setEvents(eventList);
      if (!selectedEventPDA && eventList.length > 0) {
        setSelectedEventPDA(eventList[0].pda);
      }

      const orgEventPDAs = new Set(eventList.map((e) => e.pda));

      const rows: ValidatorRow[] = rawValidators
        .filter((v: any) => {
          const evPDA = (
            v.account.event ??
            v.account.eventAccount ??
            v.account.eventPubkey
          )?.toBase58();
          return evPDA && orgEventPDAs.has(evPDA);
        })
        .map((v: any) => {
          const evPDA = (
            v.account.event ??
            v.account.eventAccount ??
            v.account.eventPubkey
          )?.toBase58() ?? "";
          return {
            id:        v.publicKey.toBase58(),
            address:   v.account.validator.toBase58(),
            eventName: eventList.find((e) => e.pda === evPDA)?.name ?? "Unknown",
            eventPDA:  evPDA,
          };
        });

      setValidators(rows);
    } catch (err) {
      console.error("Failed to fetch validators:", err);
    } finally {
      setLoading(false);
    }
  }, [wallet, connection, selectedEventPDA]);

  useEffect(() => { fetchAll(); }, [wallet, connection]);

  const handleAdd = async () => {
    setError(null);
    if (!wallet)            { setError("Connect your wallet first."); return; }
    if (!selectedEventPDA)  { setError("Select an event first."); return; }
    const trimmed = input.trim();
    try { new PublicKey(trimmed); } catch { setError("Enter a valid Solana wallet address."); return; }

    setAdding(true);
    try {
      const program = getProgram(connection, wallet);
      await addValidator(program, wallet.publicKey, new PublicKey(selectedEventPDA), new PublicKey(trimmed));
      setInput("");
      await fetchAll(true); // force refresh after write
    } catch (err: any) {
      setError(err.message ?? "Transaction failed.");
    } finally {
      setAdding(false);
    }
  };

  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(address);
    setTimeout(() => setCopied(null), 1500);
  };

  const filtered = selectedEventPDA
    ? validators.filter((v) => v.eventPDA === selectedEventPDA)
    : validators;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Event Validators</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Wallet addresses authorized to scan and validate tickets on-site.
            </p>
          </div>

          <div className="flex flex-col gap-2 w-full md:w-auto">
            <select
              value={selectedEventPDA}
              onChange={(e) => setSelectedEventPDA(e.target.value)}
              className="w-full md:w-80 px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#5048e5] dark:text-slate-100 transition-all"
            >
              <option value="">— Select Event —</option>
              {events.map((ev) => (
                <option key={ev.pda} value={ev.pda}>{ev.name}</option>
              ))}
            </select>

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                  account_balance_wallet
                </span>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => { setInput(e.target.value); setError(null); }}
                  onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                  placeholder="Validator wallet address..."
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-sm outline-none focus:ring-2 focus:ring-[#5048e5] focus:border-transparent transition-all dark:text-slate-100 placeholder-slate-400"
                />
              </div>
              <button
                onClick={handleAdd}
                disabled={adding || !selectedEventPDA}
                className="flex items-center gap-1.5 bg-[#5048e5] hover:bg-[#5048e5]/90 text-white px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {adding
                  ? <span className="material-symbols-outlined text-base animate-spin">progress_activity</span>
                  : <span className="material-symbols-outlined text-base">add</span>}
                {adding ? "Adding..." : "Add"}
              </button>
            </div>
            {error && <p className="text-xs text-red-500 font-medium pl-1">{error}</p>}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="py-12 flex justify-center items-center gap-3">
            <span className="material-symbols-outlined animate-spin text-3xl text-[#5048e5]">autorenew</span>
            <span className="text-slate-500 font-medium text-sm">Loading from Solana...</span>
          </div>
        ) : (
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50">
                {["Wallet Address", "Event", "Status", "Actions"].map((h, i) => (
                  <th key={h} className={`px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 ${i === 3 ? "text-right" : ""}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-slate-400 text-sm">
                    {events.length === 0
                      ? "Create an event first before adding validators."
                      : "No validators yet for this event. Add a wallet address above."}
                  </td>
                </tr>
              ) : filtered.map((v) => (
                <tr key={v.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="size-8 rounded-lg bg-[#5048e5]/10 flex items-center justify-center shrink-0">
                        <span className="material-symbols-outlined text-[#5048e5] text-sm">shield_person</span>
                      </div>
                      <span className="font-mono text-sm font-medium text-slate-700 dark:text-slate-300">
                        {shortenAddr(v.address)}
                      </span>
                      <button onClick={() => handleCopy(v.address)} title="Copy full address" className="text-slate-400 hover:text-[#5048e5] transition-colors">
                        <span className="material-symbols-outlined text-base">
                          {copied === v.address ? "check" : "content_copy"}
                        </span>
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-600 dark:text-slate-400 max-w-40 truncate">
                    {v.eventName}
                  </td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                      <span className="size-1.5 rounded-full bg-green-500" />
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span title="Removal not supported on-chain" className="p-2 text-slate-300 dark:text-slate-700 rounded-lg cursor-not-allowed inline-flex">
                      <span className="material-symbols-outlined text-lg">delete</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20 flex items-center justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          {filtered.length} validator{filtered.length !== 1 ? "s" : ""} authorized
          {selectedEventPDA && events.find(e => e.pda === selectedEventPDA)
            ? ` for "${events.find(e => e.pda === selectedEventPDA)?.name}"`
            : ""}
        </p>
        <p className="text-xs text-slate-400 font-mono">Solana Devnet</p>
      </div>
    </div>
  );
}