import { getCachedSearch, setCachedSearch } from "./searchCache";

export interface YouTubeItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { medium: { url: string } };
  };
}

// Thrown when all search methods fail — caller should redirect to YouTube
export class FallbackError extends Error {
  public readonly fallbackUrl: string;
  constructor(query: string, reason: string) {
    super(reason);
    this.name = "FallbackError";
    this.fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  }
}

// In-memory cache (layer 0 — fastest, ~5 min TTL)
const memCache = new Map<string, { data: YouTubeItem[]; ts: number }>();
const MEM_TTL_MS = 5 * 60 * 1000;

// Read key from env — never hardcoded
const YT_API_KEY =
  (import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined) ?? "";

async function fetchFromYouTubeAPI(query: string): Promise<YouTubeItem[]> {
  if (!YT_API_KEY) {
    console.warn(
      "[searchYouTube] VITE_YOUTUBE_API_KEY is not set — skipping API call",
    );
    throw new FallbackError(query, "YouTube API key not configured");
  }

  console.log(`[searchYouTube] Calling YouTube Data API for "${query}"`);

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("videoCategoryId", "10"); // Music only
  url.searchParams.set("maxResults", "5");
  url.searchParams.set("q", query);
  url.searchParams.set("key", YT_API_KEY);

  const res = await fetch(url.toString());
  const data = (await res.json()) as {
    items?: YouTubeItem[];
    error?: { message?: string; code?: number; errors?: { reason?: string }[] };
  };

  if (!res.ok || data.error) {
    const code = data.error?.code ?? res.status;
    const reason = data.error?.errors?.[0]?.reason ?? "";
    const msg = data.error?.message ?? `HTTP ${code}`;
    console.error(`[searchYouTube] API error (${code}): ${msg}`);

    if (code === 403 && reason === "quotaExceeded") {
      throw new FallbackError(query, "Search limit reached. Try later");
    }
    if (code === 400 || code === 403) {
      throw new FallbackError(query, "Search unavailable. Try again later");
    }
    throw new FallbackError(query, msg);
  }

  return Array.isArray(data.items) ? data.items : [];
}

export async function searchYouTube(
  q: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _actor?: unknown,
): Promise<YouTubeItem[]> {
  const query = q.trim();

  // Layer 0: In-memory cache
  const memEntry = memCache.get(query);
  if (memEntry && Date.now() - memEntry.ts < MEM_TTL_MS) {
    console.log(`[searchYouTube] Memory cache HIT for "${query}"`);
    return memEntry.data;
  }

  // Layer 1: LocalStorage cache (12h)
  const lsEntry = getCachedSearch(query);
  if (lsEntry) {
    console.log(`[searchYouTube] LocalStorage cache HIT for "${query}"`);
    const items = lsEntry.data as YouTubeItem[];
    memCache.set(query, { data: items, ts: Date.now() });
    return items;
  }

  // Layer 2: YouTube Data API v3
  try {
    const items = await fetchFromYouTubeAPI(query);
    console.log(
      `[searchYouTube] YouTube API returned ${items.length} results for "${query}"`,
    );
    if (items.length > 0) {
      memCache.set(query, { data: items, ts: Date.now() });
      setCachedSearch(query, items);
    }
    return items;
  } catch (err) {
    if (err instanceof FallbackError) throw err;
    console.error("[searchYouTube] Unexpected error:", err);
    throw new FallbackError(
      query,
      err instanceof Error ? err.message : "Search unavailable",
    );
  }
}
