"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useIsValidator } from "@/hooks/useIsValidator";
import ConnectWalletButton from "@/components/ConnectWalletButton";

const baseNavLinks = [
  { label: "Explore",     href: "/" },
  { label: "My Tickets",  href: "/my-tickets" },
  { label: "Marketplace", href: "#" },
];

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export default function Header() {
  const pathname = usePathname();
  const { publicKey, disconnect, connected, wallet } = useWallet();
  const { setVisible } = useWalletModal();
  const { connection } = useConnection();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { isValidator } = useIsValidator();

  const fetchBalance = useCallback(async () => {
    if (!publicKey) return;
    try {
      const lamports = await connection.getBalance(publicKey);
      setBalance(lamports / LAMPORTS_PER_SOL);
    } catch {
      setBalance(null);
    }
  }, [publicKey, connection]);

  useEffect(() => {
    fetchBalance();
    const interval = setInterval(fetchBalance, 30_000);
    return () => clearInterval(interval);
  }, [fetchBalance]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const address = publicKey?.toBase58() ?? "";
  const initials = address ? address.slice(0, 2).toUpperCase() : "??";
  const balanceDisplay = balance !== null ? `${balance.toFixed(4)} SOL` : "...";

  const navLinks: { label: string; href: string; badge?: boolean }[] = [
    ...baseNavLinks,
    ...(isValidator
      ? [{ label: "Validate Tickets", href: "/validate", badge: true }]
      : []),
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 dark:bg-black backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 shrink-0">
            <div className="bg-[#5048e5] text-white p-1.5 rounded-lg flex items-center justify-center">
              <span className="material-symbols-outlined text-xl">airwave</span>
            </div>
            <span className="text-xl font-black tracking-tight text-slate-900 dark:text-white">
              Flox
            </span>
          </Link>

          {/* Center nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(({ label, href, badge }) => {
              const isActive = pathname === href;
              return (
                <Link
                  key={label}
                  href={href}
                  className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                    isActive
                      ? "bg-[#5048e5]/10 text-[#5048e5] font-semibold"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  {badge && (
                    <span className="material-symbols-outlined text-base text-[#5048e5]">
                      qr_code_scanner
                    </span>
                  )}
                  {label}
                  {badge && (
                    <span className="absolute -top-1 -right-1 size-2 rounded-full bg-green-500 border border-white dark:border-black" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {!connected && <ConnectWalletButton />}
            
            {/* Connected: chip + dropdown */}
            {connected && publicKey && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setDropdownOpen((o) => !o)}
                  className="flex items-center gap-2 pl-3 pr-2 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-black hover:border-[#5048e5]/40 transition-all"
                >
                  <span className="text-xs font-mono font-semibold text-slate-700 dark:text-slate-300 hidden sm:block">
                    {shortenAddress(address)}
                  </span>
                  <div className="relative size-7">
                    <div className="size-7 rounded-full bg-linear-to-tr from-[#5048e5] to-purple-400 flex items-center justify-center text-white text-xs font-bold">
                      {initials}
                    </div>
                    <div className="absolute bottom-0 right-0 size-2 bg-green-500 border border-white dark:border-slate-900 rounded-full" />
                  </div>
                  <span className={`material-symbols-outlined text-slate-400 text-sm transition-transform ${dropdownOpen ? "rotate-180" : ""}`}>
                    expand_more
                  </span>
                </button>

                {dropdownOpen && (
                  <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-black rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden z-50">

                    {/* Wallet info */}
                    <div className="px-4 py-3 bg-[#5048e5]/5 border-b border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="size-9 rounded-full bg-linear-to-tr from-[#5048e5] to-purple-400 flex items-center justify-center text-white text-sm font-bold shrink-0">
                          {initials}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              {wallet?.adapter.name ?? "Wallet"}
                            </p>
                            {/* Validator badge */}
                            {isValidator && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-[#5048e5]/10 text-[#5048e5] text-[9px] font-black uppercase tracking-wide">
                                <span className="material-symbols-outlined text-[10px]">verified</span>
                                Validator
                              </span>
                            )}
                          </div>
                          <p className="text-sm font-mono font-semibold text-slate-900 dark:text-white truncate">
                            {shortenAddress(address)}
                          </p>
                        </div>
                      </div>

                      {/* Balance */}
                      <div className="mt-3 flex items-center justify-between p-2.5 bg-white dark:bg-black rounded-lg border border-slate-100 dark:border-slate-700">
                        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
                          <span className="material-symbols-outlined text-base">toll</span>
                          <span className="text-xs font-medium">Balance</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-black text-[#5048e5]">{balanceDisplay}</span>
                          <button
                            onClick={fetchBalance}
                            className="text-slate-400 hover:text-[#5048e5] transition-colors"
                            aria-label="Refresh balance"
                          >
                            <span className="material-symbols-outlined text-sm">refresh</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="py-1">
                      <Link href="/my-tickets" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <span className="material-symbols-outlined text-slate-400 text-base">confirmation_number</span>
                        My Tickets
                      </Link>
                      <Link href="/dashboard" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <span className="material-symbols-outlined text-slate-400 text-base">dashboard</span>
                        Organizer Dashboard
                      </Link>

                      {/* Validate Tickets — only for validators */}
                      {isValidator && (
                        <Link href="/validate" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#5048e5] font-semibold hover:bg-[#5048e5]/5 transition-colors">
                          <span className="material-symbols-outlined text-base">qr_code_scanner</span>
                          Validate Tickets
                        </Link>
                      )}

                      <Link href="#" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                        <span className="material-symbols-outlined text-slate-400 text-base">settings</span>
                        Settings
                      </Link>
                    </div>

                    {/* Disconnect */}
                    <div className="border-t border-slate-100 dark:border-slate-800 py-1">
                      <button
                        onClick={() => { disconnect(); setDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <span className="material-symbols-outlined text-base">logout</span>
                        Disconnect Wallet
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}