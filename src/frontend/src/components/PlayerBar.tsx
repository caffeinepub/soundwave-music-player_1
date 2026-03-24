import {
  ChevronUp,
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
import { useRef } from "react";
import { type Song, formatTime } from "../data/songs";
import type { AudioMode } from "../engines/audioEngine";
import type { RepeatMode } from "../hooks/usePlayer";
import AtmosToggle from "./AtmosToggle";
import WaveformBar from "./WaveformBar";

interface PlayerBarProps {
  song: Song | null;
  isPlaying: boolean;
  progress: number; // 0-1
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
  onExpandPlayer: () => void;
  audioUrl?: string;
}

const Accent = "#1DB954";
const AccentGlow = "rgba(29, 185, 84, 0.45)";
const MutedColor = "#6a6a6a";
const SubtleColor = "#b3b3b3";
const FgColor = "#ffffff";

export default function PlayerBar({
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
  onExpandPlayer,
  audioUrl,
}: PlayerBarProps) {
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

  const colorGradients: Record<string, string> = {
    c1: "linear-gradient(135deg, #2d1b69, #1a0e3d)",
    c2: "linear-gradient(135deg, #1a3a2a, #0d2019)",
    c3: "linear-gradient(135deg, #3a1a1a, #2a0d0d)",
    c4: "linear-gradient(135deg, #1a2a3a, #0d1a2a)",
    c5: "linear-gradient(135deg, #2a2a1a, #1a1a0d)",
    c6: "linear-gradient(135deg, #3a1a2a, #2a0d0d)",
  };

  const albumBg = song
    ? (colorGradients[song.colorClass] ?? colorGradients.c1)
    : colorGradients.c1;

  return (
    <div data-ocid="player.panel" className="player-bar">
      {/* Progress track */}
      <div
        ref={progressRef}
        role="slider"
        tabIndex={0}
        aria-label="Seek bar"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress * 100)}
        className="player-progress-track"
        onClick={handleProgressClick}
        onKeyDown={handleProgressKey}
      >
        <div
          className="player-progress-fill"
          style={{
            width: `${progress * 100}%`,
            boxShadow: `0 0 8px ${AccentGlow}`,
          }}
        />
      </div>

      <div className="player-inner">
        {/* ── LEFT: song info ── */}
        <div className="player-left">
          <button
            type="button"
            data-ocid="player.expand.button"
            onClick={onExpandPlayer}
            className="flex-shrink-0 rounded-lg overflow-hidden"
            style={{
              width: 42,
              height: 42,
              background: albumBg,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 20,
            }}
            aria-label="Expand player"
          >
            {song?.emoji ?? "🎵"}
          </button>

          <div className="player-track-info" style={{ minWidth: 0 }}>
            <div className="player-track-title">
              {song?.title ?? "No track selected"}
            </div>
            <div className="player-track-artist">{song?.artist ?? "—"}</div>
          </div>

          <button
            type="button"
            data-ocid="player.like.toggle"
            onClick={onToggleLike}
            className="player-ctrl-btn"
            aria-label={isLiked ? "Unlike" : "Like"}
            style={{
              color: isLiked ? Accent : MutedColor,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 18,
            }}
          >
            {isLiked ? "♥" : "♡"}
          </button>
        </div>

        {/* ── CENTER: controls ── */}
        <div className="player-center">
          <button
            type="button"
            data-ocid="player.shuffle.toggle"
            onClick={onToggleShuffle}
            className="player-ctrl-btn"
            aria-label={isShuffled ? "Disable shuffle" : "Enable shuffle"}
            style={{
              color: isShuffled ? Accent : SubtleColor,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 8,
            }}
          >
            <Shuffle size={16} aria-hidden="true" />
          </button>

          <button
            type="button"
            data-ocid="player.prev.button"
            onClick={onPrev}
            className="player-ctrl-btn"
            aria-label="Previous track"
            style={{
              color: FgColor,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 8,
            }}
          >
            <SkipBack size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            data-ocid="player.play.button"
            onClick={onTogglePlay}
            className="player-play-btn"
            aria-label={isPlaying ? "Pause" : "Play"}
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: Accent,
              border: "none",
              color: "#000",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: isPlaying ? `0 0 20px ${AccentGlow}` : "none",
              flexShrink: 0,
            }}
          >
            {isPlaying ? (
              <Pause size={18} fill="#000" stroke="none" aria-hidden="true" />
            ) : (
              <Play size={18} fill="#000" stroke="none" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            data-ocid="player.next.button"
            onClick={onNext}
            className="player-ctrl-btn"
            aria-label="Next track"
            style={{
              color: FgColor,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 8,
            }}
          >
            <SkipForward size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            data-ocid="player.repeat.toggle"
            onClick={onToggleRepeat}
            className="player-ctrl-btn"
            aria-label={`Repeat: ${repeatMode}`}
            style={{
              color: repeatMode !== "none" ? Accent : SubtleColor,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 8,
            }}
          >
            {repeatMode === "one" ? (
              <Repeat1 size={16} aria-hidden="true" />
            ) : (
              <Repeat size={16} aria-hidden="true" />
            )}
          </button>

          <div
            className="player-time"
            style={{ color: MutedColor, fontSize: 11, whiteSpace: "nowrap" }}
          >
            {formatTime(currentTime)} / {formatTime(duration)}
          </div>
        </div>

        {/* ── RIGHT: volume + extras ── */}
        <div className="player-right">
          {/* Waveform — always shown for local tracks */}
          {audioUrl && song && (
            <WaveformBar
              audioUrl={audioUrl}
              isPlaying={isPlaying}
              progress={progress}
            />
          )}

          {/* Volume */}
          <div className="flex items-center gap-2">
            {volume === 0 ? (
              <VolumeX
                size={16}
                style={{ color: MutedColor }}
                aria-hidden="true"
              />
            ) : (
              <Volume2
                size={16}
                style={{ color: SubtleColor }}
                aria-hidden="true"
              />
            )}
            <div
              ref={volumeRef}
              role="slider"
              tabIndex={0}
              aria-label="Volume"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(volume * 100)}
              data-ocid="player.volume.input"
              onClick={handleVolumeClick}
              onKeyDown={handleVolumeKey}
              style={{
                width: 80,
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
          </div>

          <AtmosToggle mode={atmosMode} onToggle={onToggleAtmos} />

          <button
            type="button"
            data-ocid="player.queue.toggle"
            onClick={onToggleQueue}
            style={{
              background: "none",
              border: "none",
              color: isQueueOpen ? Accent : SubtleColor,
              cursor: "pointer",
              padding: 6,
            }}
            aria-label="Toggle queue"
          >
            <ListMusic size={18} aria-hidden="true" />
          </button>

          <button
            type="button"
            data-ocid="player.expand.button"
            onClick={onExpandPlayer}
            style={{
              background: "none",
              border: "none",
              color: SubtleColor,
              cursor: "pointer",
              padding: 6,
            }}
            aria-label="Expand player"
          >
            <ChevronUp size={18} aria-hidden="true" />
          </button>
        </div>
      </div>
    </div>
  );
}
