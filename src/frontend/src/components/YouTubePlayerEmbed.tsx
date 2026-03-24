import { X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useRef } from "react";

interface Props {
  videoId: string | null;
  title?: string;
  onClose: () => void;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (e: { target: { playVideo: () => void } }) => void;
            onStateChange?: (e: { data: number }) => void;
          };
        },
      ) => {
        destroy: () => void;
        stopVideo: () => void;
        playVideo: () => void;
      };
      PlayerState: { ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiLoaded = false;
let apiReadyCallbacks: (() => void)[] = [];

function loadYTAPI(cb: () => void) {
  if (apiLoaded) {
    cb();
    return;
  }
  apiReadyCallbacks.push(cb);
  if (document.getElementById("yt-iframe-api")) return;
  const tag = document.createElement("script");
  tag.id = "yt-iframe-api";
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
  window.onYouTubeIframeAPIReady = () => {
    apiLoaded = true;
    for (const fn of apiReadyCallbacks) fn();
    apiReadyCallbacks = [];
  };
}

let _stopExternal: (() => void) | null = null;
export function stopYTPlayer() {
  _stopExternal?.();
}

export default function YouTubePlayerEmbed({ videoId, title, onClose }: Props) {
  const playerRef = useRef<{
    destroy: () => void;
    stopVideo: () => void;
    playVideo: () => void;
  } | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!videoId) {
      if (playerRef.current) {
        try {
          playerRef.current.stopVideo();
        } catch (_) {}
        try {
          playerRef.current.destroy();
        } catch (_) {}
        playerRef.current = null;
      }
      _stopExternal = null;
      return;
    }

    loadYTAPI(() => {
      if (!containerRef.current) return;
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (_) {}
        playerRef.current = null;
      }
      const el = document.createElement("div");
      containerRef.current.innerHTML = "";
      containerRef.current.appendChild(el);
      playerRef.current = new window.YT.Player(el, {
        videoId,
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onStateChange: (e) => {
            if (e.data === window.YT?.PlayerState?.ENDED) {
              onClose();
            }
          },
        },
      });

      _stopExternal = () => {
        try {
          playerRef.current?.stopVideo();
        } catch (_) {}
        onClose();
      };
    });

    return () => {
      _stopExternal = null;
      if (playerRef.current) {
        try {
          playerRef.current.stopVideo();
        } catch (_) {}
        try {
          playerRef.current.destroy();
        } catch (_) {}
        playerRef.current = null;
      }
    };
  }, [videoId, onClose]);

  return (
    <AnimatePresence>
      {videoId && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 200,
            background: "rgba(10,10,15,0.98)",
            backdropFilter: "blur(24px)",
            borderTop: "1px solid rgba(255,255,255,0.08)",
            display: "flex",
            flexDirection: "column",
          }}
          data-ocid="youtube.panel"
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "10px 16px 8px",
              borderBottom: "1px solid rgba(255,255,255,0.05)",
            }}
          >
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#ff0000",
                boxShadow: "0 0 8px rgba(255,0,0,0.6)",
              }}
            />
            <span
              style={{
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                flex: 1,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {title ?? "YouTube Video"}
            </span>
            <button
              type="button"
              onClick={onClose}
              data-ocid="youtube.close_button"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "none",
                borderRadius: "50%",
                width: 30,
                height: 30,
                color: "#b3b3b3",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Close YouTube player"
            >
              <X size={14} />
            </button>
          </div>

          {/* IFrame container */}
          <div
            ref={containerRef}
            style={{
              width: "100%",
              aspectRatio: "16/9",
              maxHeight: "calc(100vh - 200px)",
              overflow: "hidden",
              background: "#000",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
