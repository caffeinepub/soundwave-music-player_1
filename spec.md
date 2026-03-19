# Soundwave Music Player — Production Upgrade

## Current State
- Fully featured Netflix/Spotify-style music player with React/TypeScript frontend and Motoko backend
- YouTube API called **directly from frontend** via `youtubeSearch.ts` using `VITE_YOUTUBE_API_KEY` env variable
- API key is exposed in frontend bundle (security issue)
- Motoko backend has liked songs, display name — no HTTP outcall proxy
- UI has hero banner, horizontal scroll rows, artist cards with YouTube thumbnails, glassmorphism player, full-screen player, Dolby Atmos toggle, intro animation, responsive mobile layout

## Requested Changes (Diff)

### Add
- **Motoko HTTP outcall proxy**: `searchYouTube(query: Text) : async Text` — calls YouTube Data API v3 server-side, returns JSON string of results. API key stored securely in canister variable, never exposed to browser.
- **Backend `setApiKey(key: Text)` admin method** to update the YouTube API key stored in canister
- **Frontend `backendSearch.ts`**: replaces `youtubeSearch.ts` direct calls — calls `actor.searchYouTube(query)`, falls back to cached results, then final YouTube redirect
- Hardcoded artist playlists (YouTube video IDs) for Arijit Singh, Shreya Ghoshal, Taylor Swift, The Weeknd — Top Songs + Popular Tracks sections
- Loading skeleton UI for search results
- 300ms debounce on search input
- Clean UI error states (no raw error text)

### Modify
- `youtubeSearch.ts` → routes through Motoko actor instead of direct `youtube.googleapis.com` fetch
- `MainContent.tsx` → search now calls backend proxy; show skeleton while loading
- `songs.ts` → add hardcoded YouTube video IDs for curated artist playlists
- Hero banner: cinematic with real YouTube thumbnails, gradient overlay, zoom animation
- Artist cards: real thumbnails, hover scale + play overlay + glow shadow
- Player bar: glassmorphism, smooth progress, expandable full-screen on desktop+mobile
- UI theme: deep black/dark purple/neon accents, consistent premium styling

### Remove
- Direct `youtube.googleapis.com` API calls from frontend
- `VITE_YOUTUBE_API_KEY` env variable dependency in production (key moves to Motoko canister)

## Implementation Plan
1. Select `http-outcalls` Caffeine component
2. Generate Motoko code: HTTP outcall to YouTube search API, store API key in canister, `searchYouTube(query)` returns JSON, `setApiKey(key)` admin setter
3. Frontend: rewrite `youtubeSearch.ts` to call `actor.searchYouTube()` from backend.d.ts bindings; add 300ms debounce; add in-memory + localStorage cache on top
4. Add curated artist playlist data (hardcoded YouTube video IDs for 4 artists)
5. Full UI polish pass: hero banner with real thumbnails, horizontal rows, premium cards, glassmorphism player, skeleton loaders, clean error states
