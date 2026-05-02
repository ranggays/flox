"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import ThemeToggle from "@/components/ThemeToggle";
import ConnectWalletButton from "@/components/ConnectWalletButton";
import { useIsValidator } from "@/hooks/useIsValidator";

interface WorkspaceShellProps {
  eyebrow: string;
  title: string;
  description?: string;
  children: ReactNode;
  headerActions?: ReactNode;
  contentClassName?: string;
  contentScrollMode?: "page" | "contained";
}

interface NavItem {
  label: string;
  href: string;
  description: string;
  icon: string;
}

const BASE_NAV_ITEMS: NavItem[] = [
  {
    label: "AI Home",
    href: "/",
    description: "Start with AI-led guidance and route orchestration.",
    icon: "auto_awesome",
  },
  {
    label: "Discover",
    href: "/discover",
    description: "Browse the live event catalog directly.",
    icon: "travel_explore",
  },
  {
    label: "My Tickets",
    href: "/my-tickets",
    description: "Review owned tickets, status, and QR access.",
    icon: "confirmation_number",
  },
  {
    label: "Organizer",
    href: "/dashboard",
    description: "Check organizer performance and event operations.",
    icon: "dashboard",
  },
];

function shortenAddress(address: string) {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function isItemActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/" || pathname === "/prototypes/chat-home";
  if (href === "/dashboard") return pathname.startsWith("/dashboard");
  return pathname === href;
}

