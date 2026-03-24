# Soundwave Music Player

## Current State
Full-featured music streaming app with:
- Dual-player system (HTML5 Audio + YouTube IFrame API) in usePlayer.ts (909 lines)
- CinematicHero component with Coverr CDN video background
- PaymentModal with Razorpay checkout (UPI via Razorpay)
- PlayerBar, FullScreenPlayer, AIChat, Firebase auth all wired
- SoundHelix MP3 URLs in songs.ts

## Requested Changes (Diff)

### Add
- UPI direct payment option in PaymentModal: QR code display + UPI ID (PhonePe/GPay) with simulated success flow
- Hero fallback image using a reliable CDN (Unsplash/Pexels) when video fails
- "More Info" modal handler wired in App.tsx → MainContent → CinematicHero

### Modify
- **usePlayer.ts**: Remove dual-player complexity, use ONE global HTML5 Audio instance only. Remove all YouTube IFrame API code (no playYT, no ytQueue, etc.). Keep queue, shuffle, repeat, seek, volume, like, recent, progress. All songs play from .src (SoundHelix URLs).
- **audioEngine.ts**: Remove ytVolumeInterval and YouTube-specific methods. Keep Web Audio API effects for local tracks only.
- **CinematicHero.tsx**: Fix hero background video/image visibility. Add fallback Unsplash image. Ensure z-index layering is correct. Wire More Info button to open a details modal.
- **App.tsx**: Remove YouTube IFrame player div and all ytQueue/ytQueueIdx/playYT/playExternalSong/pauseHiddenYT/resumeHiddenYT references. Add moreInfo modal state + handler. Simplify player prop passing.
- **PlayerBar.tsx**: Remove currentMode/youtube-specific branching. Always show waveform for local tracks.
- **MainContent.tsx**: Remove onPlayYT/onPlayYouTubeSong props and YouTube result card play handlers. Keep search UI but clicking YouTube results plays via HTML5 audio fallback or ignores YT-only tracks.
- **PaymentModal.tsx**: Add a second payment path: "Pay via UPI" tab that shows a QR code image + UPI ID text. Simulates success after 3s delay when user clicks "I've Paid".

### Remove
- YouTube IFrame API integration from player hook
- Hidden YT player div from App.tsx
- ytQueue, ytQueueIdx, playYT, playExternalSong, pauseHiddenYT, resumeHiddenYT from usePlayer
- currentMode="youtube" branching throughout components

## Implementation Plan
1. Rewrite usePlayer.ts — single HTML5 Audio instance, remove all YT code
2. Update audioEngine.ts — remove ytVolumeInterval, keep audio effects
3. Fix CinematicHero.tsx — ensure video visible, add fallback image, fix z-index, add More Info modal
4. Update App.tsx — remove YT references, add More Info modal, simplify
5. Update PlayerBar.tsx — remove currentMode prop dependency
6. Update MainContent.tsx — remove YT-specific play handlers
7. Enhance PaymentModal.tsx — add UPI direct tab with QR + simulated success
