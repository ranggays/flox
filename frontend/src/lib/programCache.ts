const TTL_MS = 60_000; 

interface CacheEntry<T> {
  data:      T;
  fetchedAt: number;
}

const store = new Map<string, CacheEntry<unknown>>();

const inflight = new Map<string, Promise<unknown>>();

/**
 * Fetch dengan cache + deduplication.
 *
 * @param key     - Nama unik untuk data ini (misal: "eventAccount", "tierAccount")
 * @param fetcher - Fungsi async yang melakukan RPC call
 * @param ttl     - Override TTL dalam ms (default: 60000)
 */
export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = TTL_MS
): Promise<T> {
  const cached = store.get(key);
  if (cached && Date.now() - cached.fetchedAt < ttl) {
    return cached.data as T;
  }

  if (inflight.has(key)) {
    return inflight.get(key) as Promise<T>;
  }

  const promise = fetcher()
    .then((data) => {
      store.set(key, { data, fetchedAt: Date.now() });
      inflight.delete(key);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, promise as Promise<unknown>);
  return promise;
}

export function invalidateProgramCache(key: string) {
  store.delete(key);
}

export function invalidateAllProgramCache() {
  store.clear();
}