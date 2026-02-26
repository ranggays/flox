"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { useAgentData } from "@/context/AgentDataContext";

interface Preferences {
  categories: string[];
  eventType:  "all" | "physical" | "virtual";
  language:   "en" | "id";
}

const CATEGORIES  = ["Music", "Technology", "Sports", "Art", "Hackathon", "Workshop", "Conference"];
const SUGGESTIONS = [
  "What events are available?",
  "How do I buy a ticket?",
  "What is the escrow system?",
  "Show my ticket status",
];

const WELCOME_MESSAGE = {
  id:    "welcome",
  role:  "assistant" as const,
  parts: [{
    type: "text" as const,
    text: "Hey! I'm your Flox AI assistant. I can tell you about events, ticket availability, revenue stats, and how the platform works. What's on your mind?",
  }],
};

export default function FloatingAgent() {
  const [isOpen,     setIsOpen]     = useState(false);
  const [activeTab,  setActiveTab]  = useState<"chat" | "preferences">("chat");
  const [localInput, setLocalInput] = useState("");
  const [prefs,      setPrefs]      = useState<Preferences>({
    categories: [],
    eventType:  "all",
    language:   "en",
  });

  const [pos,        setPos]        = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragMoved,  setDragMoved]  = useState(false);
  const dragStart      = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { publicKey }                    = useWallet();
  const { events, organizerData, userTickets } = useAgentData();

  const buildSystemPrompt = useCallback(() => {
    const eventSummary = events.length > 0
      ? events.map((ev) => {
          const tierLines = ev.tiers.length > 0
            ? ev.tiers.map(t =>
                `    • ${t.name}: ${t.priceSol} SOL — ${t.available}/${t.maxSupply} available`
              ).join("\n")
            : "    • No tiers configured";

          return [
            `[ID:${ev.id}] "${ev.name}"`,
            `  ${ev.category} | ${ev.type} | ${ev.status}`,
            `  Location : ${ev.location}`,
            `  Date     : ${new Date(ev.startTime * 1000).toLocaleDateString()} – ${new Date(ev.endTime * 1000).toLocaleDateString()}`,
            `  Sold     : ${ev.sold} tickets | Revenue: ${ev.revenue} SOL | Available: ${ev.available}`,
            `  URL      : /events/${ev.id}`,
            `  Tiers    :\n${tierLines}`,
          ].join("\n");
        }).join("\n\n")
      : "No events loaded yet.";

    const organizerSection = organizerData
      ? [
          "ORGANIZER STATS (current wallet):",
          `  Escrow locked    : ${organizerData.escrowLocked.toFixed(3)} SOL`,
          `  Escrow available : ${organizerData.escrowAvailable.toFixed(3)} SOL`,
          `  Total revenue    : ${organizerData.totalRevenue} SOL`,
          `  Total sold       : ${organizerData.totalSold} tickets`,
          `  Active events    : ${organizerData.eventCount}`,
        ].join("\n")
      : "";

    const ticketSection = userTickets.length > 0
      ? [
          `USER TICKETS (${userTickets.length} total):`,
          ...userTickets.map(t =>
            `  - "${t.title}" | ${t.date} | Status: ${t.status} | Category: ${t.category}`
          ),
        ].join("\n")
      : "";

    const walletInfo = publicKey
      ? `Wallet: ${publicKey.toBase58().slice(0, 8)}... (connected)`
      : "Wallet: not connected";

    const prefContext = prefs.categories.length > 0
      ? `User prefers: ${prefs.categories.join(", ")} | Format: ${prefs.eventType}`
      : "";

    return `You are a helpful assistant for Flox, a Solana-based event ticketing platform.

PLATFORM:
- Network: Solana Devnet
- Tickets are on-chain PDAs (not NFTs)
- Organizers stake 0.05 SOL (refundable) to create events
- Revenue held in escrow, released to organizer after event ends
- Validators scan QR codes to mark tickets as used

${walletInfo}
${prefContext ? prefContext + "\n" : ""}
LIVE ON-CHAIN EVENTS (${events.length} total):
${eventSummary}
${organizerSection ? "\n" + organizerSection : ""}${ticketSection ? "\n\n" + ticketSection : ""}

RULES:
- Be concise, max 150 words unless detail needed
- Always link events as /events/[id] with tier prices
- Cannot execute transactions — direct user to event page
- For organizer/escrow data: only answer if wallet connected and data available
- ${prefs.language === "id" ? "Respond in Bahasa Indonesia." : "Respond in English."}`;
  }, [events, organizerData, userTickets, publicKey, prefs]);

  const { messages, sendMessage, status } = useChat({
    transport: new DefaultChatTransport({ api: "/api/chat" }),
  });

  const isLoading  = status === "streaming" || status === "submitted";
  const allMessages = [WELCOME_MESSAGE, ...messages];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [allMessages.length]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragMoved(false);
    dragStart.current = { mx: e.clientX, my: e.clientY, px: pos.x, py: pos.y };
    e.preventDefault();
  }, [pos]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - dragStart.current.mx;
      const dy = e.clientY - dragStart.current.my;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) setDragMoved(true);
      setPos({ x: dragStart.current.px + dx, y: dragStart.current.py + dy });
    };
    const onUp = () => setIsDragging(false);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup",   onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [isDragging]);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    const t = e.touches[0];
    setIsDragging(true);
    setDragMoved(false);
    dragStart.current = { mx: t.clientX, my: t.clientY, px: pos.x, py: pos.y };
  }, [pos]);

  useEffect(() => {
    const onMove = (e: TouchEvent) => {
      if (!isDragging) return;
      const t  = e.touches[0];
      const dx = t.clientX - dragStart.current.mx;
      const dy = t.clientY - dragStart.current.my;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) setDragMoved(true);
      setPos({ x: dragStart.current.px + dx, y: dragStart.current.py + dy });
    };
    const onEnd = () => setIsDragging(false);
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend",  onEnd);
    return () => { window.removeEventListener("touchmove", onMove); window.removeEventListener("touchend", onEnd); };
  }, [isDragging]);

  const toggleCategory = (cat: string) =>
    setPrefs(p => ({
      ...p,
      categories: p.categories.includes(cat)
        ? p.categories.filter(c => c !== cat)
        : [...p.categories, cat],
    }));

  const handleSend = (text?: string) => {
    const content = text ?? localInput.trim();
    if (!content || isLoading) return;
    sendMessage({ text: content }, { body: { system: buildSystemPrompt() } });
    setLocalInput("");
  };

  const getMessageText = (msg: any): string =>
    msg.parts
      ? msg.parts.filter((p: any) => p.type === "text").map((p: any) => p.text).join("")
      : msg.content ?? "";

  return (
    <div
      className="fixed z-9999 select-none"
      style={{ bottom: `${24 - pos.y}px`, right: `${24 - pos.x}px` }}
    >
      {isOpen && (
        <div
          className="absolute bottom-20 right-0 w-90 bg-white dark:bg-slate-950 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col"
          style={{ height: "520px" }}
        >
          {/* Header */}
          <div className="shrink-0 bg-linear-to-r from-[#5048e5] to-violet-500 p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-white/20 flex items-center justify-center">
                  <span className="material-symbols-outlined text-white text-lg">auto_awesome</span>
                </div>
                <div>
                  <p className="text-white font-black text-sm leading-tight">FLox AI</p>
                  <div className="flex items-center gap-1">
                    <span className="size-1.5 rounded-full bg-green-400 animate-pulse" />
                    <p className="text-white/70 text-[10px]">
                      {events.length > 0 ? `${events.length} events · Gemini` : "Online · Gemini"}
                    </p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="size-7 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-white text-sm">close</span>
              </button>
            </div>
            <div className="flex bg-black/20 rounded-xl p-1 gap-1">
              {(["chat", "preferences"] as const).map(tab => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`flex-1 text-xs font-bold py-1.5 rounded-lg transition-all ${
                    activeTab === tab ? "bg-white text-[#5048e5] shadow-sm" : "text-white/70 hover:text-white"
                  }`}>
                  {tab === "chat" ? "Chat" : "Preferences"}
                </button>
              ))}
            </div>
          </div>

          {/* Chat Tab */}
          {activeTab === "chat" && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-950">
                {allMessages.map(msg => (
                  <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    {msg.role === "assistant" && (
                      <div className="size-7 rounded-full bg-linear-to-br from-[#5048e5] to-violet-500 flex items-center justify-center shrink-0 mt-0.5">
                        <span className="material-symbols-outlined text-white text-sm">auto_awesome</span>
                      </div>
                    )}
                    <div className={`max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"} flex flex-col`}>
                      <div className={`px-3 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === "user"
                          ? "bg-[#5048e5] text-white rounded-tr-sm"
                          : "bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-100 dark:border-slate-700 rounded-tl-sm"
                      }`}>
                        {getMessageText(msg)}
                      </div>
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex gap-2.5">
                    <div className="size-7 rounded-full bg-linear-to-br from-[#5048e5] to-violet-500 flex items-center justify-center shrink-0">
                      <span className="material-symbols-outlined text-white text-sm">auto_awesome</span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                      {[0, 150, 300].map(d => (
                        <span key={d} className="size-1.5 rounded-full bg-[#5048e5] animate-bounce"
                          style={{ animationDelay: `${d}ms` }} />
                      ))}
                    </div>
                  </div>
                )}

                {allMessages.length === 1 && !isLoading && (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {SUGGESTIONS.map(s => (
                      <button key={s} onClick={() => handleSend(s)}
                        className="text-xs px-3 py-1.5 rounded-full border border-[#5048e5]/30 text-[#5048e5] bg-[#5048e5]/5 hover:bg-[#5048e5]/10 transition-colors font-medium">
                        {s}
                      </button>
                    ))}
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="shrink-0 p-3 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-950">
                <div className="flex items-center gap-2 bg-slate-50 dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 px-3 py-2 focus-within:border-[#5048e5] transition-colors">
                  <input
                    value={localInput}
                    onChange={e => setLocalInput(e.target.value)}
                    onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }}}
                    placeholder="Ask about events, tickets, revenue..."
                    disabled={isLoading}
                    className="flex-1 text-sm bg-transparent outline-none text-slate-900 dark:text-slate-100 placeholder-slate-400 disabled:opacity-50"
                  />
                  <button onClick={() => handleSend()} disabled={!localInput.trim() || isLoading}
                    className="size-8 rounded-lg bg-[#5048e5] flex items-center justify-center hover:bg-[#5048e5]/90 transition-all disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                    <span className="material-symbols-outlined text-white text-sm">send</span>
                  </button>
                </div>
                <p className="text-center text-[10px] text-slate-400 mt-2">Powered by AI · Solana Devnet</p>
              </div>
            </>
          )}

          {/* Preferences Tab */}
          {activeTab === "preferences" && (
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-950 space-y-5">
              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Favorite Categories</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map(cat => (
                    <button key={cat} onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        prefs.categories.includes(cat)
                          ? "bg-[#5048e5] text-white border-[#5048e5]"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#5048e5]/50"
                      }`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">Event Format</p>
                <div className="flex gap-2">
                  {(["all", "physical", "virtual"] as const).map(type => (
                    <button key={type} onClick={() => setPrefs(p => ({ ...p, eventType: type }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all capitalize ${
                        prefs.eventType === type
                          ? "bg-[#5048e5] text-white border-[#5048e5]"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#5048e5]/50"
                      }`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5">AI Language</p>
                <div className="flex gap-2">
                  {([["en","English"],["id","Bahasa Indonesia"]] as const).map(([val, label]) => (
                    <button key={val} onClick={() => setPrefs(p => ({ ...p, language: val }))}
                      className={`flex-1 py-2 rounded-lg text-xs font-semibold border transition-all ${
                        prefs.language === val
                          ? "bg-[#5048e5] text-white border-[#5048e5]"
                          : "bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-[#5048e5]/50"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Data status */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Data Sources</p>
                {[
                  { label: "Events", value: events.length > 0 ? `${events.length} loaded` : "Visit homepage", ok: events.length > 0 },
                  { label: "Organizer Stats", value: organizerData ? "Loaded" : "Visit dashboard", ok: !!organizerData },
                  { label: "My Tickets", value: userTickets.length > 0 ? `${userTickets.length} tickets` : "Visit My Tickets", ok: userTickets.length > 0 },
                ].map(item => (
                  <div key={item.label} className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl border text-xs ${
                    item.ok
                      ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                      : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                  }`}>
                    <span className={`font-semibold ${item.ok ? "text-green-800 dark:text-green-300" : "text-slate-500"}`}>{item.label}</span>
                    <span className={item.ok ? "text-green-700 dark:text-green-400" : "text-slate-400"}>{item.value}</span>
                  </div>
                ))}
                <p className="text-[10px] text-slate-400 pt-1">
                  AI reads data already fetched by each page — no extra RPC calls.
                </p>
              </div>

              {/* Wallet */}
              <div className={`rounded-xl p-3.5 flex items-center gap-3 border ${
                publicKey
                  ? "bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800"
                  : "bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
              }`}>
                <span className={`material-symbols-outlined text-xl ${publicKey ? "text-green-600 dark:text-green-400" : "text-slate-400"}`}>
                  account_balance_wallet
                </span>
                <div>
                  <p className={`text-xs font-bold ${publicKey ? "text-green-800 dark:text-green-300" : "text-slate-600 dark:text-slate-300"}`}>
                    {publicKey ? "Wallet Connected" : "Wallet Not Connected"}
                  </p>
                  <p className="text-xs text-slate-500 font-mono">
                    {publicKey ? `${publicKey.toBase58().slice(0, 12)}...` : "Connect to enable personal data"}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Floating button */}
      <button
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onClick={() => { if (!dragMoved) setIsOpen(o => !o); }}
        className={`relative size-14 rounded-2xl flex items-center justify-center text-white shadow-2xl transition-all duration-200 ${
          isDragging ? "cursor-grabbing scale-110" : "cursor-grab hover:scale-105 active:scale-95"
        } ${isOpen ? "bg-slate-700 dark:bg-slate-600" : "bg-linear-to-br from-[#5048e5] to-violet-500"}`}
        style={{ boxShadow: isOpen ? "none" : "0 8px 32px rgba(80,72,229,0.4)" }}
        aria-label="Toggle AI Assistant"
      >
        {!isOpen && <span className="absolute inset-0 rounded-2xl bg-[#5048e5] animate-ping opacity-20" />}
        <span className="material-symbols-outlined text-2xl">{isOpen ? "close" : "auto_awesome"}</span>
      </button>
    </div>
  );
}