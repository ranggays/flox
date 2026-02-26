import type { EventDetail, TicketTier } from "@/lib/types";
import { events } from "@/lib/data/event";

const richEventDetails: EventDetail[] = [
  {
    id: 1,
    title: "Decentralized Music Festival",
    status: "Upcoming Event",
    dateRange: "Sept 12-14, 2024",
    time: "8:00 PM - 4:00 AM EST",
    location: "Decentraland Metaverse",
    heroImageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBf7utOjBC3R1NXJlsFkA8_JWshp35oAUqDs5GfgO5iVyxrZVzLVnxeo3tYSaixcQW8-JXTxWsWCgHTEhLIYfmNHC0IhvAKo8mJjMa_-HVMp38vy7WepIv1tYbO3TjEv9CJlsJzA7u4cikDlQjQNtUtk9KXRTIyQRLkR8fuiWc-h8Ea2HR2grLqzg6-HlUkzVVgI_FeDahBvoT7zynH-dkITx6Etx2iVBknRNLWZEjUiReG4zDTcTcHeouXpKvLN__9lnaGYO2pJeZt",
    heroImageAlt: "Vibrant futuristic music festival stage with neon lights",
    description: [
      "Experience the future of sound at the world's premier decentralized music gathering. Join us for a 3-day immersive journey across multiple virtual stages, featuring global headliners and emerging indie artists from around the globe.",
      "Every ticket is a unique NFT, granting you permanent ownership of a piece of festival history. Beyond access, these tickets unlock exclusive digital collectibles, governance rights for future lineups, and permanent metadata reflecting your attendance.",
    ],
    features: [
      {
        icon: "auto_awesome",
        title: "Interactive Experiences",
        description: "Live 3D visuals that react to the crowd's energy in real-time.",
      },
      {
        icon: "token",
        title: "Utility Driven",
        description: "Hold your NFT ticket to access the year-round DAO music lounge.",
      },
    ],
    host: {
      initial: "L",
      name: "Lumina Productions",
      subtitle: "Verified Creator • 12 Events",
    },
    tickets: [
      {
        id: "vip",
        name: "VIP Pass",
        price: "0.5",
        currency: "ETH",
        features: [
          "Full Backstage & Lounge Access",
          "Limited Edition Genesis NFT",
          "Complimentary Metaverse Drinks",
          "Priority Server Entry",
        ],
        sold: 12,
        total: 100,
        badge: "Exclusive",
        highlighted: true,
        urgency: "Selling out fast!",
      },
      {
        id: "regular",
        name: "Regular Pass",
        price: "0.15",
        currency: "ETH",
        features: [
          "All Stage Floor Access",
          "Commemorative Digital Poster",
          "Community Discord Access",
        ],
        sold: 248,
        total: 500,
        badge: "Popular",
      },
      {
        id: "common",
        name: "Common Pass",
        price: "0.05",
        currency: "ETH",
        features: ["General Admission Entry", "Public Chat Access"],
        sold: 1240,
        total: 2000,
      },
    ],
    contractAddress: "0x5048...e5f2",
  },
];


function buildEventDetailFromBase(id: number): EventDetail | undefined {
  const base = events.find((e) => e.id === id);
  if (!base) return undefined;

  const basePrice = parseFloat(base.price);
  const currency = base.currency;

  const tickets: TicketTier[] = [
    {
      id: "vip",
      name: "VIP Pass",
      price: (basePrice * 10).toFixed(2).replace(/\.?0+$/, ""),
      currency,
      features: [
        "Full Priority Access",
        "Exclusive NFT Collectible",
        "Meet & Greet Inclusion",
        "Priority Entry",
      ],
      sold: 18,
      total: 100,
      badge: "Exclusive",
      highlighted: true,
      urgency: "Selling out fast!",
    },
    {
      id: "regular",
      name: "Regular Pass",
      price: (basePrice * 3).toFixed(2).replace(/\.?0+$/, ""),
      currency,
      features: [
        "All Area Access",
        "Digital Commemorative NFT",
        "Community Discord Access",
      ],
      sold: 210,
      total: 500,
      badge: "Popular",
    },
    {
      id: "common",
      name: "Common Pass",
      price: base.price,
      currency,
      features: ["General Admission Entry", "Public Chat Access"],
      sold: 980,
      total: 2000,
    },
  ];

  return {
    id: base.id,
    title: base.title,
    status: "Upcoming Event",
    dateRange: base.date,
    time: "Doors open 7:00 PM",
    location: base.location,
    heroImageUrl: base.imageUrl,
    heroImageAlt: base.imageAlt,
    description: [
      `Join us for ${base.title} — one of the most anticipated Web3 events of the year. Experience a unique blend of technology, culture, and community in an immersive environment.`,
      "Every ticket is minted as a unique NFT on the blockchain, granting holders verifiable ownership, exclusive digital perks, and a permanent record of their attendance.",
    ],
    features: [
      {
        icon: "verified",
        title: "NFT-Backed Access",
        description: "Your ticket is a verifiable NFT with permanent on-chain provenance.",
      },
      {
        icon: "groups",
        title: "Global Community",
        description: "Connect with thousands of Web3 enthusiasts and industry leaders.",
      },
    ],
    host: {
      initial: base.title[0].toUpperCase(),
      name: `${base.title} Productions`,
      subtitle: "Verified Creator • Web3 Events",
    },
    tickets,
    contractAddress: `0x${base.id.toString(16).padStart(4, "0")}...e5f2`,
  };
}

export const allEventIds: { id: number }[] = events.map((e) => ({ id: e.id }));

export function getEventDetail(id: number): EventDetail | undefined {
  return richEventDetails.find((e) => e.id === id) ?? buildEventDetailFromBase(id);
}