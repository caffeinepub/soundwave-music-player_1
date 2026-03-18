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
  const res = await fetch(
    `https://youtube.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(q)}&type=video&maxResults=5&key=${YOUTUBE_API_KEY}`,
  );
  const data = await res.json();
  return data.items ?? [];
}
