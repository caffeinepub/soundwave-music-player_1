import { useEffect, useState } from "react";
import IntroAnimation from "./components/IntroAnimation";
import MainContent from "./components/MainContent";
import PlayerBar from "./components/PlayerBar";
import QueuePanel from "./components/QueuePanel";
import Sidebar from "./components/Sidebar";
import Toast from "./components/Toast";
import { songs } from "./data/songs";
import { usePlayer } from "./hooks/usePlayer";

type ActiveView = "home" | "search" | "liked" | "recent";

export default function App() {
  const [introSeen, setIntroSeen] = useState(
    () => !!sessionStorage.getItem("sw_intro_seen"),
  );
  const [activeView, setActiveView] = useState<ActiveView>("home");
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const player = usePlayer();

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;
      if (e.code === "Space") {
        e.preventDefault();
        player.togglePlay();
      }
      if (e.code === "ArrowRight" && !e.shiftKey) player.nextTrack();
      if (e.code === "ArrowLeft" && !e.shiftKey) player.prevTrack();
      if (e.code === "KeyL") player.toggleLike();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [player]);

  const handleNavChange = (nav: string) => {
    if (
      nav === "home" ||
      nav === "search" ||
      nav === "liked" ||
      nav === "recent"
    ) {
      setActiveView(nav as ActiveView);
    }
  };

  return (
    <div className="app-shell">
      {!introSeen && <IntroAnimation onDone={() => setIntroSeen(true)} />}

      {/* YouTube IFrame Player container — hidden, controlled by usePlayer */}
      <div
        id="yt-player"
        style={{
          position: "fixed",
          bottom: -200,
          left: -200,
          width: 1,
          height: 1,
          overflow: "hidden",
          pointerEvents: "none",
        }}
      />

      <Sidebar activeNav={activeView} onNavChange={handleNavChange} />

      <MainContent
        activeView={activeView}
        songs={songs}
        currentSongId={player.currentSong?.id ?? null}
        isPlaying={player.isPlaying}
        likedIds={player.likedIds}
        recentIds={player.recentIds}
        searchQuery={searchQuery}
        onSongPlay={player.playTrack}
        onPlayYouTubeSong={player.playExternalSong}
        onPlayYT={player.playYT}
        onToggleLike={(songId) => {
          const idx = songs.findIndex((s) => s.id === songId);
          if (idx === player.currentIdx) {
            player.toggleLike();
          } else {
            player.showToast(
              player.likedIds.has(songId)
                ? "Removed from Liked Songs"
                : "Added to Liked Songs",
            );
          }
        }}
        onViewChange={(v) => setActiveView(v as ActiveView)}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (activeView !== "search") setActiveView("search");
        }}
      />

      <PlayerBar
        song={player.currentSong}
        isPlaying={player.isPlaying}
        progress={player.progress}
        currentTime={player.currentTime}
        duration={player.duration}
        volume={player.volume}
        isShuffled={player.isShuffle}
        repeatMode={player.repeatMode}
        isLiked={player.isCurrentLiked}
        isQueueOpen={isQueueOpen}
        atmosMode={player.atmosMode}
        onTogglePlay={player.togglePlay}
        onPrev={player.prevTrack}
        onNext={player.nextTrack}
        onSeek={player.seek}
        onVolumeChange={player.setVolume}
        onToggleShuffle={player.toggleShuffle}
        onToggleRepeat={player.toggleRepeat}
        onToggleLike={player.toggleLike}
        onToggleQueue={() => setIsQueueOpen((prev) => !prev)}
        onToggleAtmos={player.toggleAtmos}
      />

      <QueuePanel
        isOpen={isQueueOpen}
        songs={songs}
        currentIdx={player.currentIdx}
        ytQueue={player.ytQueue}
        ytQueueIdx={player.ytQueueIdx}
        currentSong={player.currentSong}
        onClose={() => setIsQueueOpen(false)}
        onPlayTrack={player.playTrack}
        onPlayYT={(song) => {
          if (song.youtubeId) player.playYT(song.youtubeId, song.title);
        }}
      />

      <Toast message={player.toastMsg} visible={player.toastMsg !== ""} />

      {/* Mobile bottom nav */}
      <div className="mob-nav">
        {(["home", "search", "liked", "recent"] as const).map((v) => (
          <button
            key={v}
            type="button"
            data-ocid={`mobnav.${v}.button`}
            onClick={() => setActiveView(v)}
            className="mob-btn"
            style={{
              color: activeView === v ? "#1DB954" : "#b3b3b3",
            }}
          >
            {v === "home" && "🏠"}
            {v === "search" && "🔍"}
            {v === "liked" && "❤️"}
            {v === "recent" && "🕐"}
            <span style={{ fontSize: 10 }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
