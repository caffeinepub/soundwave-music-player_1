# Soundwave Music Player

## Current State
- MainContent.tsx has a home view with greeting, featured playlist cards (emoji-based), trending grid, and recently played grid
- Artist cards use emoji + colorClass gradients as backgrounds — no real images
- Hero banner: none (just a heading greeting)
- No horizontal Netflix-style rows
- songs.ts has local sample tracks with emoji/colorClass only
- No artist image mapping in the codebase

## Requested Changes (Diff)

### Add
- Hero banner component at top of home view: full-width 16:9 image (`/assets/generated/hero-banner.dim_1920x1080.jpg`), dark gradient overlay (linear-gradient bottom to top: black → transparent), subtle vignette CSS effect (radial-gradient dark edges), slow zoom animation (scale 1 → 1.05, 8s infinite alternate), overlay text: "Trending Artist", subtitle "Top Hits", a large play button
- Artist image map: 20 generated images mapped to each Bollywood/Hollywood artist by name
- ArtistCard component (separate from SongCard): displays artist portrait image, artist name, hover effects (scale 1.05, dark overlay appears, play icon overlaid center), consistent 1:1 aspect ratio cropped images, lazy loading (`loading="lazy"`)
- Two horizontal scroll sections on home view: "Top Bollywood Artists" and "Top Global Artists" — each a horizontal flex row with scroll-snap, showing ArtistCards. Clicking an artist card triggers artist playlist (use existing onPlayYT/onSongPlay mechanism)
- "Trending Now" section becomes a horizontal scroll row (same Netflix style) instead of grid
- Gradient fade on right edge of horizontal scroll rows using a CSS mask or pseudo-element

### Modify
- SongCard: when a `artistImage` prop is available use it as background instead of emoji/gradient. Keep existing like/play overlay behavior
- Home view: hero banner replaces the greeting h1 at the very top; greeting can be shown as small text overlaid or removed
- Artist card images: use `/assets/generated/artist-{slug}.dim_400x400.jpg` format where slug is artist name lowercased with spaces replaced by hyphens
- All card images: add `loading="lazy"` for performance

### Remove
- Emoji-only gradient backgrounds on artist cards (replaced by real images with fallback to gradient if image fails)

## Implementation Plan
1. Add `ARTIST_IMAGES` map in songs.ts or a new `artistImages.ts` — maps artist name to `/assets/generated/artist-{slug}.dim_400x400.jpg`
2. Create `HeroBanner` component: uses hero-banner image, gradient/vignette overlay, zoom animation via CSS keyframes, play button, title/subtitle text
3. Create `ArtistCard` component: image with object-cover, hover scale + dark overlay + play icon, lazy load, consistent sizing
4. Create `HorizontalRow` component: horizontal scrolling flex container with scroll-snap, showing a title + row of cards, gradient fade on right edge
5. In home view of MainContent.tsx: place HeroBanner at top (before featured cards), add HorizontalRow for "Top Bollywood Artists", "Top Global Artists", replace "Trending Now" grid with HorizontalRow
6. Add BOLLYWOOD_ARTISTS and HOLLYWOOD_ARTISTS arrays with name + slug for image mapping
7. On ArtistCard click: call onPlayYT with artist's first top song videoId or trigger search for artist
8. CSS: add `@keyframes heroBannerZoom` for the slow zoom, vignette via box-shadow inset on overlay
