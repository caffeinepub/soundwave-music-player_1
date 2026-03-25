# Soundwave Music Player

## Current State

A fully-featured React + Vite music streaming app (v59) with:
- Global HTML5 Audio for SoundHelix local tracks (usePlayer hook)
- YouTubePlayerEmbed component showing a visible iframe panel (not hidden)
- YouTube Data API v3 search with live results dropdown in MainContent
- Cinematic hero, AI chat, Dolby Atmos toggle, Firebase auth, Razorpay payments
- MainContent has carousels for local songs, artist rows, AI recommendations
- PlayerBar shown for local tracks; YouTubePlayerEmbed panel shown separately for YouTube

## Requested Changes (Diff)

### Add
- Hidden YouTube IFrame Player API (useYouTubePlayer hook): load youtube.com/iframe_api, create YT.Player at 1x1px off-screen. Exposes loadVideo, play, pause, seekTo, setVolume, getProgress. Progress polled every 300ms.
- Unified PlayerBar for YouTube tracks: when YouTube is active, show same PlayerBar synced to hidden YT IFrame.
- YouTube Trending carousel: fetch youtube.com/v3/videos?chart=mostPopular&videoCategoryId=10, show horizontal scroll row "Trending Now". Fallback to curated videoIds if API fails.
- "Because You Listened To..." carousel: reads sw_recent from localStorage, searches YouTube for last artist + "similar", shows as horizontal row.
- X-Ray side panel (XRayPanel): collapsible right-side drawer from FullScreenPlayer with simulated artist trivia, bio, top facts.
- Dynamic accent color: canvas sample dominant color from YouTube thumbnail; apply as CSS var --accent-dynamic on player glow/border.

### Modify
- YouTubePlayerEmbed.tsx: rewrite to hidden 1x1px div off-screen. YT.Player API only. No visible iframe panel.
- App.tsx: always show PlayerBar; route controls to ytPlayer or localPlayer based on which is active.
- MainContent.tsx: add Trending and "Because You Listened To..." rows to home view.

### Remove
- Visible YouTube embed panel (slide-up iframe)
- The !ytVideoId condition that hides PlayerBar during YouTube playback

## Implementation Plan

1. Create useYouTubePlayer.ts hook with YT IFrame API, queue, state, progress polling
2. Rewrite YouTubePlayerEmbed.tsx to mount hidden 1x1px div
3. Create XRayPanel.tsx with artist trivia drawer
4. Create useTrendingYouTube.ts hook
5. Update MainContent.tsx with two new carousels
6. Update App.tsx for unified PlayerBar
7. Dynamic accent color via canvas thumbnail sampling
