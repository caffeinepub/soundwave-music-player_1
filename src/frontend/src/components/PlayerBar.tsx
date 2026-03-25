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
import { useEffect, useRef, useState } from "react";
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
  thumbnail?: string;
}

const Accent = "#1ed760";
// AccentGlow removed - using inline values
const MutedColor = "#6a6a6a";
const SubtleColor = "#b3b3b3";
const FgColor = "#ffffff";

const STYLE_ID = "sw-playerbar-styles";

const CSS = `
@keyframes playerFadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
@keyframes playBtnPulse {
  0%, 100% { box-shadow: 0 0 16px rgba(30,215,96,0.5), 0 0 32px rgba(30,215,96,0.2); }
  50% { box-shadow: 0 0 24px rgba(30,215,96,0.8), 0 0 48px rgba(30,215,96,0.35); }
}
@keyframes heartBounce {
  0% { transform: scale(1); }
  30% { transform: scale(1.4); }
  60% { transform: scale(0.85); }
  100% { transform: scale(1); }
}
@keyframes eq1 { 0%,100%{height:4px} 50%{height:14px} }
@keyframes eq2 { 0%,100%{height:10px} 50%{height:4px} }
@keyframes eq3 { 0%,100%{height:6px} 50%{height:16px} }
@keyframes eq4 { 0%,100%{height:12px} 50%{height:5px} }
@keyframes eq5 { 0%,100%{height:5px} 50%{height:13px} }
.sw-eq-bar:nth-child(1) { animation: eq1 0.6s ease-in-out infinite; }
.sw-eq-bar:nth-child(2) { animation: eq2 0.45s ease-in-out infinite; }
.sw-eq-bar:nth-child(3) { animation: eq3 0.8s ease-in-out infinite; }
.sw-eq-bar:nth-child(4) { animation: eq4 0.55s ease-in-out infinite; }
.sw-eq-bar:nth-child(5) { animation: eq5 0.7s ease-in-out infinite; }
.sw-eq-bar-paused { animation-play-state: paused !important; }
.sw-ctrl-btn:hover { opacity: 0.85; transform: scale(1.1); }
.sw-ctrl-btn:active { transform: scale(0.88); }
.sw-ctrl-btn { transition: transform 0.15s cubic-bezier(.34,1.56,.64,1), opacity 0.15s ease; }
.sw-album-art:hover { transform: scale(1.06); }
.sw-album-art { transition: transform 0.2s ease; }
.sw-play-btn:hover { transform: scale(1.1); }
.sw-play-btn:active { transform: scale(0.9); }
.sw-play-btn { transition: transform 0.15s cubic-bezier(.34,1.56,.64,1), box-shadow 0.3s ease; }
.sw-heart-animate { animation: heartBounce 0.4s cubic-bezier(.34,1.56,.64,1); }
@keyframes rippleOut { from { transform: scale(0); opacity: 1; } to { transform: scale(2.5); opacity: 0; } }
@keyframes atmosAura { 0%,100%{opacity:0.6;transform:scale(1)} 50%{opacity:1;transform:scale(1.05)} }
@keyframes albumFloat { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-4px)} }
.sw-album-art-float { animation: albumFloat 3s ease-in-out infinite; }
.sw-album-art-float:hover { animation: none; transform: scale(1.08); box-shadow: 0 0 20px rgba(30,215,96,0.4); }
.sw-card-hover:hover { transform: translateY(-4px) scale(1.02); box-shadow: 0 8px 32px rgba(30,215,96,0.2), 0 0 0 1px rgba(30,215,96,0.1); transition: transform 0.2s ease, box-shadow 0.2s ease; }
.player-progress-track { position: relative; overflow: visible !important; }
.player-progress-track:hover .sw-progress-thumb { width: 16px !important; height: 16px !important; }
@media (max-width: 639px) {
  .sw-hide-mobile { display: none !important; }
}
`;

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
  thumbnail,
}: PlayerBarProps) {
  const progressRef = useRef<HTMLDivElement>(null);
  const volumeRef = useRef<HTMLDivElement>(null);
  const [heartAnim, setHeartAnim] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const [ripple, setRipple] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const x = ((e.clientY - cy) / (rect.height / 2)) * 4;
    const y = -((e.clientX - cx) / (rect.width / 2)) * 4;
    setTilt({ x, y });
  };
  const handleMouseLeave = () => setTilt({ x: 0, y: 0 });

  const handlePlayWithRipple = () => {
    setRipple(true);
    setTimeout(() => setRipple(false), 600);
    onTogglePlay();
  };

  useEffect(() => {
    try {
      if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);
      }
    } catch (err) {
      console.warn("[PlayerBar] Failed to inject styles:", err);
    }
  }, []);

  // Dynamic accent color from thumbnail
  useEffect(() => {
    if (!thumbnail) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 1;
        canvas.height = 1;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 1, 1);
        const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
        const hex = `#${[r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("")}`;
        document.documentElement.style.setProperty("--accent-dynamic", hex);
      } catch (_) {}
    };
    img.onerror = () => {};
    img.src = thumbnail;
    return () => {
      document.documentElement.style.setProperty("--accent-dynamic", "#1ed760");
    };
  }, [thumbnail]);

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

  const handleHeartClick = () => {
    setHeartAnim(true);
    onToggleLike();
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
    <div
      data-ocid="player.panel"
      className="player-bar"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        position: "relative",
        background: "rgba(15, 21, 32, 0.75)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        boxShadow:
          "0 -4px 30px rgba(30, 215, 96, 0.12), 0 -1px 0 rgba(30, 215, 96, 0.08)",
        animation: "playerFadeIn 0.4s ease both",
        perspective: "1200px",
        transform: `perspective(1200px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) scale(${tilt.x !== 0 || tilt.y !== 0 ? 1.01 : 1})`,
        transition: "transform 0.1s ease",
      }}
    >
      {/* Dolby Atmos aura */}
      {atmosMode !== "off" && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: -20,
            borderRadius: 20,
            background:
              "radial-gradient(ellipse at center, rgba(124,77,255,0.15) 0%, transparent 70%)",
            animation: "atmosAura 3s ease-in-out infinite",
            pointerEvents: "none",
            zIndex: -1,
          }}
        />
      )}
      {/* Top gradient glow line */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 1,
          background:
            "linear-gradient(90deg, #1ed760 0%, rgba(30,215,96,0.4) 50%, transparent 100%)",
          pointerEvents: "none",
          zIndex: 1,
        }}
      />

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
            boxShadow:
              "0 0 8px rgba(30,215,96,0.6), 0 0 16px rgba(30,215,96,0.3)",
            transition: "width 0.1s linear",
          }}
        />
        <div
          className="sw-progress-thumb"
          style={{
            position: "absolute",
            top: "50%",
            left: `${progress * 100}%`,
            transform: "translate(-50%, -50%)",
            width: 12,
            height: 12,
            borderRadius: "50%",
            background: "#1ed760",
            boxShadow: "0 0 8px rgba(30,215,96,0.8)",
            transition: "width 0.1s, height 0.1s",
            pointerEvents: "none",
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
            className="sw-album-art sw-album-art-float flex-shrink-0 rounded-lg overflow-hidden"
            style={{
              width: 48,
              height: 48,
              background: albumBg,
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 22,
              borderRadius: 10,
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
            onClick={handleHeartClick}
            onAnimationEnd={() => setHeartAnim(false)}
            className={`player-ctrl-btn sw-ctrl-btn${heartAnim ? " sw-heart-animate" : ""}`}
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
            className="player-ctrl-btn sw-ctrl-btn sw-hide-mobile"
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
            className="player-ctrl-btn sw-ctrl-btn"
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

          {/* 5-bar animated equalizer */}
          <div
            aria-hidden="true"
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 2,
              height: 18,
              marginRight: 4,
            }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`sw-eq-bar${!isPlaying ? " sw-eq-bar-paused" : ""}`}
                style={{
                  display: "block",
                  width: 3,
                  background:
                    "linear-gradient(to top, #1ed760, rgba(30,215,96,0.5))",
                  borderRadius: 2,
                  height: 8,
                  transformOrigin: "bottom",
                }}
              />
            ))}
          </div>

          <button
            type="button"
            data-ocid="player.play.button"
            onClick={handlePlayWithRipple}
            className="player-play-btn sw-play-btn"
            aria-label={isPlaying ? "Pause" : "Play"}
            style={{
              width: 56,
              height: 56,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #1ed760 0%, #17b84f 100%)",
              border: "none",
              color: "#000",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                "0 0 20px rgba(30,215,96,0.6), 0 0 40px rgba(30,215,96,0.25)",
              flexShrink: 0,
              position: "relative",
              animation: isPlaying
                ? "playBtnPulse 2s ease-in-out infinite"
                : undefined,
            }}
          >
            {ripple && (
              <span
                aria-hidden="true"
                style={{
                  position: "absolute",
                  borderRadius: "50%",
                  width: 80,
                  height: 80,
                  top: -12,
                  left: -12,
                  background: "rgba(30,215,96,0.3)",
                  animation: "rippleOut 0.6s ease-out forwards",
                  pointerEvents: "none",
                }}
              />
            )}
            {isPlaying ? (
              <Pause size={22} fill="#000" stroke="none" aria-hidden="true" />
            ) : (
              <Play size={22} fill="#000" stroke="none" aria-hidden="true" />
            )}
          </button>

          <button
            type="button"
            data-ocid="player.next.button"
            onClick={onNext}
            className="player-ctrl-btn sw-ctrl-btn"
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
            className="player-ctrl-btn sw-ctrl-btn sw-hide-mobile"
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
