import { ytPlayerRef } from "../hooks/useYouTubePlayer";

// Export stop function so other components can pause YT when local audio starts
export function stopYTPlayer() {
  try {
    ytPlayerRef.current?.stopVideo();
  } catch (_) {}
}

/**
 * Renders the hidden div that the YT IFrame API attaches to.
 * The actual player management is done by useYouTubePlayer hook.
 */
export default function YouTubePlayerEmbed() {
  // The div is created imperatively by useYouTubePlayer, but we also render
  // a fallback here in case the hook hasn't created it yet.
  return (
    <div
      id="yt-hidden-player"
      aria-hidden="true"
      style={{
        position: "fixed",
        top: -9999,
        left: -9999,
        width: 1,
        height: 1,
        zIndex: -1,
        pointerEvents: "none",
        overflow: "hidden",
      }}
    />
  );
}
