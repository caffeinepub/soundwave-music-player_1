import { getCachedSearch, setCachedSearch } from "./searchCache";

const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as
  | string
  | undefined;

export interface YouTubeItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { medium: { url: string } };
  };
}

// Thrown when the API fails and we redirect to YouTube directly
export class FallbackError extends Error {
  public readonly fallbackUrl: string;
  constructor(query: string, reason: string) {
    super(reason);
    this.name = "FallbackError";
    this.fallbackUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
  }
}

export async function searchYouTube(q: string): Promise<YouTubeItem[]> {
  const query = q.trim();

  // 1. Check LocalStorage cache first
  const cached = getCachedSearch(query);
  if (cached) {
    return cached.data as YouTubeItem[];
  }

  // 2. Validate API key before hitting the network
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY.trim() === "") {
    throw new Error(
      "YouTube API key is not configured. Search is unavailable.",
    );
  }

  console.log("[searchYouTube] Cache MISS -- calling API for:", query);

  const url = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(query)}&type=video&maxResults=10&key=${YOUTUBE_API_KEY}`;
  console.log(
    "[searchYouTube] Fetching URL (key hidden):",
    url.replace(YOUTUBE_API_KEY, "[HIDDEN]"),
  );

  let res: Response;
  try {
    res = await fetch(url);
  } catch (networkErr) {
    console.error("[searchYouTube] Network error:", networkErr);
    // Network failure → fallback redirect
    throw new FallbackError(
      query,
      `Network error: ${
        networkErr instanceof Error
          ? networkErr.message
          : "Could not reach YouTube API."
      }`,
    );
  }

  console.log("[searchYouTube] Response status:", res.status);

  let data: Record<string, unknown>;
  try {
    data = await res.json();
  } catch {
    throw new FallbackError(query, "Failed to parse YouTube API response.");
  }

  if (data.error) {
    const err = data.error as { message?: string; code?: number };
    const msg = err.message || "YouTube API error";
    console.error("[searchYouTube] API error:", data.error);
    // 403 (quota/forbidden) and 5xx → fallback redirect
    if (err.code === 403 || (err.code !== undefined && err.code >= 500)) {
      throw new FallbackError(query, msg);
    }
    throw new Error(msg);
  }

  const items: YouTubeItem[] = Array.isArray(data.items)
    ? (data.items as YouTubeItem[])
    : [];
  console.log("[searchYouTube] Returning", items.length, "items");

  // 3. Store successful result in cache
  if (items.length > 0) {
    setCachedSearch(query, items);
  }

  return items;
}
