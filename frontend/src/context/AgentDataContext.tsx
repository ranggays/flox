"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export interface AgentEvent {
  id:          string;
  name:        string;
  description?: string;
  location:    string;
  category:    string;   // "music", "conference", etc.
  type:        string;   // "Physical" | "Virtual"
  status:      string;   // "On Sale" | "Upcoming" | "Ended" | "Cancelled"
  startTime:   number;   // unix timestamp
  endTime:     number;
  revenue:     string;   // "2.500" SOL
  sold:        number;   // total tickets sold
  available:   number;   // total available
  pda:         string;
  tiers:       AgentTier[];
}

export interface AgentTier {
  name:      string;
  priceSol:  string;
  available: number;
  maxSupply: number;
}

export interface AgentOrganizerData {
  escrowLocked:    number;  
  escrowAvailable: number;  
  totalRevenue:    string;  
  totalSold:       number;
  eventCount:      number;
}

export interface AgentUserTicket {
  id:       string;
  title:    string;
  date:     string;
  status:   "upcoming" | "attended" | "listed";
  category: string;
}

interface AgentDataState {
  events:        AgentEvent[];
  organizerData: AgentOrganizerData | null;
  userTickets:   AgentUserTicket[];
  pushEvents:        (events: AgentEvent[]) => void;
  pushOrganizerData: (data: AgentOrganizerData) => void;
  pushUserTickets:   (tickets: AgentUserTicket[]) => void;
}

const AgentDataContext = createContext<AgentDataState>({
  events:            [],
  organizerData:     null,
  userTickets:       [],
  pushEvents:        () => {},
  pushOrganizerData: () => {},
  pushUserTickets:   () => {},
});

export function AgentDataProvider({ children }: { children: ReactNode }) {
  const [events,        setEvents]        = useState<AgentEvent[]>([]);
  const [organizerData, setOrganizerData] = useState<AgentOrganizerData | null>(null);
  const [userTickets,   setUserTickets]   = useState<AgentUserTicket[]>([]);

  const pushEvents        = useCallback((e: AgentEvent[]) => setEvents(e),       []);
  const pushOrganizerData = useCallback((d: AgentOrganizerData) => setOrganizerData(d), []);
  const pushUserTickets   = useCallback((t: AgentUserTicket[]) => setUserTickets(t), []);

  return (
    <AgentDataContext.Provider value={{
      events, organizerData, userTickets,
      pushEvents, pushOrganizerData, pushUserTickets,
    }}>
      {children}
    </AgentDataContext.Provider>
  );
}

export function useAgentData() {
  return useContext(AgentDataContext);
}