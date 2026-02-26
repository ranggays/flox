"use client";
import { useState, useRef } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { SystemProgram, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import { getProgram, getEscrowPDA, getEventPDA, getTierPDA } from "@/lib/program";
import { uploadImageToCloudinary } from "@/lib/uploadImage";
import { invalidateAllProgramCache } from "@/lib/programCache";
import { ToastProvider, useToast } from "@/components/Toast";

interface TicketTier {
  id: number;
  name: string;
  price: string;
  supply: string;
}

type EventType = "physical" | "virtual";

const SECTIONS = [
  { id: "general",   icon: "info",           label: "General Information" },
  { id: "logistics", icon: "event",          label: "Logistics"           },
  { id: "ticketing", icon: "local_activity", label: "Ticketing & Supply"  },
  { id: "media",     icon: "image",          label: "Event Media"         },
  { id: "staking",   icon: "security",       label: "Anti-Spam Stake"     },
];

// for subsection
function SectionHeader({ step, title }: { step: number; title: string }) {
  return (
    <div className="flex items-center gap-3 mb-6">
      <span className="w-8 h-8 rounded-full bg-[#5048e5]/10 text-[#5048e5] flex items-center justify-center font-bold text-sm">
        {step}
      </span>
      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">
      {children}
    </label>
  );
}

const inputCls = "w-full px-4 py-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#5048e5]/40 focus:border-[#5048e5] transition-all text-sm";
const cardCls = "bg-white dark:bg-slate-900 p-8 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800";

export default function CreateEventPage() {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const { success, error: toastError, warning, info } = useToast();

  // for form states
  const [eventName,    setEventName]    = useState("");
  const [description,  setDescription]  = useState("");
  const [category,     setCategory]     = useState("music");
  const [eventType,    setEventType]    = useState<EventType>("physical");
  const [location,     setLocation]     = useState("");
  const [startDate,    setStartDate]    = useState("");
  const [endDate,      setEndDate]      = useState("");
  const [tiers,        setTiers]        = useState<TicketTier[]>([
    { id: 1, name: "VIP Access", price: "0.5",  supply: "100" },
    { id: 2, name: "Regular",    price: "0.1",  supply: "500" },
  ]);
  const [bannerFile,    setBannerFile]    = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);

  // for transaction states
  const [staked,          setStaked]          = useState(false);
  const [staking,         setStaking]         = useState(false);
  const [deploying,       setDeploying]       = useState(false);
  const [deployStep,      setDeployStep]      = useState("");
  const [deployed,        setDeployed]        = useState(false);
  const [uploadProgress,  setUploadProgress]  = useState(0);
  const [uploading,       setUploading]       = useState(false);
  const [activeSection,   setActiveSection]   = useState("general");

  const fileInputRef = useRef<HTMLInputElement>(null);

  // for tier helpers
  const addTier    = () => setTiers(p => [...p, { id: Date.now(), name: "", price: "", supply: "" }]);
  const removeTier = (id: number) => { if (tiers.length > 1) setTiers(p => p.filter(t => t.id !== id)); };
  const updateTier = (id: number, field: keyof TicketTier, value: string) =>
    setTiers(p => p.map(t => t.id === id ? { ...t, [field]: value } : t));

  // for banner upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (!file) return;
    setBannerFile(file);
    setBannerPreview(URL.createObjectURL(file));
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    setActiveSection(id);
  };

  // function stake so that eo cant cheat 
  const handleStake = async () => {
    if (!wallet) return warning("Please connect your Phantom wallet first.");
    setStaking(true);
    try {
      const program   = getProgram(connection, wallet);
      const escrowPDA = getEscrowPDA(wallet.publicKey);

      const escrowInfo = await connection.getAccountInfo(escrowPDA);
      if (!escrowInfo) {
        console.log("Creating escrow account...");
        await (program.methods as any).initializeEscrow()
          .accounts({
            escrowAccount: escrowPDA,
            organizer:     wallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      }

      console.log("Staking 0.05 SOL...");
      await (program.methods as any).stakeForEvent()
        .accounts({
          escrowAccount: escrowPDA,
          organizer:     wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      setStaked(true);
      success("Stake successful! You can now deploy your event.");
    } catch (err) {
      console.error("Stake failed:", err);
      toastError("Transaction failed. Check the console for details.");
    } finally {
      setStaking(false);
    }
  };

  // deploy event 
  const handleDeploy = async () => {
    if (!wallet)    return warning("Wallet not connected.");
    if (!eventName) return warning("Event name is required.");
    if (!startDate || !endDate) return warning("Start and end date are required.");

    setDeploying(true);
    try {
      const program   = getProgram(connection, wallet);
      const escrowPDA = getEscrowPDA(wallet.publicKey);
      const eventId   = new BN(Date.now());
      const eventPDA  = getEventPDA(wallet.publicKey, eventId.toNumber());

      // upload banner to cloud
      let imageUri = "";
      if (bannerFile) {
        setUploading(true);
        setDeployStep("Uploading banner image...");
        setUploadProgress(0);
        try {
          const result = await uploadImageToCloudinary(bannerFile, (pct) => {
            setUploadProgress(pct);
            setDeployStep(`Uploading banner... ${pct}%`);
          });
          imageUri = result.url; 
          console.log("Banner uploaded:", imageUri);
        } finally {
          setUploading(false);
          setUploadProgress(0);
        }
      }

      // create event on-chain 
      setDeployStep("Creating event on-chain...");
      const startUnix      = new BN(Math.floor(new Date(startDate).getTime() / 1000));
      const endUnix        = new BN(Math.floor(new Date(endDate).getTime()   / 1000));
      const formattedType  = eventType === "physical" ? { physical: {} } : { virtual: {} };
      const formattedCat   = { [category]: {} };

      await (program.methods as any).createEvent(
        eventId,
        eventName,
        description || "",
        formattedCat,
        formattedType,
        location || "TBA",
        startUnix,
        endUnix,
        imageUri,       
        ""              
      ).accounts({
        eventAccount:  eventPDA,
        escrowAccount: escrowPDA,
        organizer:     wallet.publicKey,
        systemProgram: SystemProgram.programId,
      }).rpc();

      // add ticket tier (per tier)
      for (let i = 0; i < tiers.length; i++) {
        const t            = tiers[i];
        const tierPDA      = getTierPDA(eventPDA, i);
        const priceLamport = new BN(Math.round(parseFloat(t.price || "0") * LAMPORTS_PER_SOL));
        const maxSupply    = parseInt(t.supply || "0");

        setDeployStep(`Creating tier ${i + 1}/${tiers.length}: "${t.name || `Tier ${i+1}`}"...`);
        await (program.methods as any).addTicketTier(
          i,
          t.name || `Tier ${i + 1}`,
          priceLamport,
          maxSupply
        ).accounts({
          eventAccount:  eventPDA,
          tierAccount:   tierPDA,
          organizer:     wallet.publicKey,
          systemProgram: SystemProgram.programId,
        }).rpc();
      }

      setDeployStep("");
      invalidateAllProgramCache();
      setDeployed(true);
    } catch (err) {
      console.error("Deploy failed:", err);
      toastError("Deploy failed. Check the console for details.");
      setDeployStep("");
    } finally {
      setDeploying(false);
    }
  };

  if (deployed) {
    return (
      <div className="min-h-screen flex flex-col bg-[#f6f6f8] dark:bg-black">
        <Header />
        <main className="flex-1 flex items-center justify-center p-8">
          <div className="text-center max-w-md">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400 text-4xl">check_circle</span>
            </div>
            <h2 className="text-3xl font-black text-slate-900 dark:text-white mb-3">Event Deployed!</h2>
            <p className="text-slate-500 dark:text-slate-400 mb-8">
              Your smart contract is live on <b>Solana Devnet</b>. Tickets are ready to sell.
            </p>
            <div className="flex gap-3 justify-center">
              <Link href="/dashboard" className="px-6 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">
                Back to Dashboard
              </Link>
              <Link href="/" className="px-6 py-3 bg-[#5048e5] text-white font-bold rounded-xl text-sm hover:bg-[#5048e5]/90 transition-all">
                View Events
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <>
      <ToastProvider />
      <div className="min-h-screen flex flex-col bg-[#f6f6f8] dark:bg-black">
        <Header />
        <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 py-12">

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-2">
              <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-[#5048e5] transition-colors">
                <span className="material-symbols-outlined text-base">arrow_back</span>
                Back to Organizer Dashboard
              </Link>
              <h1 className="text-4xl font-black tracking-tight text-slate-900 dark:text-white">Create New Event</h1>
              <p className="text-slate-500 dark:text-slate-400 text-lg">Deploy your event smart contract to Solana.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

            {/* Sidebar */}
            <aside className="hidden lg:block space-y-1 sticky top-24 h-fit">
              {SECTIONS.map(({ id, icon, label }) => (
                <button key={id} onClick={() => scrollTo(id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all text-left ${
                    activeSection === id ? "bg-[#5048e5] text-white" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  }`}>
                  <span className="material-symbols-outlined text-base">{icon}</span>
                  {label}
                </button>
              ))}
            </aside>

            <div className="lg:col-span-3 space-y-8">

              {/* 1 · General */}
              <section id="general" className={cardCls}>
                <SectionHeader step={1} title="General Information" />
                <div className="space-y-5">
                  <div>
                    <Label>Event Name</Label>
                    <input className={inputCls} type="text" placeholder="e.g. Solana Breakpoint 2026"
                      value={eventName} onChange={e => setEventName(e.target.value)} />
                  </div>
                  <div>
                    <Label>Description</Label>
                    <textarea className={inputCls} rows={4} placeholder="Describe your event..."
                      value={description} onChange={e => setDescription(e.target.value)} />
                  </div>
                  <div>
                    <Label>Category</Label>
                    <select className={inputCls} value={category} onChange={e => setCategory(e.target.value)}>
                      <option value="music">Music / Concert</option>
                      <option value="conference">Conference</option>
                      <option value="workshop">Workshop</option>
                      <option value="hackathon">Hackathon</option>
                      <option value="sports">Sports</option>
                      <option value="art">Art</option>
                      <option value="other">Other</option>
                    </select>
                    <p className="mt-1.5 text-xs text-slate-400">
                      Category is stored on-chain. Music, Conference, Sports, and Art have dedicated filters.
                    </p>
                  </div>
                </div>
              </section>

              {/* 2 · Logistics */}
              <section id="logistics" className={cardCls}>
                <SectionHeader step={2} title="Logistics" />
                <div className="space-y-5">
                  <div>
                    <Label>Event Type</Label>
                    <div className="flex gap-3">
                      {(["physical", "virtual"] as EventType[]).map(type => (
                        <button key={type} onClick={() => setEventType(type)}
                          className={`flex-1 py-3 px-4 rounded-xl border-2 font-bold flex items-center justify-center gap-2 transition-all text-sm ${
                            eventType === type ? "border-[#5048e5] bg-[#5048e5]/5 text-[#5048e5]" : "border-slate-200 dark:border-slate-700 text-slate-500 hover:border-[#5048e5]/40"
                          }`}>
                          <span className="material-symbols-outlined text-base">
                            {type === "physical" ? "location_on" : "videocam"}
                          </span>
                          {type === "physical" ? "Physical" : "Virtual"}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label>{eventType === "physical" ? "Venue Name & Address" : "Event Link / Platform"}</Label>
                    <input className={inputCls} type="text"
                      placeholder={eventType === "physical" ? "e.g. Jakarta Convention Center" : "e.g. Google Meet Link"}
                      value={location} onChange={e => setLocation(e.target.value)} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <Label>Start Date & Time</Label>
                      <input className={inputCls} type="datetime-local" value={startDate} onChange={e => setStartDate(e.target.value)} />
                    </div>
                    <div>
                      <Label>End Date & Time</Label>
                      <input className={inputCls} type="datetime-local" value={endDate} onChange={e => setEndDate(e.target.value)} />
                    </div>
                  </div>
                </div>
              </section>

              {/* 3 · Ticketing */}
              <section id="ticketing" className={cardCls}>
                <div className="flex items-center justify-between mb-6">
                  <SectionHeader step={3} title="Ticketing & Supply" />
                  <button onClick={addTier} className="text-[#5048e5] font-bold text-sm flex items-center gap-1 hover:underline">
                    <span className="material-symbols-outlined text-base">add</span> Add Tier
                  </button>
                </div>
                <div className="space-y-3">
                  {tiers.map((tier, idx) => (
                    <div key={tier.id} className={`grid grid-cols-1 md:grid-cols-4 gap-3 p-4 rounded-xl border ${
                      idx === 0 ? "border-[#5048e5]/30 bg-[#5048e5]/5 dark:bg-[#5048e5]/10" : "border-slate-200 dark:border-slate-700"
                    }`}>
                      <div className="md:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Tier Name</label>
                        <input className={inputCls} type="text" value={tier.name} placeholder="e.g. VIP"
                          onChange={e => updateTier(tier.id, "name", e.target.value)} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Price (SOL)</label>
                        <input className={inputCls} type="number" step="0.01" value={tier.price} placeholder="0.00"
                          onChange={e => updateTier(tier.id, "price", e.target.value)} />
                      </div>
                      <div className="flex gap-2">
                        <div className="flex-1">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 block">Supply</label>
                          <input className={inputCls} type="number" value={tier.supply} placeholder="100"
                            onChange={e => updateTier(tier.id, "supply", e.target.value)} />
                        </div>
                        {tiers.length > 1 && (
                          <button onClick={() => removeTier(tier.id)}
                            className="mt-5 p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                            <span className="material-symbols-outlined">delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 4 · Media */}
              <section id="media" className={cardCls}>
                <SectionHeader step={4} title="Event Media" />

                <div onClick={() => fileInputRef.current?.click()} onDrop={handleDrop}
                  onDragOver={e => e.preventDefault()}
                  className={`border-2 border-dashed rounded-xl cursor-pointer group transition-all ${
                    bannerPreview ? "border-[#5048e5]/40" : "border-slate-300 dark:border-slate-700 hover:border-[#5048e5]"
                  }`}>
                  {bannerPreview ? (
                    <div className="relative">
                      <img src={bannerPreview} alt="Banner" className="w-full h-56 object-cover rounded-xl" />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-white text-sm font-bold flex items-center gap-2">
                          <span className="material-symbols-outlined">edit</span> Change Image
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center py-14">
                      <span className="material-symbols-outlined text-5xl text-slate-400 group-hover:text-[#5048e5] transition-colors mb-4">cloud_upload</span>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Upload Banner Image</h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Drag & drop or click to browse</p>
                      <p className="text-xs text-slate-400 mt-1">Recommended: 1200×630px · Max 5MB</p>
                    </div>
                  )}
                </div>

                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                {/* File info + upload progress bar */}
                {bannerFile && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
                      <span className="material-symbols-outlined text-base text-green-500">check_circle</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300 truncate">{bannerFile.name}</span>
                      <span className="shrink-0 text-xs">({(bannerFile.size / 1024 / 1024).toFixed(2)} MB)</span>
                    </div>
                    {uploading && (
                      <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-500">
                          <span>Uploading to Cloudinary...</span>
                          <span className="font-bold text-[#5048e5]">{uploadProgress}%</span>
                        </div>
                        <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-[#5048e5] rounded-full transition-all duration-200"
                            style={{ width: `${uploadProgress}%` }} />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <p className="mt-3 text-xs text-slate-400 flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">info</span>
                  Image will be uploaded to Cloudinary before the transaction is sent. The URL is stored on-chain.
                </p>
              </section>

              {/* 5 · Staking */}
              <section id="staking" className={cardCls}>
                <SectionHeader step={5} title="Anti-Spam Requirement" />
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 p-6 rounded-xl mb-6 flex gap-4">
                  <span className="material-symbols-outlined text-blue-600 dark:text-blue-400">shield</span>
                  <div>
                    <h4 className="font-bold text-blue-900 dark:text-blue-100">Why staking?</h4>
                    <p className="text-sm text-blue-800 dark:text-blue-300">
                      To prevent spam, event organizers must stake <strong>0.05 SOL</strong>.
                      This deposit is fully refundable after your event ends via <code className="font-mono">withdraw_funds</code>.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-between p-5 border border-slate-200 dark:border-slate-700 rounded-xl gap-4">
                  <div className="flex items-center gap-4">
                    <span className={`material-symbols-outlined text-3xl ${staked ? "text-green-500" : "text-slate-400"}`}>
                      {staked ? "lock" : "lock_open"}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {staked ? "Staked & Authorized ✓" : "Step 1: Authorization"}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {staked ? "0.05 SOL locked in EscrowAccount." : "Requires Phantom Wallet"}
                      </p>
                    </div>
                  </div>
                  <button onClick={handleStake} disabled={staked || staking}
                    className={`w-full sm:w-auto px-8 py-3 font-bold rounded-xl text-sm transition-all ${
                      staked   ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 cursor-not-allowed"
                      : staking ? "bg-[#5048e5]/70 text-white cursor-wait"
                      :           "bg-[#5048e5] text-white hover:bg-[#5048e5]/90"
                    }`}>
                    {staking ? "Processing..." : staked ? "Staked ✓" : "Stake & Authorize"}
                  </button>
                </div>
              </section>

              {/* Deploy */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-700 flex flex-col items-center gap-4">

                {/* Progress indicator */}
                {deployStep && (
                  <div className="w-full flex items-center gap-3 px-5 py-3 bg-[#5048e5]/5 border border-[#5048e5]/20 rounded-xl">
                    <svg className="animate-spin w-5 h-5 text-[#5048e5] shrink-0" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    <p className="text-sm font-medium text-[#5048e5]">{deployStep}</p>
                  </div>
                )}

                <button onClick={handleDeploy} disabled={deploying || !staked}
                  className={`w-full py-5 text-xl font-black rounded-xl transition-all flex items-center justify-center gap-3 ${
                    !staked  ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                    : deploying ? "bg-[#5048e5]/70 text-white cursor-wait"
                    :             "bg-[#5048e5] text-white hover:shadow-xl hover:shadow-[#5048e5]/20 hover:scale-[1.01]"
                  }`}>
                  {deploying ? (
                    <>
                      <svg className="animate-spin w-6 h-6" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg>
                      Deploying to Solana...
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined">rocket_launch</span>
                      {staked ? "Deploy Smart Contract & Create Event" : "Complete Staking to Deploy"}
                    </>
                  )}
                </button>

                {!staked && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1">
                    <span className="material-symbols-outlined text-sm">warning</span>
                    Complete the Anti-Spam Stake in Section 5 before deploying.
                  </p>
                )}
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}