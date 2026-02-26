import { Connection } from "@solana/web3.js";

const RPC_ENDPOINT =
  process.env.NEXT_PUBLIC_RPC_URL ?? "https://api.devnet.solana.com";

let _connection: Connection | null = null;

export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(RPC_ENDPOINT, {
      commitment: "confirmed",
      fetchMiddleware: undefined,
    });
  }
  return _connection;
}