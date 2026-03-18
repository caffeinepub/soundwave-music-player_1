// ── SONGS SOURCE ──
// To swap in real audio sources (e.g. YouTube, your own API):
// 1. Replace the `src` field with a URL from your chosen source
// 2. Or add a `youtubeId` field to use YouTube IFrame API playback
// 3. The rest of the app will work without changes

export interface Song {
  id: string;
  title: string;
  artist: string;
  duration: number; // seconds
  emoji: string;
  colorClass: string; // 'c1'–'c6' CSS class for gradient background
  src: string; // audio URL — used when youtubeId is absent
  youtubeId?: string; // optional YouTube video ID — if set, YouTube IFrame API is used
}

export interface FeaturedPlaylist {
  id: string;
  title: string;
  emoji: string;
  colorClass: string;
  songCount: number;
}

export interface SidebarPlaylist {
  id: string;
  title: string;
  emoji: string;
  colorClass: string;
  songCount: number;
}

// CSS gradient strings for c1–c6 color classes.
// Use inline when a CSS class isn't applicable (e.g. canvas, SVG).
export const colorGradients: Record<string, string> = {
  c1: "linear-gradient(135deg, #2d1b69, #1a0e3d)",
  c2: "linear-gradient(135deg, #1a3a2a, #0d2019)",
  c3: "linear-gradient(135deg, #3a1a1a, #2a0d0d)",
  c4: "linear-gradient(135deg, #1a2a3a, #0d1a2a)",
  c5: "linear-gradient(135deg, #2a2a1a, #1a1a0d)",
  c6: "linear-gradient(135deg, #3a1a2a, #2a0d0d)",
};

export const songs: Song[] = [
  {
    id: "1",
    title: "Midnight Glow",
    artist: "Luna Ray",
    emoji: "🌙",
    colorClass: "c4",
    duration: 214,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3",
  },
  {
    id: "2",
    title: "Neon Dreams",
    artist: "Synthwave Club",
    emoji: "💫",
    colorClass: "c1",
    duration: 198,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3",
  },
  {
    id: "3",
    title: "Forest Walk",
    artist: "Nature Beats",
    emoji: "🌿",
    colorClass: "c2",
    duration: 245,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3",
  },
  {
    id: "4",
    title: "Electric Feel",
    artist: "MGMT Vibes",
    emoji: "⚡",
    colorClass: "c3",
    duration: 231,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3",
  },
  {
    id: "5",
    title: "Chill Hours",
    artist: "Lo-Fi Beats",
    emoji: "☕",
    colorClass: "c5",
    duration: 187,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3",
  },
  {
    id: "6",
    title: "Ocean Drive",
    artist: "Miami Sound",
    emoji: "🌊",
    colorClass: "c4",
    duration: 203,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-6.mp3",
  },
  {
    id: "7",
    title: "Golden Hour",
    artist: "Sunset Crew",
    emoji: "🌅",
    colorClass: "c5",
    duration: 221,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-7.mp3",
  },
  {
    id: "8",
    title: "Space Walk",
    artist: "Astral Project",
    emoji: "🚀",
    colorClass: "c1",
    duration: 267,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3",
  },
  {
    id: "9",
    title: "Rain Dance",
    artist: "Tribal Beats",
    emoji: "🌧️",
    colorClass: "c6",
    duration: 195,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-9.mp3",
  },
  {
    id: "10",
    title: "Purple Haze",
    artist: "Jimi Vibes",
    emoji: "💜",
    colorClass: "c1",
    duration: 210,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-10.mp3",
  },
  {
    id: "11",
    title: "Retro Funk",
    artist: "Groove Machine",
    emoji: "🎸",
    colorClass: "c3",
    duration: 228,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-11.mp3",
  },
  {
    id: "12",
    title: "Soft Piano",
    artist: "Classical Mood",
    emoji: "🎹",
    colorClass: "c2",
    duration: 189,
    src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-13.mp3",
  },
];

export const featuredPlaylists: FeaturedPlaylist[] = [
  {
    id: "fp1",
    title: "Chill Vibes",
    emoji: "🎵",
    colorClass: "c2",
    songCount: 24,
  },
  {
    id: "fp2",
    title: "Late Night",
    emoji: "🔥",
    colorClass: "c1",
    songCount: 18,
  },
  { id: "fp3", title: "Workout", emoji: "⚡", colorClass: "c3", songCount: 31 },
  {
    id: "fp4",
    title: "Study Focus",
    emoji: "🌙",
    colorClass: "c4",
    songCount: 12,
  },
  {
    id: "fp5",
    title: "Deep Listening",
    emoji: "🎧",
    colorClass: "c5",
    songCount: 20,
  },
  {
    id: "fp6",
    title: "Festival Mode",
    emoji: "🌊",
    colorClass: "c6",
    songCount: 35,
  },
];

export const sidebarPlaylists: SidebarPlaylist[] = [
  {
    id: "sp1",
    title: "Chill Vibes",
    emoji: "🎵",
    colorClass: "c2",
    songCount: 24,
  },
  {
    id: "sp2",
    title: "Late Night",
    emoji: "🔥",
    colorClass: "c1",
    songCount: 18,
  },
  { id: "sp3", title: "Workout", emoji: "⚡", colorClass: "c3", songCount: 31 },
  {
    id: "sp4",
    title: "Study Focus",
    emoji: "🌙",
    colorClass: "c4",
    songCount: 12,
  },
];

export const formatTime = (seconds: number): string => {
  const s = Math.floor(seconds || 0);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};
