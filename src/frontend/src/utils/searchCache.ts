export interface CacheEntry {
  query: string;
  data: unknown[];
  timestamp: number;
}

const CACHE_PREFIX = "yt_search_cache_";
const CACHE_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

export function getCachedSearch(query: string): CacheEntry | null {
  try {
    const raw = localStorage.getItem(CACHE_PREFIX + query.toLowerCase().trim());
    if (!raw) return null;
    const entry: CacheEntry = JSON.parse(raw);
    const age = Date.now() - entry.timestamp;
    if (age < CACHE_TTL_MS) {
      console.log(
        `[searchCache] HIT for "${query}" (age: ${Math.round(age / 60000)}m)`,
      );
      return entry;
    }
    console.log(`[searchCache] EXPIRED for "${query}"`);
    localStorage.removeItem(CACHE_PREFIX + query.toLowerCase().trim());
    return null;
  } catch (e) {
    console.warn("[searchCache] Read error:", e);
    return null;
  }
}

export function setCachedSearch(query: string, data: unknown[]): void {
  try {
    const entry: CacheEntry = {
      query,
      data,
      timestamp: Date.now(),
    };
    localStorage.setItem(
      CACHE_PREFIX + query.toLowerCase().trim(),
      JSON.stringify(entry),
    );
    console.log(`[searchCache] SET for "${query}" (${data.length} items)`);
  } catch (e) {
    console.warn("[searchCache] Write error (storage full?):", e);
  }
}

export function clearSearchCache(): void {
  try {
    const keys = Object.keys(localStorage).filter((k) =>
      k.startsWith(CACHE_PREFIX),
    );
    for (const k of keys) {
      localStorage.removeItem(k);
    }
    console.log(`[searchCache] Cleared ${keys.length} entries`);
  } catch (e) {
    console.warn("[searchCache] Clear error:", e);
  }
}