function NavigationContent({
  pathname,
  connected,
  publicKey,
  walletName,
  balanceDisplay,
  showValidationRoute,
  onDisconnect,
  onNavigate,
}: {
  pathname: string;
  connected: boolean;
  publicKey: string | null;
  walletName: string | null;
  balanceDisplay: string;
  showValidationRoute: boolean;
  onDisconnect: () => void;
  onNavigate?: () => void;
}) {
  const address = publicKey ?? "";
  const initials = address ? address.slice(0, 2).toUpperCase() : "FL";
  const navItems = showValidationRoute
    ? [
        ...BASE_NAV_ITEMS,
        {
          label: "Validate",
          href: "/validate",
          description: "Use validator check-in and ticket scan tools.",
          icon: "qr_code_scanner",
        },
      ]
    : BASE_NAV_ITEMS;

  return (
    <>
      <div className="border-b border-slate-200 p-4 dark:border-zinc-800/80">
        <Link
          href="/"
          onClick={onNavigate}
          className="flex items-center gap-3 rounded-xl px-2 py-1"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--flox-primary)] text-[var(--flox-primary-foreground)]">
            <span className="material-symbols-outlined text-xl">airwave</span>
          </div>
          <div>
            <p className="text-base font-semibold text-slate-900 dark:text-zinc-100">
              Flox
            </p>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              AI event concierge
            </p>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-3 px-2 text-[11px] uppercase tracking-[0.18em] text-slate-400 dark:text-zinc-500">
          Workspaces
        </div>
        <nav className="space-y-2">
          {navItems.map((item) => {
            const active = isItemActive(pathname, item.href);

            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onNavigate}
                className={`block rounded-2xl border px-4 py-3 transition ${
                  active
                    ? "border-slate-900 bg-slate-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-zinc-800 dark:bg-[#171717] dark:text-zinc-200 dark:hover:border-zinc-700 dark:hover:bg-[#1d1d1d]"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-lg">
                    {item.icon}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold">{item.label}</p>
                    <p
                      className={`mt-1 text-xs leading-5 ${
                        active
                          ? "text-slate-200 dark:text-zinc-700"
                          : "text-slate-500 dark:text-zinc-400"
                      }`}
                    >
                      {item.description}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="border-t border-slate-200 p-3 dark:border-zinc-800/80">
        {!connected || !publicKey ? (
          <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-[#171717]">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-slate-700 text-sm font-medium text-white dark:bg-zinc-700">
                F
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-zinc-100">
                  Flox
                </p>
                <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
                  Connect a wallet for ticket and organizer context
                </p>
              </div>
            </div>
            <ConnectWalletButton className="w-full justify-center rounded-xl bg-[var(--flox-primary)] px-4 py-3 text-sm font-semibold text-[var(--flox-primary-foreground)] shadow-none hover:opacity-90" />
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3 dark:border-zinc-800 dark:bg-[#171717]">
            <div className="flex items-center gap-3">
              <div className="relative h-9 w-9">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-tr from-[var(--flox-primary)] to-blue-400 text-sm font-bold text-[var(--flox-primary-foreground)]">
                  {initials}
                </div>
                <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border border-slate-50 bg-green-500 dark:border-[#171717]" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-xs text-slate-500 dark:text-zinc-400">
                  {walletName ?? "Wallet"}
                </p>
                <p className="truncate text-sm font-medium text-slate-900 dark:text-zinc-100">
                  {shortenAddress(address)}
                </p>
              </div>
            </div>

            <div className="mt-3 rounded-lg border border-slate-200 bg-white px-3 py-2.5 dark:border-zinc-800 dark:bg-[#0f0f0f]">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-slate-500 dark:text-zinc-400">
                  Balance
                </span>
                <span className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  {balanceDisplay}
                </span>
              </div>
            </div>

            <div className="mt-3 flex items-center gap-2">
              <Link
                href="/my-tickets"
                onClick={onNavigate}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-center text-xs font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:border-zinc-800 dark:text-zinc-300 dark:hover:bg-[#212121] dark:hover:text-white"
              >
                My Tickets
              </Link>
              <button
                onClick={onDisconnect}
                className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-900 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-[#212121] dark:hover:text-white"
              >
                Disconnect
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

export default function WorkspaceShell({
  eyebrow,
  title,
  description,
  children,
  headerActions,
  contentClassName,
  contentScrollMode = "page",
}: WorkspaceShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const { connection } = useConnection();
  const { publicKey, connected, disconnect, wallet } = useWallet();
  const { isValidator } = useIsValidator();
  const walletAddress = publicKey?.toBase58() ?? null;
  const balanceDisplay = balance !== null ? `${balance.toFixed(4)} SOL` : "...";

  useEffect(() => {
    let cancelled = false;

    const updateBalance = async () => {
      if (!publicKey) {
        if (!cancelled) setBalance(null);
        return;
      }

      try {
        const lamports = await connection.getBalance(publicKey);
        if (!cancelled) {
          setBalance(lamports / LAMPORTS_PER_SOL);
        }
      } catch {
        if (!cancelled) {
          setBalance(null);
        }
      }
    };

    void updateBalance();
    const interval = setInterval(() => {
      void updateBalance();
    }, 30_000);

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [publicKey, connection]);

  useEffect(() => {
    if (!menuOpen) return;

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [menuOpen]);

  return (
    <main className="h-screen bg-[#f3f1eb] text-slate-900 dark:bg-[#121212] dark:text-zinc-100">
      <div className="flex h-full w-full overflow-hidden">
        <aside className="hidden h-full min-h-0 w-[320px] shrink-0 flex-col border-r border-slate-200 bg-[#fbfaf7] dark:border-zinc-800/80 dark:bg-[#101010] lg:flex">
          <NavigationContent
            pathname={pathname}
            connected={connected}
            publicKey={walletAddress}
            walletName={wallet?.adapter.name ?? null}
            balanceDisplay={balanceDisplay}
            showValidationRoute={isValidator}
            onDisconnect={() => disconnect()}
          />
        </aside>

        <section className="relative flex h-full min-h-0 flex-1 flex-col bg-[#f3f1eb] dark:bg-[#121212]">
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-[#fbfaf7] px-4 py-4 sm:px-6 lg:px-8 dark:border-zinc-800/80 dark:bg-[#121212]">
            <div className="flex min-w-0 items-start gap-3">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                className="mt-0.5 inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 lg:hidden dark:border-zinc-700 dark:bg-[#1d1d1d] dark:text-zinc-300"
              >
                <span className="material-symbols-outlined text-lg">menu</span>
              </button>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-zinc-500">
                  {eyebrow}
                </p>
                <h1 className="mt-1 text-lg font-semibold tracking-tight text-slate-900 dark:text-zinc-100">
                  {title}
                </h1>
                {description && (
                  <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500 dark:text-zinc-400">
                    {description}
                  </p>
                )}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <div className="rounded-lg border border-slate-200 bg-white dark:border-zinc-700 dark:bg-[#1d1d1d]">
                <ThemeToggle />
              </div>
              {headerActions}
            </div>
          </header>

          {menuOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <button
                type="button"
                aria-label="Close navigation"
                onClick={() => setMenuOpen(false)}
                className="absolute inset-0 bg-slate-950/40"
              />
              <aside className="relative z-10 flex h-full w-[320px] max-w-[88vw] flex-col border-r border-slate-200 bg-[#fbfaf7] shadow-2xl dark:border-zinc-800 dark:bg-[#101010]">
                <NavigationContent
                  pathname={pathname}
                  connected={connected}
                  publicKey={walletAddress}
                  walletName={wallet?.adapter.name ?? null}
                  balanceDisplay={balanceDisplay}
                  showValidationRoute={isValidator}
                  onDisconnect={() => {
                    setMenuOpen(false);
                    disconnect();
                  }}
                  onNavigate={() => setMenuOpen(false)}
                />
              </aside>
            </div>
          )}

          <section
            className={`min-h-0 flex-1 ${
              contentScrollMode === "contained" ? "overflow-hidden" : "overflow-y-auto"
            }`}
          >
            <div
              className={
                contentClassName ??
                "mx-auto flex w-full max-w-7xl flex-col px-4 py-8 sm:px-6 lg:px-8"
              }
            >
              {children}
            </div>
          </section>
        </section>
      </div>
    </main>
  );
}
