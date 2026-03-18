export const YOUTUBE_API_KEY = "AIzaSyCTDSCrIjmZa3lQ92A0WPfm_YH5TeKeMUE";

export interface YouTubeItem {
  id: { videoId: string };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: { medium: { url: string } };
  };
}

export async function searchYouTube(q: string): Promise<YouTubeItem[]> {
  console.log("[searchYouTube] Called with query:", q);

  const url = `https://youtube.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=5&key=${YOUTUBE_API_KEY}`;
  console.log("[searchYouTube] Fetching URL:", url);

  let res: Response;
  try {
    res = await fetch(url);
  } catch (networkErr) {
    console.error("[searchYouTube] Network error (fetch failed):", networkErr);
    throw new Error(
      `Network error: ${networkErr instanceof Error ? networkErr.message : "Could not reach YouTube API. Check your internet or ad blocker."}`,
    );
  }

  console.log("[searchYouTube] Response status:", res.status);

  const data = await res.json();
  console.log("[searchYouTube] Response data:", data);

  if (data.error) {
    const msg = data.error.message || "YouTube API error";
    console.error("[searchYouTube] API error:", data.error);
    throw new Error(msg);
  }

  const items: YouTubeItem[] = data.items ?? [];
  console.log("[searchYouTube] Returning", items.length, "items");
  return items;
}
