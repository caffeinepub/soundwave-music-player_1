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
import type { RepeatMode } from "../hooks/usePlayer";

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
  onTogglePlay: () => void;
  onPrev: () => void;
  onNext: () => void;
  onSeek: (p: number) => void;
  onVolumeChange: (v: number) => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onToggleLike: () => void;
  onToggleQueue: () => void;
}

const GreenColor = "oklch(0.65 0.19 145)";
const MutedColor = "oklch(0.55 0 0)";
const FgColor = "oklch(0.96 0 0)";

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
  onTogglePlay,
  onPrev,
  onNext,
  onSeek,
  onVolumeChange,
  onToggleShuffle,
  onToggleRepeat,
  onToggleLike,
  onToggleQueue,
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
      className="fixed bottom-0 left-0 right-0 z-50 flex items-center px-5 gap-3"
      style={{
        height: "90px",
        background: "#181818",
        borderTop: "1px solid #282828",
      }}
      data-ocid="player.panel"
    >
      {/* Left: now playing */}
      <div
        className="flex items-center gap-3 flex-shrink-0"
        style={{ width: 220 }}
      >
        <div
          className={`rounded-lg flex-shrink-0 flex items-center justify-center text-2xl relative overflow-hidden${song ? ` ${song.colorClass}` : ""}`}
          style={{
            width: 52,
            height: 52,
            background: song ? undefined : "#1a1a1a",
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
            className="text-[13px] font-semibold truncate"
            style={{ color: FgColor }}
          >
            {song?.title ?? "Select a song"}
          </p>
          <p className="text-[11px] truncate" style={{ color: MutedColor }}>
            {song?.artist ?? "—"}
          </p>
        </div>
        <button
          type="button"
          data-ocid="player.like.button"
          onClick={onToggleLike}
          className="flex-shrink-0 p-1.5 cursor-pointer transition-transform hover:scale-110"
          style={{
            color: isLiked ? GreenColor : MutedColor,
            background: "none",
            border: "none",
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
      <div className="flex flex-col items-center gap-1.5 flex-1 max-w-[460px]">
        <div className="flex items-center gap-4">
          <button
            type="button"
            data-ocid="player.shuffle.toggle"
            onClick={onToggleShuffle}
            className="p-1.5 cursor-pointer transition-colors"
            style={{
              color: isShuffled ? GreenColor : MutedColor,
              background: "none",
              border: "none",
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
            className="p-1.5 cursor-pointer transition-colors"
            style={{ color: FgColor, background: "none", border: "none" }}
            aria-label="Previous track"
          >
            <SkipBack
              size={20}
              fill="currentColor"
              stroke="none"
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            data-ocid="player.play.button"
            onClick={onTogglePlay}
            className="w-[34px] h-[34px] rounded-full flex items-center justify-center cursor-pointer transition-all hover:scale-105 flex-shrink-0"
            style={{ background: FgColor, border: "none" }}
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? (
              <Pause size={15} fill="#000" stroke="none" aria-hidden="true" />
            ) : (
              <Play
                size={15}
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
            className="p-1.5 cursor-pointer transition-colors"
            style={{ color: FgColor, background: "none", border: "none" }}
            aria-label="Next track"
          >
            <SkipForward
              size={20}
              fill="currentColor"
              stroke="none"
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            data-ocid="player.repeat.toggle"
            onClick={onToggleRepeat}
            className="p-1.5 cursor-pointer transition-colors"
            style={{
              color: repeatMode !== "none" ? GreenColor : MutedColor,
              background: "none",
              border: "none",
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
        <div className="flex items-center gap-2 w-full">
          <span
            className="text-[10px] w-8 text-right flex-shrink-0"
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
            className="progress-bar-container flex-1 h-1 rounded-full cursor-pointer relative"
            style={{ background: "#3a3a3a" }}
          >
            <div
              className="h-full rounded-full relative"
              style={{ width: `${progress * 100}%`, background: MutedColor }}
            >
              <div
                className="progress-knob absolute right-0 top-1/2 w-2.5 h-2.5 rounded-full opacity-0 transition-opacity"
                style={{
                  background: FgColor,
                  transform: "translateY(-50%) translateX(50%)",
                }}
              />
            </div>
          </div>
          <span
            className="text-[10px] w-8 flex-shrink-0"
            style={{ color: MutedColor }}
          >
            {formatTime(displayDuration)}
          </span>
        </div>
      </div>

      {/* Right: queue + volume */}
      <div className="flex items-center gap-2.5 flex-shrink-0">
        <button
          type="button"
          data-ocid="player.queue.toggle"
          onClick={onToggleQueue}
          className="p-1.5 cursor-pointer transition-colors"
          style={{
            color: isQueueOpen ? GreenColor : MutedColor,
            background: "none",
            border: "none",
          }}
          aria-label="Toggle queue"
          aria-pressed={isQueueOpen}
        >
          <ListMusic size={16} aria-hidden="true" />
        </button>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            data-ocid="player.volume.button"
            onClick={() => onVolumeChange(volume > 0 ? 0 : 0.7)}
            className="p-1.5 cursor-pointer transition-colors"
            style={{
              color: volume === 0 ? MutedColor : MutedColor,
              background: "none",
              border: "none",
            }}
            aria-label={volume === 0 ? "Unmute" : "Mute"}
          >
            {volume === 0 ? (
              <VolumeX size={15} aria-hidden="true" />
            ) : (
              <Volume2 size={15} aria-hidden="true" />
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
            className="volume-bar-container h-1 rounded-full cursor-pointer relative"
            style={{ width: 72, background: "#3a3a3a" }}
          >
            <div
              className="h-full rounded-full relative"
              style={{ width: `${volume * 100}%`, background: MutedColor }}
            >
              <div
                className="volume-knob absolute right-0 top-1/2 w-2.5 h-2.5 rounded-full opacity-0 transition-opacity"
                style={{
                  background: FgColor,
                  transform: "translateY(-50%) translateX(50%)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
