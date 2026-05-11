import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";

const HOW_IT_WORKS = [
  {
    title: "Start with intent",
    description:
      "Tell Flox what you need, or jump directly into discovery, ticket ownership, or organizer operations.",
    icon: "ads_click",
  },
  {
    title: "Transact on Solana",
    description:
      "Ticket purchase, escrow, organizer stake, and ownership records run through the on-chain workflow.",
    icon: "currency_exchange",
  },
  {
    title: "Validate with confidence",
    description:
      "Owned tickets stay wallet-linked and can be checked at the venue through QR-based validation.",
    icon: "verified",
  },
];

const WORKSPACES = [
  {
    title: "AI Home",
    description:
      "The app's orchestration surface for discovery prompts, tier comparison, wallet summaries, and next-step routing.",
    href: "/app",
    icon: "auto_awesome",
  },
  {
    title: "Discover",
    description:
      "Browse the live event catalog directly once you know you want the visual marketplace flow.",
    href: "/discover",
    icon: "travel_explore",
  },
  {
    title: "Organizer",
    description:
      "Create events, monitor performance, and manage operational workflows after the event plan is decided.",
    href: "/dashboard",
    icon: "dashboard",
  },
];

const TRUST_POINTS = [
  "Wallet-based ticket ownership instead of email-only records",
  "Escrow-backed payment flow before organizer withdrawal",
  "Validator scanning for event-entry confirmation",
  "Low-fee Solana transactions and transparent activity history",
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-[#f6f6f8] text-slate-900 dark:bg-black dark:text-slate-100">
      <section className="border-b border-slate-200/80 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-black/90">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--flox-primary)] text-[var(--flox-primary-foreground)]">
              <span className="material-symbols-outlined text-xl">airwave</span>
            </div>
            <div>
              <p className="text-base font-semibold tracking-tight">Flox</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                AI-guided Web3 ticketing
              </p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#111111]">
              <ThemeToggle />
            </div>
            <Link
              href="/docs"
              className="hidden rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-[#171717] sm:inline-flex"
            >
              Docs
            </Link>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--flox-primary)] px-4 py-2.5 text-sm font-semibold text-[var(--flox-primary-foreground)] transition hover:opacity-90"
            >
              Launch App
              <span className="material-symbols-outlined text-base">north_east</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] lg:px-8 lg:py-20">
        <div className="max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--flox-primary)]">
            Public Landing
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
            Event discovery, ticket ownership, and organizer workflow in one Solana product.
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
            Flox combines a public event marketplace with an AI-guided app flow. Visitors can
            understand how the product works first, then open the app to discover events, compare
            tiers, review owned tickets, or operate an organizer dashboard.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/app"
              className="inline-flex items-center gap-2 rounded-2xl bg-[var(--flox-primary)] px-5 py-3 text-sm font-semibold text-[var(--flox-primary-foreground)] transition hover:opacity-90"
            >
              Open Flox AI
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </Link>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:text-slate-200 dark:hover:bg-[#171717]"
            >
              Browse Catalog
              <span className="material-symbols-outlined text-base">travel_explore</span>
            </Link>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-white p-6 shadow-[0_24px_60px_rgba(80,72,229,0.08)] dark:border-slate-800 dark:bg-[#101010] dark:shadow-[0_24px_60px_rgba(0,0,0,0.28)]">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--flox-primary)]">
            What the app does
          </p>
          <div className="mt-5 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#171717]">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Buyer flow
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Discover events, compare tiers, mint tickets, and keep ownership attached to the
                wallet.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#171717]">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                Organizer flow
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Create events, manage ticket tiers, review performance, and withdraw after event
                completion.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-[#171717]">
              <p className="text-sm font-semibold text-slate-900 dark:text-white">
                AI guidance
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
                Use AI Home inside the app when you want help deciding what to open next instead of
                navigating the product blind.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-6 sm:px-6 lg:px-8">
        <div className="grid gap-4 md:grid-cols-3">
          {HOW_IT_WORKS.map((item) => (
            <div
              key={item.title}
              className="rounded-[28px] border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-[#101010]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--flox-primary-soft)] text-[var(--flox-primary)]">
                <span className="material-symbols-outlined text-xl">{item.icon}</span>
              </div>
              <h2 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">
                {item.title}
              </h2>
              <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto grid w-full max-w-7xl gap-8 px-4 py-16 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:px-8">
        <div className="rounded-[32px] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-[#101010]">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--flox-primary)]">
            How it works
          </p>
          <div className="mt-6 space-y-5">
            <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
              <p className="text-base font-semibold text-slate-950 dark:text-white">
                1. Understand the product
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                Flox is a Web3 ticketing product with buyer, organizer, and validator workflows on
                Solana.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
              <p className="text-base font-semibold text-slate-950 dark:text-white">
                2. Enter the app
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                Open the app when you want the AI-led entry flow or direct access to discovery and
                dashboard routes.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 p-5 dark:border-slate-800">
              <p className="text-base font-semibold text-slate-950 dark:text-white">
                3. Connect your wallet
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-600 dark:text-slate-300">
                Wallet connection unlocks owned-ticket context, organizer metrics, and transaction
                execution.
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-[32px] border border-slate-200 bg-slate-950 p-8 text-white dark:border-slate-800">
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-200">
            Why Web3 fits here
          </p>
          <ul className="mt-6 space-y-4">
            {TRUST_POINTS.map((point) => (
              <li
                key={point}
                className="flex items-start gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-4"
              >
                <span className="material-symbols-outlined mt-0.5 text-base text-blue-200">
                  check_circle
                </span>
                <span className="text-sm leading-7 text-slate-100">{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto w-full max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="rounded-[36px] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-[#101010]">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[var(--flox-primary)]">
                Product surfaces
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
                Choose the surface that matches how much guidance you need.
              </h2>
            </div>
            <Link
              href="/app"
              className="inline-flex items-center gap-2 self-start rounded-2xl bg-[var(--flox-primary)] px-5 py-3 text-sm font-semibold text-[var(--flox-primary-foreground)] transition hover:opacity-90"
            >
              Launch Flox App
              <span className="material-symbols-outlined text-base">north_east</span>
            </Link>
          </div>

          <div className="mt-8 grid gap-4 lg:grid-cols-3">
            {WORKSPACES.map((workspace) => (
              <Link
                key={workspace.title}
                href={workspace.href}
                className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 transition hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-[0_16px_36px_rgba(80,72,229,0.08)] dark:border-slate-800 dark:bg-[#171717] dark:hover:border-slate-700"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--flox-primary)] text-[var(--flox-primary-foreground)]">
                  <span className="material-symbols-outlined text-xl">{workspace.icon}</span>
                </div>
                <h3 className="mt-4 text-xl font-semibold text-slate-950 dark:text-white">
                  {workspace.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {workspace.description}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
