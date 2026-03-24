import { useEffect, useRef, useState } from "react";
/**
 * WaveformBar — Real WaveSurfer.js waveform synced with active HTML5 Audio playback.
 *
 * WaveSurfer is loaded from CDN to avoid a bundled dependency.
 * Used inside PlayerBar for local SoundHelix tracks.
 * For YouTube tracks the existing eq-bar animation continues to render.
 */

interface WaveformBarProps {
  audioUrl: string;
  isPlaying: boolean;
  progress: number;
  onSeek?: (pct: number) => void;
  accent?: string;
}

interface WsInstance {
  load(url: string): void;
  play(): Promise<void>;
  pause(): void;
  stop(): void;
  seekTo(progress: number): void;
  getCurrentTime(): number;
  getDuration(): number;
  isPlaying(): boolean;
  destroy(): void;
  on(event: string, callback: (...args: unknown[]) => void): void;
}

interface WsStatic {
  create(options: Record<string, unknown>): WsInstance;
}

declare global {
  interface Window {
    WaveSurfer?: WsStatic;
  }
}

function loadWaveSurfer(): Promise<WsStatic | null> {
  if (window.WaveSurfer) return Promise.resolve(window.WaveSurfer);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src =
      "https://cdnjs.cloudflare.com/ajax/libs/wavesurfer.js/7.8.3/wavesurfer.min.js";
    s.onload = () => resolve(window.WaveSurfer ?? null);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
}

export default function WaveformBar({
  audioUrl,
  isPlaying,
  progress,
  onSeek,
  accent = "#1DB954",
}: WaveformBarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WsInstance | null>(null);
  const [ready, setReady] = useState(false);
  const prevUrlRef = useRef("");
  const seekingRef = useRef(false);

  // Init / reload WaveSurfer when URL changes
  // biome-ignore lint/correctness/useExhaustiveDependencies: accent/onSeek are stable props intentionally excluded
  useEffect(() => {
    if (!containerRef.current || !audioUrl) return;
    if (audioUrl === prevUrlRef.current && wsRef.current) return;
    prevUrlRef.current = audioUrl;
    setReady(false);

    if (wsRef.current) {
      try {
        wsRef.current.destroy();
      } catch (_) {}
      wsRef.current = null;
    }

    loadWaveSurfer().then((WS) => {
      if (!WS || !containerRef.current) return;

      const ws = WS.create({
        container: containerRef.current,
        waveColor: "rgba(255,255,255,0.18)",
        progressColor: accent,
        cursorColor: "rgba(255,255,255,0.5)",
        cursorWidth: 1.5,
        barWidth: 2,
        barGap: 1,
        barRadius: 2,
        height: 32,
        normalize: true,
        interact: true,
        hideScrollbar: true,
        backend: "WebAudio",
        url: audioUrl,
      });

      ws.on("ready", () => setReady(true));
      ws.on("interaction", (newTime: unknown) => {
        seekingRef.current = true;
        const dur = ws.getDuration() || 1;
        if (onSeek) onSeek((newTime as number) / dur);
        setTimeout(() => {
          seekingRef.current = false;
        }, 100);
      });

      wsRef.current = ws;
    });

    return () => {
      if (wsRef.current) {
        try {
          wsRef.current.destroy();
        } catch (_) {}
        wsRef.current = null;
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || !ready) return;
    if (isPlaying) {
      ws.play().catch(() => {});
    } else {
      ws.pause();
    }
  }, [isPlaying, ready]);

  useEffect(() => {
    const ws = wsRef.current;
    if (!ws || !ready || seekingRef.current) return;
    const currentWsProg = ws.getCurrentTime() / (ws.getDuration() || 1);
    if (Math.abs(currentWsProg - progress) > 0.02) {
      ws.seekTo(Math.max(0, Math.min(1, progress)));
    }
  }, [progress, ready]);

  return (
    <div
      className="waveform-container"
      style={{
        flex: 1,
        minWidth: 0,
        opacity: ready ? 1 : 0.4,
        transition: "opacity 0.4s ease",
      }}
    >
      <div ref={containerRef} style={{ width: "100%" }} />
      {!ready && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
          }}
        >
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              style={{
                width: 3,
                height: `${6 + i * 3}px`,
                background: "rgba(255,255,255,0.2)",
                borderRadius: 2,
                animation: `pulse 1.2s ease-in-out ${i * 0.15}s infinite alternate`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
