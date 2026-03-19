import {
  ChevronDown,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useRef } from "react";
import { type Song, formatTime } from "../data/songs";
import type { AudioMode } from "../engines/audioEngine";
import type { RepeatMode } from "../hooks/usePlayer";
import AtmosToggle from "./AtmosToggle";

interface FullScreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  song: Song | null;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  volume: number;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  isLiked: boolean;
  isQueueOpen: boolean;
  atmosMode: AudioMode;
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (p: number) => void;
  onVolumeChange: (v: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleLike: () => void;
  onToggleQueue: () => void;
  onToggleAtmos: () => void;
}

const Accent = "#1DB954";
const AccentGlow = "rgba(29, 185, 84, 0.45)";
const SubtleColor = "#b3b3b3";
const MutedColor = "#6a6a6a";
const FgColor = "#ffffff";

export default function FullScreenPlayer({
  isOpen,
  onClose,
  song,
  isPlaying,
  progress,
  currentTime,
  duration,
  volume,
  isShuffled,
  repeatMode,
  isLiked,
  isQueueOpen,
  atmosMode,
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleShuffle,
  onToggleRepeat,
  onToggleLike,
  onToggleQueue,
  onToggleAtmos,
}: FullScreenPlayerProps) {
  const progressRef = useRef<HTMLDivElement>(null);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
  };

  const handleProgressKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") onSeek(Math.min(1, progress + 0.02));
    if (e.key === "ArrowLeft") onSeek(Math.max(0, progress - 0.02));
  };

  const displayDuration = duration || (song?.duration ?? 0);

  // Background art URL
  const bgUrl = song?.youtubeId
    ? `https://img.youtube.com/vi/${song.youtubeId}/maxresdefault.jpg`
    : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          data-ocid="fullscreen_player.panel"
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          {/* Blurred background */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: bgUrl
                ? `url(${bgUrl}) center/cover no-repeat`
                : "linear-gradient(135deg, #1a1a2e 0%, #0d0d0d 100%)",
              filter: "blur(60px) brightness(0.35)",
              transform: "scale(1.1)",
            }}
          />
          {/* Dark overlay */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.55)",
            }}
          />

          {/* Content */}
          <div
            style={{
              position: "relative",
              zIndex: 1,
              width: "100%",
              maxWidth: 480,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              height: "100%",
              padding: "0 24px 40px",
            }}
          >
            {/* Top bar */}
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                paddingTop: 20,
                paddingBottom: 12,
              }}
            >
              <button
                type="button"
                data-ocid="fullscreen_player.close_button"
                onClick={onClose}
                aria-label="Close player"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "50%",
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: FgColor,
                  transition: "background 0.2s ease",
                }}
              >
                <ChevronDown size={22} aria-hidden="true" />
              </button>
              <span
                style={{
                  color: SubtleColor,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                }}
              >
                Now Playing
              </span>
              <button
                type="button"
                data-ocid="fullscreen_player.queue.toggle"
                onClick={onToggleQueue}
                aria-label="Toggle queue"
                style={{
                  background: isQueueOpen
                    ? "rgba(29,185,84,0.15)"
                    : "rgba(255,255,255,0.1)",
                  border: "none",
                  borderRadius: "50%",
                  width: 40,
                  height: 40,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: isQueueOpen ? Accent : FgColor,
                  transition: "background 0.2s ease, color 0.2s ease",
                }}
              >
                <ListMusic size={18} aria-hidden="true" />
              </button>
            </div>

            {/* Album art */}
            <div
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "100%",
                maxHeight: 360,
                padding: "12px 0",
              }}
            >
              <div
                style={{
                  width: "min(280px, 75vw)",
                  height: "min(280px, 75vw)",
                  borderRadius: "50%",
                  overflow: "hidden",
                  boxShadow: isPlaying
                    ? `0 0 60px ${AccentGlow}, 0 8px 40px rgba(0,0,0,0.7)`
                    : "0 8px 40px rgba(0,0,0,0.7)",
                  animation: isPlaying
                    ? "albumRotate 12s linear infinite"
                    : "none",
                  transition: "box-shadow 0.4s ease",
                }}
                className={`flex items-center justify-center text-7xl ${song?.colorClass ?? ""}`}
              >
                {song ? (
                  <span aria-hidden="true" style={{ fontSize: "4rem" }}>
                    {song.emoji}
                  </span>
                ) : (
                  <span aria-hidden="true">🎵</span>
                )}
              </div>
            </div>

            {/* Song info + like */}
            <div
              style={{
                width: "100%",
                display: "flex",
                alignItems: "flex-start",
                justifyContent: "space-between",
                marginBottom: 24,
                gap: 12,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: FgColor,
                    fontSize: 22,
                    fontWeight: 800,
                    letterSpacing: "-0.02em",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {song?.title ?? "Select a song"}
                </div>
                <div
                  style={{
                    color: SubtleColor,
                    fontSize: 14,
                    marginTop: 4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {song?.artist ?? "—"}
                </div>
              </div>
              <button
                type="button"
                data-ocid="fullscreen_player.like.button"
                onClick={onToggleLike}
                aria-label={isLiked ? "Unlike" : "Like"}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: isLiked ? Accent : SubtleColor,
                  padding: "8px",
                  flexShrink: 0,
                  transition: "color 0.2s ease, transform 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "scale(1.15)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "scale(1)";
                }}
              >
                <svg
                  aria-hidden="true"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill={isLiked ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
            </div>

            {/* Progress bar */}
            <div style={{ width: "100%", marginBottom: 24 }}>
              <div
                ref={progressRef}
                data-ocid="fullscreen_player.progress.input"
                role="slider"
                aria-label="Playback progress"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(progress * 100)}
                tabIndex={0}
                onClick={handleProgressClick}
                onKeyDown={handleProgressKey}
                className="progress-bar-container progress-bar-track cursor-pointer"
                style={{ height: 5, borderRadius: 3 }}
              >
                <div
                  className="progress-bar-fill"
                  style={{ width: `${progress * 100}%`, height: "100%" }}
                >
                  <div className="progress-bar-knob" />
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginTop: 8,
                }}
              >
                <span style={{ color: MutedColor, fontSize: 11 }}>
                  {formatTime(currentTime)}
                </span>
                <span style={{ color: MutedColor, fontSize: 11 }}>
                  {formatTime(displayDuration)}
                </span>
              </div>
            </div>

            {/* Playback controls */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                width: "100%",
                marginBottom: 24,
              }}
            >
              <button
                type="button"
                data-ocid="fullscreen_player.shuffle.toggle"
                onClick={onToggleShuffle}
                aria-label={isShuffled ? "Disable shuffle" : "Enable shuffle"}
                aria-pressed={isShuffled}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: isShuffled ? Accent : MutedColor,
                  padding: 8,
                  transition: "color 0.2s ease",
                }}
              >
                <Shuffle
                  size={20}
                  strokeWidth={isShuffled ? 2.5 : 2}
                  aria-hidden="true"
                />
              </button>

              <button
                type="button"
                data-ocid="fullscreen_player.prev.button"
                onClick={onPrev}
                aria-label="Previous track"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: SubtleColor,
                  padding: 8,
                  transition: "color 0.15s ease",
                }}
              >
                <SkipBack
                  size={32}
                  fill="currentColor"
                  stroke="none"
                  aria-hidden="true"
                />
              </button>

              <button
                type="button"
                data-ocid="fullscreen_player.play.button"
                onClick={onTogglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                style={{
                  background: FgColor,
                  border: "none",
                  borderRadius: "50%",
                  width: 64,
                  height: 64,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  boxShadow: isPlaying
                    ? `0 0 32px ${AccentGlow}, 0 4px 20px rgba(0,0,0,0.5)`
                    : "0 4px 20px rgba(0,0,0,0.5)",
                  transition: "box-shadow 0.2s ease, transform 0.15s ease",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "scale(1.06)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.transform =
                    "scale(1)";
                }}
              >
                {isPlaying ? (
                  <Pause
                    size={26}
                    fill="#000"
                    stroke="none"
                    aria-hidden="true"
                  />
                ) : (
                  <Play
                    size={26}
                    fill="#000"
                    stroke="none"
                    className="ml-1"
                    aria-hidden="true"
                  />
                )}
              </button>

              <button
                type="button"
                data-ocid="fullscreen_player.next.button"
                onClick={onNext}
                aria-label="Next track"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: SubtleColor,
                  padding: 8,
                  transition: "color 0.15s ease",
                }}
              >
                <SkipForward
                  size={32}
                  fill="currentColor"
                  stroke="none"
                  aria-hidden="true"
                />
              </button>

              <button
                type="button"
                data-ocid="fullscreen_player.repeat.toggle"
                onClick={onToggleRepeat}
                aria-label={`Repeat: ${repeatMode}`}
                aria-pressed={repeatMode !== "none"}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: repeatMode !== "none" ? Accent : MutedColor,
                  padding: 8,
                  transition: "color 0.2s ease",
                }}
              >
                {repeatMode === "one" ? (
                  <Repeat1 size={20} strokeWidth={2.5} aria-hidden="true" />
                ) : (
                  <Repeat
                    size={20}
                    strokeWidth={repeatMode === "all" ? 2.5 : 2}
                    aria-hidden="true"
                  />
                )}
              </button>
            </div>

            {/* Volume + Atmos */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                justifyContent: "center",
              }}
            >
              <button
                type="button"
                data-ocid="fullscreen_player.volume.button"
                onClick={() => onVolumeChange(volume > 0 ? 0 : 0.7)}
                aria-label={volume === 0 ? "Unmute" : "Mute"}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: MutedColor,
                  padding: 4,
                }}
              >
                {volume === 0 ? (
                  <VolumeX size={18} aria-hidden="true" />
                ) : (
                  <Volume2 size={18} aria-hidden="true" />
                )}
              </button>
              <div
                data-ocid="fullscreen_player.volume.input"
                role="slider"
                aria-label="Volume"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(volume * 100)}
                tabIndex={0}
                onClick={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  onVolumeChange(
                    Math.max(
                      0,
                      Math.min(1, (e.clientX - rect.left) / rect.width),
                    ),
                  );
                }}
                onKeyDown={(e) => {
                  if (e.key === "ArrowRight")
                    onVolumeChange(Math.min(1, volume + 0.1));
                  if (e.key === "ArrowLeft")
                    onVolumeChange(Math.max(0, volume - 0.1));
                }}
                className="volume-bar-container progress-bar-track cursor-pointer"
                style={{ width: 120, flexShrink: 0 }}
              >
                <div
                  className="progress-bar-fill"
                  style={{ width: `${volume * 100}%` }}
                >
                  <div className="progress-bar-knob" />
                </div>
              </div>
              <AtmosToggle mode={atmosMode} onToggle={onToggleAtmos} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
