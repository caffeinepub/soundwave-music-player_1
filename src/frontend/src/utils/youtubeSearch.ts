import { getCachedSearch, setCachedSearch } from "./searchCache";

export interface YouTubeItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { medium: { url: string } };
  };
}

// Thrown when the backend call fails and we redirect to YouTube directly
export class FallbackError extends Error {
  public readonly fallbackUrl: string;
  constructor(query: string, reason: string) {
    super(reason);
    this.name = "FallbackError";
    this.fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  }
}

// In-memory cache layer (layer 0 — fastest)
const memCache = new Map<string, { data: YouTubeItem[]; ts: number }>();
const MEM_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Type for an actor that has the searchYouTube method
type SearchableActor = {
  searchYouTube: (q: string) => Promise<string>;
};

export async function searchYouTube(
  q: string,
  actor: unknown,
): Promise<YouTubeItem[]> {
  const query = q.trim();

  // Step 0: In-memory cache
  const memEntry = memCache.get(query);
  if (memEntry && Date.now() - memEntry.ts < MEM_TTL_MS) {
    console.log(`[searchYouTube] Memory cache HIT for "${query}"`);
    return memEntry.data;
  }

  // Step 1: LocalStorage cache (12h)
  const lsEntry = getCachedSearch(query);
  if (lsEntry) {
    console.log(`[searchYouTube] LocalStorage cache HIT for "${query}"`);
    const items = lsEntry.data as YouTubeItem[];
    memCache.set(query, { data: items, ts: Date.now() });
    return items;
  }

  // Step 2: Backend proxy via Motoko actor
  if (!actor) {
    console.warn("[searchYouTube] Actor not available yet, backend not ready");
    throw new Error("Search temporarily unavailable — backend is initializing");
  }

  const searchableActor = actor as SearchableActor;
  if (typeof searchableActor.searchYouTube !== "function") {
    console.warn("[searchYouTube] actor.searchYouTube is not a function");
    throw new FallbackError(
      query,
      "Search unavailable — backend not configured",
    );
  }

  console.log(
    `[searchYouTube] Cache MISS — calling backend proxy for: "${query}"`,
  );

  let rawJson: string;
  try {
    rawJson = await searchableActor.searchYouTube(query);
    console.log("[searchYouTube] Backend proxy responded");
  } catch (err) {
    console.error("[searchYouTube] Backend call failed:", err);
    throw new FallbackError(
      query,
      err instanceof Error ? err.message : "Backend search failed",
    );
  }

  // Step 3: Parse JSON response from backend
  let data: {
    items?: YouTubeItem[];
    error?: { message?: string; code?: number };
  };
  try {
    data = JSON.parse(rawJson);
  } catch {
    console.error("[searchYouTube] Failed to parse backend response");
    throw new FallbackError(query, "Invalid response from search backend");
  }

  if (data.error) {
    const { message = "YouTube API error", code } = data.error;
    console.error("[searchYouTube] YouTube API error via backend:", data.error);
    if (code === 403 || (code !== undefined && code >= 500)) {
      throw new FallbackError(query, message);
    }
    throw new Error(message);
  }

  const items: YouTubeItem[] = Array.isArray(data.items) ? data.items : [];
  console.log(`[searchYouTube] Returning ${items.length} items for "${query}"`);

  // Save to both cache layers
  if (items.length > 0) {
    memCache.set(query, { data: items, ts: Date.now() });
    setCachedSearch(query, items);
  }

  return items;
}
