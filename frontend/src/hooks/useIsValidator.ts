"use client";

import { useEffect, useState } from "react";
import { useAnchorWallet, useConnection } from "@solana/wallet-adapter-react";
import { getProgram } from "@/lib/program";

export function useIsValidator() {
  const wallet = useAnchorWallet();
  const { connection } = useConnection();
  const [isValidator, setIsValidator] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!wallet) {
      setIsValidator(false);
      return;
    }

    const check = async () => {
      setLoading(true);
      try {
        const program = getProgram(connection, wallet);
        const matches = await (program.account as any).validatorAccount.all([
          {
            memcmp: {
              offset: 40,
              bytes: wallet.publicKey.toBase58(),
            },
          },
        ]);

        setIsValidator(matches.length > 0);
      } catch (err) {
        console.error("useIsValidator error:", err);
        setIsValidator(false);
      } finally {
        setLoading(false);
      }
    };

    check();
  }, [wallet, connection]);

  return { isValidator, loading };
}