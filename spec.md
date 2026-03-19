# Soundwave Music Player — Production Upgrade

## Current State
- Full-stack app: Motoko backend (YouTube proxy), React/TS/Tailwind frontend
- YouTube IFrame API used via hidden `#yt-player` div (0x0 off-screen); loadVideoById controls playback
- PlayerBar shows emoji/color art — not YouTube thumbnails
- FullScreenPlayer shows blurred bg from YT thumbnail but art center is still emoji
- FullScreenPlayer does NOT show the actual YouTube iframe/video
- Netflix-style horizontal scroll rows exist but hero banner is not fully cinematic
- Search routes through Motoko backend proxy; caching in memory + localStorage
- Artist playlists hardcoded with YouTube video IDs
- Dolby Atmos toggle implemented (real Web Audio for local, simulated for YouTube)
- ErrorBoundary and error states implemented
- Autoplay is off (playerVars: { autoplay: 0 })

## Requested Changes (Diff)

### Add
- YouTube thumbnail display in PlayerBar art slot (mqdefault fallback to hqdefault)
- YouTube video visible in FullScreenPlayer via `<iframe>` embed (autoplay=1, controls=0) shown when YT song is active
- FullScreenPlayer: when YouTube video, show iframe in the art area + background blur from same thumbnail
- FullScreenPlayer close button prominent, smooth slide-up animation
- Robust image fallback for all artist cards: maxresdefault → hqdefault → mqdefault → default.jpg
- Clean error state for search: "Search temporarily unavailable" + link to YouTube search
- Loading skeleton for search results (already partially exists, verify)
- Mobile: mini player tap opens FullScreenPlayer (already exists, verify)

### Modify
- PlayerBar art: replace emoji div with `<img>` showing YouTube thumbnail when song.youtubeId exists; fallback to emoji for local songs
- FullScreenPlayer art area: when song.youtubeId, embed `<iframe>` instead of emoji/art card; use 16:9 aspect ratio
- The #yt-player hidden div: set width/height to 1px minimum but use `visibility:hidden` approach so YouTube IFrame API initializes correctly
- HeroBanner: ensure it always renders (the topVideoId fallback chain works); add smooth zoom animation
- Netflix rows: ensure horizontal scroll snap works on mobile; add row labels clearly
- Search error handling: catch FallbackError and show clean UI with YouTube redirect link
- Artist cards: use two-level image fallback (maxresdefault → hqdefault with onerror handler)

### Remove
- No features removed; only fixes and upgrades

## Implementation Plan
1. PlayerBar.tsx — add thumbnail img when youtubeId set, with onerror fallback to emoji
2. FullScreenPlayer.tsx — when song.youtubeId, replace art area with embedded `<iframe src="https://www.youtube.com/embed/{id}?autoplay=1&controls=0&rel=0&modestbranding=1">` in a 16:9 container with cover fit; keep background blur behind it
3. App.tsx — #yt-player: use visibility:hidden + position fixed offscreen to ensure YT API init works; when FullScreenPlayer is open and mode is youtube, pause the hidden player to avoid double audio (the iframe embed in FullScreenPlayer handles playback)
4. Note on dual audio: when FullScreenPlayer shows embedded iframe with autoplay=1, the hidden YT player must be paused. When FullScreenPlayer closes, resume via hidden YT player. Track this in usePlayer via new `isFullScreenOpen` ref.
5. MainContent.tsx — fix artist card image fallback chain; verify Netflix rows work
6. youtubeSearch.ts — improve error UI messaging
7. CSS — ensure full-screen player slide-up animation is smooth; add mobile tap target sizes
