export interface BlockchainEvent {
  id: string;
  name: string;
  organizer: string;
  location: string;
  startTime: number;
  endTime: number;
  imageUri: string;
  status: Record<string, unknown>;
  category: Record<string, unknown>;
  eventType: Record<string, unknown>;
  sold: number;
  available: number;
  revenue: string;
}

interface CacheEntry {
  data: BlockchainEvent[];
  fetchedAt: number;
}

const CACHE_TTL_MS = 60_000; 

let cache: CacheEntry | null = null;

export function getCachedEvents(): BlockchainEvent[] | null {
  if (!cache) return null;
  const age = Date.now() - cache.fetchedAt;
  if (age > CACHE_TTL_MS) {
    cache = null;
    return null;
  }
  return cache.data;
}

export function setCachedEvents(data: BlockchainEvent[]) {
  cache = { data, fetchedAt: Date.now() };
}

export function invalidateCache() {
  cache = null;
}