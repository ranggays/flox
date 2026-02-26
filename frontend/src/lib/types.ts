export interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  locationType: "physical" | "virtual";
  price: string;
  currency: "ETH" | "SOL";
  imageUrl: string;
  imageAlt: string;
  badge?: string;
  category: "music" | "conference" | "sports" | "art" | "other";
}

export type FilterCategory =
  | "all"
  | "music"
  | "conference"
  | "sports"
  | "art"
  | "other";

export interface TicketTier {
  id: string;
  name: string;
  price: string;
  currency: "ETH" | "SOL";
  features: string[];
  sold: number;
  total: number;
  badge?: string;       
  highlighted?: boolean; 
  urgency?: string;     
}

export interface EventFeature {
  icon: string;         
  title: string;
  description: string;
}

export interface EventHost {
  initial: string;
  name: string;
  subtitle: string;
}

export interface EventDetail {
  id: number;
  title: string;
  status: string;
  dateRange: string;
  time: string;
  location: string;
  heroImageUrl: string;
  heroImageAlt: string;
  description: string[];
  features: EventFeature[];
  host: EventHost;
  tickets: TicketTier[];
  contractAddress: string;
  organizer?: string;
}

export type TicketStatus = "upcoming" | "attended" | "listed";

export interface MyTicket {
  id: string;
  status: TicketStatus;
  category: string;
  title: string;
  date: string;
  time: string;
  imageUrl: string;
  imageAlt: string;
}