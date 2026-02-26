"use client";

import { useEffect, useState } from "react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

export default function ConnectWalletButton({ className }: { className?: string }) {
  const { setVisible } = useWalletModal();
  const [isMobile, setIsMobile] = useState(false);
  const [isPhantomInstalled, setIsPhantomInstalled] = useState(false);

  useEffect(() => {
    const mobile = /iPhone|iPad|Android/i.test(navigator.userAgent);
    const phantomInjected = !!(window as any).solana?.isPhantom;
    setIsMobile(mobile);
    setIsPhantomInstalled(phantomInjected);
  }, []);

  const handleConnect = () => {
    if (!isMobile || isPhantomInstalled) {
      setVisible(true);
      return;
    }

    const currentUrl = encodeURIComponent(window.location.href);
    window.location.href = `https://phantom.app/ul/browse/${currentUrl}?ref=${currentUrl}`;
  };

  return (
    <button
      onClick={handleConnect}
      className={className ?? "flex items-center gap-2 text-sm font-semibold text-white bg-[#5048e5] hover:bg-[#5048e5]/90 px-4 py-2 rounded-lg transition-all shadow-sm shadow-[#5048e5]/20"}
    >
      <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
      <span className="hidden sm:inline">Connect Wallet</span>
      <span className="sm:hidden">Connect</span>
    </button>
  );
}