import { getCachedSearch, setCachedSearch } from "./searchCache";

export interface YouTubeItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { medium: { url: string } };
  };
}

// Thrown when all search methods fail — caller should show fallback link
export class FallbackError extends Error {
  public readonly fallbackUrl: string;
  constructor(query: string, reason: string) {
    super(reason);
    this.name = "FallbackError";
    this.fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  }
}

// In-memory cache (layer 0 — fastest, 5 min TTL)
const memCache = new Map<string, { data: YouTubeItem[]; ts: number }>();
const MEM_TTL_MS = 5 * 60 * 1000;

/**
 * Read the API key at call time (not module-load time).
 * This ensures the key is picked up even if the module initialises before
 * Vite has finished injecting `define` replacements in some edge cases.
 */
function getApiKey(): string {
  // Vite replaces `import.meta.env.VITE_YOUTUBE_API_KEY` at build time
  // via the `define` block in vite.config.js.
  const key =
    (import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined) ?? "";
  return key.trim();
}

async function fetchFromYouTubeAPI(query: string): Promise<YouTubeItem[]> {
  const apiKey = getApiKey();

  // Debug: always log key status (masked for security)
  if (!apiKey) {
    console.warn(
      "[YouTube Search] ❌ VITE_YOUTUBE_API_KEY is empty — check src/frontend/.env",
    );
    throw new FallbackError(query, "YouTube API key not configured");
  }

  console.log(
    `[YouTube Search] ✅ API key present (${apiKey.slice(0, 8)}...) — searching for "${query}"`,
  );

  const url = new URL("https://www.googleapis.com/youtube/v3/search");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("type", "video");
  url.searchParams.set("videoCategoryId", "10"); // Music only
  url.searchParams.set("maxResults", "8");
  url.searchParams.set("q", query);
  url.searchParams.set("key", apiKey);

  let res: Response;
  try {
    res = await fetch(url.toString());
  } catch (networkErr) {
    console.error("[YouTube Search] 🌐 Network error:", networkErr);
    throw new FallbackError(query, "Network error — check your connection");
  }

  const data = (await res.json()) as {
    items?: YouTubeItem[];
    error?: { message?: string; code?: number; errors?: { reason?: string }[] };
  };

  console.log(
    "[YouTube Search] API response status:",
    res.status,
    "| items:",
    data.items?.length ?? 0,
  );

  if (!res.ok || data.error) {
    const code = data.error?.code ?? res.status;
    const reason = data.error?.errors?.[0]?.reason ?? "";
    const msg = data.error?.message ?? `HTTP ${code}`;
    console.error(`[YouTube Search] ❌ API error (${code} ${reason}): ${msg}`);

    if (code === 403 && reason === "quotaExceeded") {
      throw new FallbackError(
        query,
        "Daily search quota reached — results on YouTube:",
      );
    }
    if (code === 400 || code === 403) {
      throw new FallbackError(query, `API error: ${msg}`);
    }
    throw new FallbackError(query, msg);
  }

  const items = Array.isArray(data.items) ? data.items : [];
  console.log(`[YouTube Search] ✅ Got ${items.length} results for "${query}"`);
  return items;
}

export async function searchYouTube(
  q: string,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _actor?: unknown,
): Promise<YouTubeItem[]> {
  const query = q.trim();
  if (!query) return [];

  // Layer 0: In-memory cache
  const memEntry = memCache.get(query);
  if (memEntry && Date.now() - memEntry.ts < MEM_TTL_MS) {
    console.log(`[YouTube Search] 🗂 Memory cache HIT for "${query}"`);
    return memEntry.data;
  }

  // Layer 1: LocalStorage cache (12h)
  const lsEntry = getCachedSearch(query);
  if (lsEntry) {
    console.log(`[YouTube Search] 🗂 LocalStorage cache HIT for "${query}"`);
    const items = lsEntry.data as YouTubeItem[];
    memCache.set(query, { data: items, ts: Date.now() });
    return items;
  }

  // Layer 2: Live YouTube Data API v3
  try {
    const items = await fetchFromYouTubeAPI(query);
    if (items.length > 0) {
      memCache.set(query, { data: items, ts: Date.now() });
      setCachedSearch(query, items);
    }
    return items;
  } catch (err) {
    if (err instanceof FallbackError) throw err;
    console.error("[YouTube Search] Unexpected error:", err);
    throw new FallbackError(
      query,
      err instanceof Error ? err.message : "Search unavailable",
    );
  }
}
