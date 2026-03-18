import {
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
    if (e.key === "ArrowRight") onVolumeChange(Math.min(1, volume + 0.1));
    if (e.key === "ArrowLeft") onVolumeChange(Math.max(0, volume - 0.1));
  };

  const displayDuration = duration || (song?.duration ?? 0);

  return (
    <div
      className="glass fixed bottom-0 left-0 right-0 z-50 flex items-center px-6 gap-4"
      style={{ height: "88px" }}
      data-ocid="player.panel"
    >
      {/* Left: now playing */}
      <div
        className="flex items-center gap-3.5 flex-shrink-0"
        style={{ width: 240 }}
      >
        {/* Art */}
        <div
          className={`rounded-xl flex-shrink-0 flex items-center justify-center text-2xl relative overflow-hidden${song ? ` ${song.colorClass}` : ""}`}
          style={{
            width: 58,
            height: 58,
            background: song ? undefined : "#1a1a1a",
            boxShadow: "0 4px 16px rgba(0,0,0,0.4)",
          }}
        >
          {isPlaying ? (
            <div className="absolute inset-0 bg-black/30 flex items-end justify-center gap-0.5 pb-1.5">
              <div className="eq-bar" />
              <div className="eq-bar" />
              <div className="eq-bar" />
            </div>
          ) : (
            <span aria-hidden="true">{song?.emoji ?? "🎵"}</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p
            className="text-[13px] font-bold truncate"
            style={{ color: FgColor, letterSpacing: "-0.01em" }}
          >
            {song?.title ?? "Select a song"}
          </p>
          <p
            className="text-[11px] truncate mt-0.5"
            style={{ color: SubtleColor }}
          >
            {song?.artist ?? "—"}
          </p>
        </div>
        <button
          type="button"
          data-ocid="player.like.button"
          onClick={onToggleLike}
          className="flex-shrink-0 p-1.5 cursor-pointer"
          style={{
            color: isLiked ? Accent : MutedColor,
            background: "none",
            border: "none",
            transition: "color 0.2s ease, transform 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform =
              "scale(1.15)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
          }}
          aria-label={isLiked ? "Unlike song" : "Like song"}
        >
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill={isLiked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
      </div>

      {/* Center: controls + progress */}
      <div className="flex flex-col items-center gap-2 flex-1 max-w-[500px]">
        {/* Control buttons */}
        <div className="flex items-center gap-5">
          <button
            type="button"
            data-ocid="player.shuffle.toggle"
            onClick={onToggleShuffle}
            className="p-1 cursor-pointer flex-shrink-0"
            style={{
              color: isShuffled ? Accent : MutedColor,
              background: "none",
              border: "none",
              transition: "color 0.2s ease",
            }}
            aria-label={isShuffled ? "Disable shuffle" : "Enable shuffle"}
            aria-pressed={isShuffled}
          >
            <Shuffle
              size={16}
              strokeWidth={isShuffled ? 2.5 : 2}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            data-ocid="player.prev.button"
            onClick={onPrev}
            className="p-1 cursor-pointer flex-shrink-0"
            style={{
              color: SubtleColor,
              background: "none",
              border: "none",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = FgColor;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = SubtleColor;
            }}
            aria-label="Previous track"
          >
            <SkipBack
              size={22}
              fill="currentColor"
              stroke="none"
              aria-hidden="true"
            />
          </button>
          {/* Main play/pause button */}
          <button
            type="button"
            data-ocid="player.play.button"
            onClick={onTogglePlay}
            className={`play-btn-glow w-[52px] h-[52px] rounded-full flex items-center justify-center cursor-pointer flex-shrink-0${isPlaying ? " playing" : ""}`}
            style={{
              background: Accent,
              border: "none",
              boxShadow: isPlaying
                ? `0 0 24px ${AccentGlow}, 0 4px 16px rgba(0,0,0,0.4)`
                : "0 4px 16px rgba(0,0,0,0.4)",
              transition: "box-shadow 0.2s ease, transform 0.15s ease",
            }}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause size={20} fill="#000" stroke="none" aria-hidden="true" />
            ) : (
              <Play
                size={20}
                fill="#000"
                stroke="none"
                className="ml-0.5"
                aria-hidden="true"
              />
            )}
          </button>
          <button
            type="button"
            data-ocid="player.next.button"
            onClick={onNext}
            className="p-1 cursor-pointer flex-shrink-0"
            style={{
              color: SubtleColor,
              background: "none",
              border: "none",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = FgColor;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = SubtleColor;
            }}
            aria-label="Next track"
          >
            <SkipForward
              size={22}
              fill="currentColor"
              stroke="none"
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            data-ocid="player.repeat.toggle"
            onClick={onToggleRepeat}
            className="p-1 cursor-pointer flex-shrink-0"
            style={{
              color: repeatMode !== "none" ? Accent : MutedColor,
              background: "none",
              border: "none",
              transition: "color 0.2s ease",
            }}
            aria-label={`Repeat: ${repeatMode}`}
            aria-pressed={repeatMode !== "none"}
          >
            {repeatMode === "one" ? (
              <Repeat1 size={16} strokeWidth={2.5} aria-hidden="true" />
            ) : (
              <Repeat
                size={16}
                strokeWidth={repeatMode === "all" ? 2.5 : 2}
                aria-hidden="true"
              />
            )}
          </button>
        </div>

        {/* Progress row */}
        <div className="flex items-center gap-2.5 w-full">
          <span
            className="text-[10px] w-8 text-right flex-shrink-0 font-medium"
            style={{ color: MutedColor }}
          >
            {formatTime(currentTime)}
          </span>
          <div
            ref={progressRef}
            data-ocid="player.progress.input"
            role="slider"
            aria-label="Playback progress"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
            tabIndex={0}
            onClick={handleProgressClick}
            onKeyDown={handleProgressKey}
            className="progress-bar-container progress-bar-track flex-1 cursor-pointer group"
          >
            <div
              className="progress-bar-fill"
              style={{ width: `${progress * 100}%` }}
            >
              <div className="progress-bar-knob" />
            </div>
          </div>
          <span
            className="text-[10px] w-8 flex-shrink-0 font-medium"
            style={{ color: MutedColor }}
          >
            {formatTime(displayDuration)}
          </span>
        </div>
      </div>

      {/* Right: atmos + queue + volume */}
      <div
        className="flex items-center gap-3 flex-shrink-0"
        style={{ width: 260, justifyContent: "flex-end" }}
      >
        {/* Atmos Toggle */}
        <AtmosToggle mode={atmosMode} onToggle={onToggleAtmos} />

        <button
          type="button"
          data-ocid="player.queue.toggle"
          onClick={onToggleQueue}
          className="p-1.5 cursor-pointer flex-shrink-0"
          style={{
            color: isQueueOpen ? Accent : MutedColor,
            background: "none",
            border: "none",
            transition: "color 0.2s ease",
          }}
          aria-label="Toggle queue"
          aria-pressed={isQueueOpen}
        >
          <ListMusic size={17} aria-hidden="true" />
        </button>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-ocid="player.volume.button"
            onClick={() => onVolumeChange(volume > 0 ? 0 : 0.7)}
            className="p-1.5 cursor-pointer flex-shrink-0"
            style={{
              color: MutedColor,
              background: "none",
              border: "none",
              transition: "color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = SubtleColor;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = MutedColor;
            }}
            aria-label={volume === 0 ? "Unmute" : "Mute"}
          >
            {volume === 0 ? (
              <VolumeX size={16} aria-hidden="true" />
            ) : (
              <Volume2 size={16} aria-hidden="true" />
            )}
          </button>
          <div
            ref={volumeRef}
            data-ocid="player.volume.input"
            role="slider"
            aria-label="Volume"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(volume * 100)}
            tabIndex={0}
            onClick={handleVolumeClick}
            onKeyDown={handleVolumeKey}
            className="volume-bar-container progress-bar-track cursor-pointer"
            style={{ width: 80 }}
          >
            <div
              className="progress-bar-fill"
              style={{ width: `${volume * 100}%` }}
            >
              <div className="progress-bar-knob" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
