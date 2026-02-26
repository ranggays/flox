export interface StatCard {
  icon: string;
  label: string;
  value: string;
}

export const dashboardStats: StatCard[] = [
  { icon: "calendar_month",        label: "Total Events Created",   value: "12"      },
  { icon: "lock",                  label: "Locked Escrow (ETH)",    value: "1.25 ETH"},
  { icon: "account_balance_wallet",label: "Available to Withdraw",  value: "0.42 ETH"},
  { icon: "payments",              label: "Total Revenue",          value: "$42.8k"  },
];

export interface OrgEvent {
  id: string;
  name: string;
  status: "active" | "ended";
}

export const orgEvents: OrgEvent[] = [
  { id: "e1", name: "Blockchain Gala 2024", status: "active" },
  { id: "e2", name: "NFT Art Workshop",     status: "ended"  },
];

export interface Validator {
  id: string;
  address: string;
  addedDate: string;
}

export const initialValidators: Validator[] = [
  { id: "v1", address: "0x71C7656EC7ab88b098defB751B7401B5f6d8976F", addedDate: "Oct 12, 2023" },
  { id: "v2", address: "0xA14B12c4E73F1c45F46d3c9E7b43A5E12f9254c",  addedDate: "Nov 04, 2023" },
  { id: "v3", address: "0x3E2917A8c14F0eB945c2c3A4B812e014a0014a0",  addedDate: "Dec 22, 2023" },
];