# Soundwave Music Player

## Current State

Soundwave is a React + Vite music streaming app (version 60) with:
- `usePlayer` hook: single global HTML5 Audio instance for SoundHelix/MP3 tracks
- `useYouTubePlayer` hook: YT IFrame Player API, currently mounts a 1x1 hidden div (`yt-hidden-player`) at top:-9999px — not policy-compliant
- `YouTubePlayerEmbed` component: renders the hidden div (no visible player)
- `PlayerBar` component: unified controls for both audio and YT modes
- `QueuePanel`: local songs queue (localStorage for liked/recent/volume)
- No YT queue/last-played localStorage persistence
- No mini-player for YouTube playback

## Requested Changes (Diff)

### Add
- `YouTubeMiniPlayer.tsx`: fixed bottom-right mini-player component containing the visible YouTube iframe (policy-compliant). Small by default (200×113), expandable to 360×203. Has title overlay, close button, expand/collapse toggle. Smooth slide-in animation on mount. Hidden when `ytActive` is false.
- Queue localStorage persistence in `useYouTubePlayer`: save/restore full queue (`sw_yt_queue`) and last-played track (`sw_yt_last`) across page refreshes. On restore, mark `ytActive=true` and populate track info but do NOT autoplay — user must press play.
- `needsLoad` ref in `useYouTubePlayer`: tracks whether a restored video hasn't been loaded into the iframe yet. On first `togglePlay` after restore, call `loadVideoById` then `playVideo`.

### Modify
- `useYouTubePlayer.ts`: change player mount target from `yt-hidden-player` (hidden off-screen div) to `yt-mini-container` (inside the visible mini-player). Remove `ensureHiddenDiv()`. Add LS persistence for queue and last-played. Handle no-autoplay restore.
- `YouTubePlayerEmbed.tsx`: replaced entirely by `YouTubeMiniPlayer.tsx`.
- `App.tsx`: import and render `YouTubeMiniPlayer` instead of `YouTubePlayerEmbed`. Pass `ytPlayer` props to it.

### Remove
- `ensureHiddenDiv()` helper in `useYouTubePlayer` — no longer needed since div is React-managed
- `YouTubePlayerEmbed.tsx` — superseded by `YouTubeMiniPlayer.tsx`

## Implementation Plan

1. Update `useYouTubePlayer.ts`:
   - Change `MINI_PLAYER_DIV_ID = 'yt-mini-container'`
   - Remove `ensureHiddenDiv()` and its call in `useEffect`
   - Add `loadLastPlayed()` / `loadYTQueue()` helpers reading from localStorage
   - On init: if `lastPlayed` exists, set `ytActive=true`, `ytVideoId`, `ytTitle`, `ytThumbnail` — but set `needsLoad=true` (don't call `loadVideoById`)
   - On `togglePlay` when paused: if `needsLoad=true`, call `loadVideoById(ytVideoId)` first, then `playVideo`; clear `needsLoad`
   - Save queue to `sw_yt_queue` on every queue mutation
   - Save last-played to `sw_yt_last` whenever `loadVideoInternal` is called

2. Create `YouTubeMiniPlayer.tsx`:
   - `position: fixed; bottom: 100px; right: 16px; z-index: 500`
   - AnimatePresence slide-up on mount when `ytActive`
   - Collapsed: 200×113 iframe + title overlay bar at bottom
   - Expanded: 360×203 iframe + title overlay
   - Buttons: expand/collapse (ChevronUp/Down), close (X stops YT)
   - Glassmorphism container: `rgba(15,21,32,0.9)`, `backdrop-filter: blur(16px)`, neon green top border
   - Renders `<div id="yt-mini-container">` which the YT IFrame API targets

3. Update `App.tsx`:
   - Replace `<YouTubePlayerEmbed />` with `<YouTubeMiniPlayer ytPlayer={ytPlayer} />`
