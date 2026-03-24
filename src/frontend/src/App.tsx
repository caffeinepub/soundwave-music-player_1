import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import AIChat from "./components/AIChat";
import FullScreenPlayer from "./components/FullScreenPlayer";
import IntroAnimation from "./components/IntroAnimation";
import MainContent from "./components/MainContent";
import PaymentModal, { type PlanInfo } from "./components/PaymentModal";
import PlayerBar from "./components/PlayerBar";
import QueuePanel from "./components/QueuePanel";
import Sidebar from "./components/Sidebar";
import SignInModal from "./components/SignInModal";
import Toast from "./components/Toast";
import YouTubePlayerEmbed, {
  stopYTPlayer,
} from "./components/YouTubePlayerEmbed";
import { songs } from "./data/songs";
import { type AuthUser, useAuth } from "./hooks/useAuth";
import { usePlayer } from "./hooks/usePlayer";
import { usePremium } from "./hooks/usePremium";

type ActiveView = "home" | "search" | "liked" | "recent";

const PREMIUM_PLAN: PlanInfo = {
  name: "Premium",
  price: "\u20b9119",
  amountPaise: 11900,
  period: "per month",
  color: "#1DB954",
};

export default function App() {
  const [introSeen, setIntroSeen] = useState(
    () => !!sessionStorage.getItem("sw_intro_seen"),
  );
  const [activeView, setActiveView] = useState<ActiveView>("home");
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isFullScreenPlayerOpen, setIsFullScreenPlayerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSignIn, setShowSignIn] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const { isPremium, activatePremium, daysLeft } = usePremium();

  const { user, loading: authLoading, signOut } = useAuth();
  const player = usePlayer();
  const [ytVideoId, setYtVideoId] = useState<string | null>(null);
  const [ytTitle, setYtTitle] = useState("");

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

  const handleSignInSuccess = (_u: AuthUser) => {
    setShowSignIn(false);
  };

  const handleYTPlay = (videoId: string, title: string) => {
    player.pauseAudio();
    setYtVideoId(videoId);
    setYtTitle(title);
  };

  const handleYTClose = () => {
    setYtVideoId(null);
    setYtTitle("");
  };

  const handleLocalPlay = (idx: number) => {
    stopYTPlayer();
    setYtVideoId(null);
    player.playTrack(idx);
  };

  if (authLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "#0a0a0a",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            border: "3px solid rgba(29,185,84,0.3)",
            borderTopColor: "#1DB954",
            borderRadius: "50%",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <span style={{ color: "#b3b3b3", fontSize: 14 }}>
          Loading Soundwave\u2026
        </span>
        <style>{"@keyframes spin { to { transform: rotate(360deg); } }"}</style>
      </div>
    );
  }

  return (
    <div className="app-shell">
      {!introSeen && <IntroAnimation onDone={() => setIntroSeen(true)} />}

      <SignInModal
        isOpen={showSignIn}
        onClose={() => setShowSignIn(false)}
        onSuccess={handleSignInSuccess}
        onToast={(msg) => player.showToast(msg)}
      />

      <PaymentModal
        isOpen={showPayment}
        plan={PREMIUM_PLAN}
        onClose={() => setShowPayment(false)}
        onSuccess={activatePremium}
      />

      {/* More Info Modal */}
      <AnimatePresence>
        {showMoreInfo && (
          <motion.div
            data-ocid="more_info.modal"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMoreInfo(false)}
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.88)",
              backdropFilter: "blur(20px)",
              zIndex: 900,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
          >
            <motion.div
              initial={{ y: 32, opacity: 0, scale: 0.95 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 32, opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 280, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "linear-gradient(145deg, #141420, #0e0e1a)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 20,
                padding: "36px 32px",
                width: "100%",
                maxWidth: 480,
                position: "relative",
              }}
            >
              <button
                type="button"
                data-ocid="more_info.close_button"
                onClick={() => setShowMoreInfo(false)}
                style={{
                  position: "absolute",
                  top: 14,
                  right: 14,
                  background: "rgba(255,255,255,0.07)",
                  border: "none",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  color: "#b3b3b3",
                  cursor: "pointer",
                  fontSize: 15,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                \u2715
              </button>
              <div
                style={{
                  color: "#1DB954",
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: "0.2em",
                  marginBottom: 10,
                }}
              >
                \u2726 FEATURED TRACK
              </div>
              <h2
                style={{
                  color: "#fff",
                  fontSize: 28,
                  fontWeight: 900,
                  letterSpacing: "-0.02em",
                  marginBottom: 8,
                }}
              >
                Soundwave Premium
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,0.6)",
                  fontSize: 14,
                  lineHeight: 1.7,
                  marginBottom: 24,
                }}
              >
                Discover the best curated tracks on Soundwave. Immerse yourself
                in crystal-clear audio with Dolby Atmos support, an ever-growing
                library of over 10 million songs, and personalised AI-powered
                recommendations.
              </p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <motion.button
                  type="button"
                  data-ocid="more_info.play.button"
                  whileHover={{
                    scale: 1.04,
                    boxShadow: "0 0 32px rgba(29,185,84,0.5)",
                  }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    player.playTrack(0);
                    setShowMoreInfo(false);
                  }}
                  style={{
                    background: "#1DB954",
                    border: "none",
                    borderRadius: 50,
                    padding: "12px 28px",
                    color: "#000",
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  \u25b6\ufe0e Play Now
                </motion.button>
                <motion.button
                  type="button"
                  data-ocid="more_info.upgrade.button"
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => {
                    setShowMoreInfo(false);
                    setShowPayment(true);
                  }}
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    borderRadius: 50,
                    padding: "12px 28px",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                    backdropFilter: "blur(8px)",
                  }}
                >
                  Get Premium
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Sidebar
        activeNav={activeView}
        onNavChange={handleNavChange}
        user={user}
        isPremium={isPremium}
        daysLeft={daysLeft}
        onSignIn={() => setShowSignIn(true)}
        onSignOut={signOut}
        onUpgrade={() => setShowPayment(true)}
      />

      <MainContent
        activeView={activeView}
        songs={songs}
        currentSongId={player.currentSong?.id ?? null}
        isPlaying={player.isPlaying}
        likedIds={player.likedIds}
        recentIds={player.recentIds}
        searchQuery={searchQuery}
        onSongPlay={handleLocalPlay}
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
        onMoreInfo={() => setShowMoreInfo(true)}
        onShowToast={player.showToast}
        user={user}
        isPremium={isPremium}
        onShowSignIn={() => setShowSignIn(true)}
        onShowPayment={() => setShowPayment(true)}
        onYTPlay={handleYTPlay}
      />

      <YouTubePlayerEmbed
        videoId={ytVideoId}
        title={ytTitle}
        onClose={handleYTClose}
      />

      {!ytVideoId && (
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
          audioUrl={player.currentSong?.src ?? ""}
          onExpandPlayer={() => setIsFullScreenPlayerOpen(true)}
        />
      )}

      <FullScreenPlayer
        isOpen={isFullScreenPlayerOpen}
        onClose={() => setIsFullScreenPlayerOpen(false)}
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
        currentSong={player.currentSong}
        onClose={() => setIsQueueOpen(false)}
        onPlayTrack={handleLocalPlay}
      />

      <Toast message={player.toastMsg} visible={player.toastMsg !== ""} />

      <AIChat />

      {/* Mobile bottom nav */}
      <div className="mob-nav">
        {(["home", "search", "liked", "recent"] as const).map((v) => (
          <button
            key={v}
            type="button"
            data-ocid={`mobnav.${v}.button`}
            onClick={() => setActiveView(v)}
            className="mob-btn"
            style={{ color: activeView === v ? "#1DB954" : "#b3b3b3" }}
          >
            {v === "home" && "\uD83C\uDFE0"}
            {v === "search" && "\uD83D\uDD0D"}
            {v === "liked" && "\u2764\uFE0F"}
            {v === "recent" && "\uD83D\uDD50"}
            <span style={{ fontSize: 10 }}>
              {v.charAt(0).toUpperCase() + v.slice(1)}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
