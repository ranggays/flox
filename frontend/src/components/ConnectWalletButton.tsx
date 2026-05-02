"use client";

import { useState } from "react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";

type PhantomWindow = Window & {
  solana?: {
    isPhantom?: boolean;
  };
};

function detectMobile() {
  if (typeof navigator === "undefined") return false;
  return /iPhone|iPad|Android/i.test(navigator.userAgent);
}

function detectPhantom() {
  if (typeof window === "undefined") return false;
  return (window as PhantomWindow).solana?.isPhantom === true;
}

export default function ConnectWalletButton({ className }: { className?: string }) {
  const { setVisible } = useWalletModal();
  const [isMobile] = useState(detectMobile);
  const [isPhantomInstalled] = useState(detectPhantom);

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
      className={`inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold leading-none transition-all ${
        className ??
        "bg-[#5048e5] px-4 py-2 text-white hover:bg-[#5048e5]/90 shadow-sm shadow-[#5048e5]/20"
      }`}
    >
      <span className="material-symbols-outlined block text-lg leading-none">
        account_balance_wallet
      </span>
      <span className="hidden leading-none sm:inline">Connect Wallet</span>
      <span className="leading-none sm:hidden">Connect</span>
    </button>
  );
}
