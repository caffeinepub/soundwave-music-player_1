# Soundwave Music Player

## Current State
Full-stack music streaming app with:
- Real audio playback: HTML5 Audio (SoundHelix) + YouTube IFrame API dual-player
- PlayerBar with progress, volume, shuffle, repeat, Dolby Atmos toggle
- MainContent: home (hero, horizontal rows, artist cards), search (YouTube API dropdown + results), liked, recent views
- Sidebar with playlist navigation
- YouTube search via youtubeSearch.ts with memory/localStorage cache
- recentIds + likedIds tracked in localStorage
- No auth system, no payment system, no AI recommendations

## Requested Changes (Diff)

### Add
- `useAuth` hook: Firebase Auth with Google Sign-In + Email/Password, demo fallback when no config keys set. Persist session in localStorage.
- `useRecommendations` hook: localStorage-based smart recommendations engine. Inputs: likedIds, recentIds, searchHistory. Maps songs to moods (chill, workout, focus, party, romantic). Returns ranked song suggestions + mood-matched playlists.
- `SignInModal` component: Google / Email+Password / Apple (UI only) sign-in. Uses `useAuth`. Matches existing dark glassmorphism design system.
- `PaymentModal` component: Razorpay Checkout frontend integration. Plans: Free/Premium. On success stores `sw_premium=true` in localStorage. Demo mode when no Razorpay key.
- `AIRecommendations` component: "Recommended for You" section on home page. Shows personalized cards based on listening history. Mood filter pills. Ready for future AI API hookup.
- Search history tracking: persist last 20 search queries in localStorage `sw_search_history`.

### Modify
- `App.tsx`: Add `useAuth`, `isPremium` state, expose `showSignIn`/`showPayment` state triggers, pass `user`, `isPremium`, `onSignIn`, `onSignOut`, `onUpgrade` to Sidebar and MainContent.
- `MainContent.tsx`: Accept `user` + `isPremium` + `likedIds` + `recentIds` + `onShowSignIn` + `onShowPayment`. Add `AIRecommendations` section in home view between hero and first row. Track search queries in localStorage `sw_search_history`.
- `Sidebar.tsx`: Accept `user`, `isPremium`, `onSignIn`, `onSignOut`, `onUpgrade`. Show user avatar + name + plan badge at bottom. Show "Sign In" button when not logged in. Show "Upgrade" CTA for free users.
- `index.html`: Add Razorpay checkout script.

### Remove
- Nothing removed — purely additive changes.

## Implementation Plan
1. Create `src/frontend/src/hooks/useAuth.ts` — Firebase auth with localStorage demo fallback
2. Create `src/frontend/src/hooks/useRecommendations.ts` — pure localStorage recommendation engine
3. Create `src/frontend/src/components/SignInModal.tsx` — auth modal
4. Create `src/frontend/src/components/PaymentModal.tsx` — Razorpay modal
5. Create `src/frontend/src/components/AIRecommendations.tsx` — recommendations section
6. Update `src/frontend/src/App.tsx` — wire auth + payment state
7. Update `src/frontend/src/components/MainContent.tsx` — add AIRecommendations, search history, user props
8. Update `src/frontend/src/components/Sidebar.tsx` — add user profile, sign-in/upgrade CTAs
9. Update `src/frontend/index.html` — add Razorpay script
