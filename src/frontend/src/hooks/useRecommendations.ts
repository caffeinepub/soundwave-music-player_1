import { useCallback, useMemo, useState } from "react";
import { songs } from "../data/songs";

export const LS_SEARCH_HISTORY = "sw_search_history";

const MOOD_MAP: Record<string, string[]> = {
  chill: ["1", "5", "6", "7"],
  workout: ["4", "11"],
  focus: ["3", "8", "12"],
  party: ["2", "10"],
  adventure: ["9"],
};

const MOOD_KEYWORDS: Record<string, string[]> = {
  chill: [
    "chill",
    "relax",
    "calm",
    "peaceful",
    "lofi",
    "lo-fi",
    "sleep",
    "rain",
  ],
  workout: ["workout", "gym", "energy", "pump", "run", "training", "power"],
  focus: ["focus", "study", "work", "concentrate", "ambient", "piano"],
  party: ["party", "dance", "club", "hype", "fun", "night", "neon"],
  adventure: ["adventure", "travel", "epic", "outdoor", "nature"],
};

function extractMoodFromSearches(history: string[]): string {
  const scores: Record<string, number> = {};
  for (const query of history) {
    const q = query.toLowerCase();
    for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
      for (const kw of keywords) {
        if (q.includes(kw)) {
          scores[mood] = (scores[mood] ?? 0) + 1;
        }
      }
    }
  }
  const top = Object.entries(scores).sort((a, b) => b[1] - a[1])[0];
  return top ? top[0] : "chill";
}

export interface Recommendation {
  songId: string;
  reason: string;
  matchScore: number;
  mood: string;
}

function computeRecommendations(
  likedIds: Set<string>,
  recentIds: number[],
  searchHistory: string[],
): { recs: Recommendation[]; topMood: string } {
  const searchMood = extractMoodFromSearches(searchHistory);

  // Determine mood from liked songs
  const likedMoodCounts: Record<string, number> = {};
  for (const [mood, ids] of Object.entries(MOOD_MAP)) {
    for (const id of ids) {
      if (likedIds.has(id)) {
        likedMoodCounts[mood] = (likedMoodCounts[mood] ?? 0) + 1;
      }
    }
  }
  const topLikedMoodEntry = Object.entries(likedMoodCounts).sort(
    (a, b) => b[1] - a[1],
  )[0];
  const topLikedMood = topLikedMoodEntry ? topLikedMoodEntry[0] : null;
  const topMood = topLikedMood ?? searchMood;

  // Determine artist from recently played
  const recentArtists = new Set<string>();
  for (const idx of recentIds.slice(0, 5)) {
    const song = songs[idx];
    if (song) recentArtists.add(song.artist);
  }

  const scores: Map<string, number> = new Map();
  const reasons: Map<string, string> = new Map();
  const moodMap: Map<string, string> = new Map();

  for (const song of songs) {
    let score = 0;
    let reason = "Recommended for you";
    let songMood = "chill";

    // Find song's mood
    for (const [mood, ids] of Object.entries(MOOD_MAP)) {
      if (ids.includes(song.id)) {
        songMood = mood;
        break;
      }
    }

    if (likedIds.has(song.id)) {
      score += 30;
      reason = "Based on your liked songs";
    }

    const recentSongIds = recentIds.slice(0, 10).map((i) => songs[i]?.id);
    if (recentSongIds.includes(song.id)) {
      score += 20;
      reason = "Recently played";
    }

    if (topLikedMood && songMood === topLikedMood) {
      score += 15;
      if (reason === "Recommended for you")
        reason = `More ${topLikedMood} music you'll love`;
    }

    if (recentArtists.has(song.artist)) {
      score += 10;
      if (reason === "Recommended for you")
        reason = `Because you played ${song.artist}`;
    }

    if (searchHistory.length > 0 && songMood === searchMood) {
      score += 12;
      if (reason === "Recommended for you")
        reason = `Because you search for ${searchMood} music`;
    }

    // Small random variation for freshness
    score += Math.floor(Math.random() * 5);

    scores.set(song.id, score);
    reasons.set(song.id, reason);
    moodMap.set(song.id, songMood);
  }

  const recs: Recommendation[] = songs
    .map((song) => ({
      songId: song.id,
      reason: reasons.get(song.id) ?? "Recommended for you",
      matchScore: Math.min(100, (scores.get(song.id) ?? 0) + 40),
      mood: moodMap.get(song.id) ?? "chill",
    }))
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 6);

  return { recs, topMood };
}

export function useRecommendations(
  likedIds: Set<string>,
  recentIds: number[],
  searchHistory: string[],
) {
  const [_tick, setTick] = useState(0);

  const { recs: recommendations, topMood } = useMemo(
    () => computeRecommendations(likedIds, recentIds, searchHistory),
    [likedIds, recentIds, searchHistory],
  );

  const refreshRecs = useCallback(() => setTick((t) => t + 1), []);

  return { recommendations, topMood, refreshRecs };
}
