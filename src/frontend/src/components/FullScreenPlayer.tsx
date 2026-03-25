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
  onOpenXRay?: () => void;
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
  onOpenXRay,
}: FullScreenPlayerProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek(Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)));
  };

  const handleProgressKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") onSeek(Math.min(1, progress + 0.02));
    if (e.key === "ArrowLeft") onSeek(Math.max(0, progress - 0.02));
  };

  const handleVolumeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    onVolumeChange(
      Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width)),
    );
  };

  const handleVolumeKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") onVolumeChange(Math.min(1, volume + 0.05));
    if (e.key === "ArrowLeft") onVolumeChange(Math.max(0, volume - 0.05));
  };

  const gradientStyle = song
    ? {
        background: `radial-gradient(ellipse at top, ${getColorForClass(song.colorClass)} 0%, #080b12 60%)`,
      }
    : { background: "#080b12" };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-ocid="fullscreen_player.modal"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 32 }}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 500,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "clamp(20px, 4vw, 48px)",
            ...gradientStyle,
          }}
        >
          {/* Header row with close + xray buttons */}
          <button
            type="button"
            data-ocid="fullscreen_player.close_button"
            onClick={onClose}
            style={{
              position: "absolute",
              top: 20,
              left: 20,
              background: "rgba(255,255,255,0.08)",
              border: "none",
              borderRadius: "50%",
              width: 40,
              height: 40,
              color: SubtleColor,
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <ChevronDown size={20} aria-hidden="true" />
          </button>

          {/* X-Ray button */}
          {onOpenXRay && (
            <button
              type="button"
              data-ocid="fullscreen_player.xray.button"
              onClick={onOpenXRay}
              style={{
                position: "absolute",
                top: 20,
                right: 20,
                background: "rgba(30,215,96,0.1)",
                border: "1px solid rgba(30,215,96,0.3)",
                borderRadius: 6,
                padding: "6px 14px",
                color: "#1ed760",
                cursor: "pointer",
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: "0.15em",
                fontFamily: "monospace",
              }}
            >
              X-RAY
            </button>
          )}

          {/* Album art */}
          {song && (
            <motion.div
              animate={{ rotate: isPlaying ? 360 : 0 }}
              transition={{
                duration: 12,
                ease: "linear",
                repeat: Number.POSITIVE_INFINITY,
              }}
              style={{
                width: "clamp(160px, 28vw, 280px)",
                height: "clamp(160px, 28vw, 280px)",
                borderRadius: "50%",
                background: getGradientForClass(song.colorClass),
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "clamp(48px, 8vw, 80px)",
                marginBottom: 32,
                boxShadow: `0 0 80px ${AccentGlow}, 0 8px 40px rgba(0,0,0,0.6)`,
                flexShrink: 0,
              }}
            >
              {song.emoji}
            </motion.div>
          )}

          {/* Track info */}
          <div
            style={{
              textAlign: "center",
              marginBottom: 24,
              width: "100%",
              maxWidth: 420,
            }}
          >
            <div
              style={{
                color: FgColor,
                fontWeight: 800,
                fontSize: "clamp(1.2rem, 3vw, 1.8rem)",
                letterSpacing: "-0.02em",
                marginBottom: 4,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {song?.title ?? "—"}
            </div>
            <div style={{ color: SubtleColor, fontSize: 15 }}>
              {song?.artist ?? "—"}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ width: "100%", maxWidth: 480, marginBottom: 24 }}>
            <div
              ref={progressRef}
              role="slider"
              tabIndex={0}
              aria-label="Seek"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(progress * 100)}
              onClick={handleProgressClick}
              onKeyDown={handleProgressKey}
              style={{
                height: 5,
                borderRadius: 3,
                background: "rgba(255,255,255,0.15)",
                cursor: "pointer",
                position: "relative",
                marginBottom: 6,
              }}
            >
              <div
                style={{
                  height: "100%",
                  borderRadius: 3,
                  width: `${progress * 100}%`,
                  background: `linear-gradient(90deg, ${Accent}, #00b8ff)`,
                  boxShadow: `0 0 10px ${AccentGlow}`,
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 12,
                color: MutedColor,
              }}
            >
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Main controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 24,
              marginBottom: 24,
            }}
          >
            <button
              type="button"
              data-ocid="fullscreen_player.shuffle.toggle"
              onClick={onToggleShuffle}
              style={{
                background: "none",
                border: "none",
                color: isShuffled ? Accent : SubtleColor,
                cursor: "pointer",
                padding: 8,
              }}
            >
              <Shuffle size={20} aria-hidden="true" />
            </button>

            <button
              type="button"
              data-ocid="fullscreen_player.prev.button"
              onClick={onPrev}
              style={{
                background: "none",
                border: "none",
                color: FgColor,
                cursor: "pointer",
                padding: 8,
              }}
            >
              <SkipBack size={26} aria-hidden="true" />
            </button>

            <button
              type="button"
              data-ocid="fullscreen_player.play.button"
              onClick={onTogglePlay}
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: Accent,
                border: "none",
                color: "#000",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: `0 0 32px ${AccentGlow}`,
              }}
            >
              {isPlaying ? (
                <Pause size={28} fill="#000" stroke="none" aria-hidden="true" />
              ) : (
                <Play size={28} fill="#000" stroke="none" aria-hidden="true" />
              )}
            </button>

            <button
              type="button"
              data-ocid="fullscreen_player.next.button"
              onClick={onNext}
              style={{
                background: "none",
                border: "none",
                color: FgColor,
                cursor: "pointer",
                padding: 8,
              }}
            >
              <SkipForward size={26} aria-hidden="true" />
            </button>

            <button
              type="button"
              data-ocid="fullscreen_player.repeat.toggle"
              onClick={onToggleRepeat}
              style={{
                background: "none",
                border: "none",
                color: repeatMode !== "none" ? Accent : SubtleColor,
                cursor: "pointer",
                padding: 8,
              }}
            >
              {repeatMode === "one" ? (
                <Repeat1 size={20} aria-hidden="true" />
              ) : (
                <Repeat size={20} aria-hidden="true" />
              )}
            </button>
          </div>

          {/* Secondary controls */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              flexWrap: "wrap",
              justifyContent: "center",
            }}
          >
            {/* Like */}
            <button
              type="button"
              data-ocid="fullscreen_player.like.toggle"
              onClick={onToggleLike}
              style={{
                background: "none",
                border: "none",
                fontSize: 22,
                cursor: "pointer",
                color: isLiked ? Accent : SubtleColor,
              }}
            >
              {isLiked ? "♥" : "♡"}
            </button>

            {/* Volume */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <VolumeX
                size={16}
                style={{ color: MutedColor }}
                aria-hidden="true"
              />
              <div
                ref={volumeRef}
                role="slider"
                tabIndex={0}
                aria-label="Volume"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.round(volume * 100)}
                onClick={handleVolumeClick}
                onKeyDown={handleVolumeKey}
                style={{
                  width: 100,
                  height: 4,
                  borderRadius: 2,
                  background: "rgba(255,255,255,0.15)",
                  cursor: "pointer",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    borderRadius: 2,
                    width: `${volume * 100}%`,
                    background: Accent,
                  }}
                />
              </div>
              <Volume2
                size={16}
                style={{ color: SubtleColor }}
                aria-hidden="true"
              />
            </div>

            {/* Queue */}
            <button
              type="button"
              data-ocid="fullscreen_player.queue.toggle"
              onClick={onToggleQueue}
              style={{
                background: "none",
                border: "none",
                color: isQueueOpen ? Accent : SubtleColor,
                cursor: "pointer",
                padding: 4,
              }}
            >
              <ListMusic size={18} aria-hidden="true" />
            </button>

            {/* Atmos */}
            <AtmosToggle mode={atmosMode} onToggle={onToggleAtmos} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function getColorForClass(c: string): string {
  const map: Record<string, string> = {
    c1: "rgba(45,27,105,0.5)",
    c2: "rgba(26,58,42,0.5)",
    c3: "rgba(58,26,26,0.5)",
    c4: "rgba(26,42,58,0.5)",
    c5: "rgba(42,42,26,0.5)",
    c6: "rgba(58,26,42,0.5)",
  };
  return map[c] ?? "rgba(45,27,105,0.5)";
}

function getGradientForClass(c: string): string {
  const map: Record<string, string> = {
    c1: "linear-gradient(135deg, #2d1b69, #1a0e3d)",
    c2: "linear-gradient(135deg, #1a3a2a, #0d2019)",
    c3: "linear-gradient(135deg, #3a1a1a, #2a0d0d)",
    c4: "linear-gradient(135deg, #1a2a3a, #0d1a2a)",
    c5: "linear-gradient(135deg, #2a2a1a, #1a1a0d)",
    c6: "linear-gradient(135deg, #3a1a2a, #2a0d0d)",
  };
  return map[c] ?? "linear-gradient(135deg, #2d1b69, #1a0e3d)";
}
