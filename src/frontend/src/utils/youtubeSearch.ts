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

export async function searchYouTube(q: string): Promise<YouTubeItem[]> {
  if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY.trim() === "") {
    throw new Error(
      "YouTube API key is not configured. Search is unavailable.",
    );
  }

  console.log("[searchYouTube] Called with query:", q);

  const url = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=5&key=${YOUTUBE_API_KEY}`;
  console.log(
    "[searchYouTube] Fetching URL (key hidden):",
    url.replace(YOUTUBE_API_KEY, "[HIDDEN]"),
  );

  let res: Response;
  try {
    res = await fetch(url);
  } catch (networkErr) {
    console.error("[searchYouTube] Network error (fetch failed):", networkErr);
    throw new Error(
      `Network error: ${
        networkErr instanceof Error
          ? networkErr.message
          : "Could not reach YouTube API. Check your internet or ad blocker."
      }`,
    );
  }

  console.log("[searchYouTube] Response status:", res.status);

  let data: Record<string, unknown>;
  try {
    data = await res.json();
  } catch {
    throw new Error("Failed to parse YouTube API response.");
  }

  if (data.error) {
    const err = data.error as { message?: string; code?: number };
    const msg = err.message || "YouTube API error";
    console.error("[searchYouTube] API error:", data.error);
    if (err.code === 403) {
      throw new Error("Search limit reached. Try again later.");
    }
    throw new Error(msg);
  }

  const items: YouTubeItem[] = Array.isArray(data.items)
    ? (data.items as YouTubeItem[])
    : [];
  console.log("[searchYouTube] Returning", items.length, "items");
  return items;
}
