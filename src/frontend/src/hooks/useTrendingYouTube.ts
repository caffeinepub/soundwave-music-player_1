import { useEffect, useState } from "react";

export interface TrendingItem {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
}

const CACHE_KEY = "sw_trending_cache";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

const FALLBACK_ITEMS: TrendingItem[] = [
  {
    videoId: "JGwWNGJdvx8",
    title: "Shape of You",
    channelTitle: "Ed Sheeran",
    thumbnail: "https://img.youtube.com/vi/JGwWNGJdvx8/hqdefault.jpg",
  },
  {
    videoId: "kTJczUoc26U",
    title: "Blinding Lights",
    channelTitle: "The Weeknd",
    thumbnail: "https://img.youtube.com/vi/kTJczUoc26U/hqdefault.jpg",
  },
  {
    videoId: "RgKAFK5djSk",
    title: "See You Again",
    channelTitle: "Wiz Khalifa ft. Charlie Puth",
    thumbnail: "https://img.youtube.com/vi/RgKAFK5djSk/hqdefault.jpg",
  },
  {
    videoId: "YQHsXMglC9A",
    title: "Hello",
    channelTitle: "Adele",
    thumbnail: "https://img.youtube.com/vi/YQHsXMglC9A/hqdefault.jpg",
  },
  {
    videoId: "OPf0YbXqDm0",
    title: "Uptown Funk",
    channelTitle: "Mark Ronson ft. Bruno Mars",
    thumbnail: "https://img.youtube.com/vi/OPf0YbXqDm0/hqdefault.jpg",
  },
  {
    videoId: "fRh_vgS2dFE",
    title: "Sorry",
    channelTitle: "Justin Bieber",
    thumbnail: "https://img.youtube.com/vi/fRh_vgS2dFE/hqdefault.jpg",
  },
  {
    videoId: "09R8_2nJtjg",
    title: "Sugar",
    channelTitle: "Maroon 5",
    thumbnail: "https://img.youtube.com/vi/09R8_2nJtjg/hqdefault.jpg",
  },
  {
    videoId: "hT_nvWreIhg",
    title: "Counting Stars",
    channelTitle: "OneRepublic",
    thumbnail: "https://img.youtube.com/vi/hT_nvWreIhg/hqdefault.jpg",
  },
];

function getApiKey(): string {
  return (
    (import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined) ?? ""
  ).trim();
}

async function fetchTrending(): Promise<TrendingItem[]> {
  const apiKey = getApiKey();
  if (!apiKey) return FALLBACK_ITEMS;

  const url = new URL("https://www.googleapis.com/youtube/v3/videos");
  url.searchParams.set("part", "snippet");
  url.searchParams.set("chart", "mostPopular");
  url.searchParams.set("videoCategoryId", "10");
  url.searchParams.set("maxResults", "12");
  url.searchParams.set("regionCode", "IN");
  url.searchParams.set("key", apiKey);

  try {
    const res = await fetch(url.toString());
    if (!res.ok) return FALLBACK_ITEMS;
    const data = (await res.json()) as {
      items?: Array<{
        id: string;
        snippet: {
          title: string;
          channelTitle: string;
          thumbnails: {
            high?: { url: string };
            medium?: { url: string };
            default?: { url: string };
          };
        };
      }>;
    };
    if (!data.items?.length) return FALLBACK_ITEMS;
    return data.items.map((item) => ({
      videoId: item.id,
      title: item.snippet.title,
      channelTitle: item.snippet.channelTitle,
      thumbnail:
        item.snippet.thumbnails.high?.url ??
        item.snippet.thumbnails.medium?.url ??
        item.snippet.thumbnails.default?.url ??
        `https://img.youtube.com/vi/${item.id}/hqdefault.jpg`,
    }));
  } catch {
    return FALLBACK_ITEMS;
  }
}

export function useTrendingYouTube() {
  const [items, setItems] = useState<TrendingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check cache
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached) as {
          ts: number;
          data: TrendingItem[];
        };
        if (Date.now() - parsed.ts < CACHE_TTL_MS) {
          setItems(parsed.data);
          setLoading(false);
          return;
        }
      }
    } catch (_) {}

    fetchTrending()
      .then((data) => {
        setItems(data);
        setLoading(false);
        try {
          localStorage.setItem(
            CACHE_KEY,
            JSON.stringify({ ts: Date.now(), data }),
          );
        } catch (_) {}
      })
      .catch(() => {
        setItems(FALLBACK_ITEMS);
        setError("Failed to load trending");
        setLoading(false);
      });
  }, []);

  return { items, loading, error };
}
