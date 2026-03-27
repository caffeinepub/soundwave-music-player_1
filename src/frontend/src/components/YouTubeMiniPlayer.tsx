import { ChevronDown, ChevronUp, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import type { YouTubePlayerState } from "../hooks/useYouTubePlayer";
import { MINI_PLAYER_DIV_ID } from "../hooks/useYouTubePlayer";

interface Props {
  ytPlayer: YouTubePlayerState;
}

const STYLE_ID = "sw-mini-player-styles";
const CSS = `
@keyframes miniSlideIn {
  from { opacity: 0; transform: translateY(24px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes miniPulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(30,215,96,0); }
  50% { box-shadow: 0 0 0 4px rgba(30,215,96,0.15); }
}
.sw-mini-btn {
  background: rgba(255,255,255,0.1);
  border: none;
  color: #fff;
  cursor: pointer;
  border-radius: 50%;
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, transform 0.15s ease;
  flex-shrink: 0;
}
.sw-mini-btn:hover {
  background: rgba(255,255,255,0.2);
  transform: scale(1.1);
}
.sw-mini-btn:active { transform: scale(0.9); }
`;

export default function YouTubeMiniPlayer({ ytPlayer }: Props) {
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!document.getElementById(STYLE_ID)) {
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = CSS;
      document.head.appendChild(style);
    }
  }, []);

  const w = expanded ? 360 : 200;
  const h = expanded ? 202 : 113; // 16:9

  return (
    <>
      {/* Always render the YT container div so the API can attach to it */}
      {/* When ytActive is false it's invisible but the div stays in DOM */}
      <div
        id={MINI_PLAYER_DIV_ID}
        aria-hidden={!ytPlayer.ytActive}
        style={{
          position: "fixed",
          // Off-screen when inactive so YT API can still initialise
          ...(ytPlayer.ytActive
            ? {}
            : { top: -9999, left: -9999, width: 1, height: 1, zIndex: -1 }),
          ...(ytPlayer.ytActive
            ? {
                bottom: 100,
                right: 16,
                width: w,
                height: h,
                zIndex: 500,
              }
            : {}),
          overflow: "hidden",
          pointerEvents: ytPlayer.ytActive ? "auto" : "none",
          transition:
            "width 0.3s cubic-bezier(.4,0,.2,1), height 0.3s cubic-bezier(.4,0,.2,1)",
        }}
      />

      {/* Overlay shell (glassmorphism frame around the YT player) */}
      <AnimatePresence>
        {ytPlayer.ytActive && (
          <motion.div
            key="mini-shell"
            initial={{ opacity: 0, y: 24, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 300, damping: 26 }}
            style={{
              position: "fixed",
              bottom: 100,
              right: 16,
              width: w,
              zIndex: 501,
              pointerEvents: "none", // let clicks through to YT iframe
              transition: "width 0.3s cubic-bezier(.4,0,.2,1)",
            }}
          >
            {/* Top bar: title + controls (always pointer-events enabled) */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                padding: "5px 8px",
                background: "rgba(10,14,20,0.92)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
                borderRadius: "10px 10px 0 0",
                borderTop: "1px solid rgba(30,215,96,0.35)",
                borderLeft: "1px solid rgba(255,255,255,0.07)",
                borderRight: "1px solid rgba(255,255,255,0.07)",
                pointerEvents: "auto",
              }}
            >
              {/* YouTube pill badge */}
              <span
                style={{
                  background: "#ff0000",
                  color: "#fff",
                  fontSize: 9,
                  fontWeight: 800,
                  padding: "2px 6px",
                  borderRadius: 3,
                  letterSpacing: "0.05em",
                  flexShrink: 0,
                }}
              >
                YT
              </span>

              <span
                style={{
                  flex: 1,
                  color: "rgba(255,255,255,0.85)",
                  fontSize: 11,
                  fontWeight: 600,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  letterSpacing: "-0.01em",
                }}
              >
                {ytPlayer.ytTitle || "YouTube"}
              </span>

              <button
                type="button"
                className="sw-mini-btn"
                onClick={() => setExpanded((v) => !v)}
                aria-label={expanded ? "Collapse player" : "Expand player"}
                title={expanded ? "Collapse" : "Expand"}
              >
                {expanded ? (
                  <ChevronDown size={14} aria-hidden="true" />
                ) : (
                  <ChevronUp size={14} aria-hidden="true" />
                )}
              </button>

              <button
                type="button"
                className="sw-mini-btn"
                onClick={ytPlayer.stop}
                aria-label="Close YouTube player"
                title="Close"
                style={{ background: "rgba(255,60,60,0.2)" }}
              >
                <X size={13} aria-hidden="true" />
              </button>
            </div>

            {/* Bottom border line under YT player */}
            <div
              style={{
                height: 3,
                background:
                  "linear-gradient(90deg, #1ed760 0%, rgba(30,215,96,0.3) 60%, transparent 100%)",
                borderRadius: "0 0 8px 8px",
                borderLeft: "1px solid rgba(255,255,255,0.07)",
                borderRight: "1px solid rgba(255,255,255,0.07)",
                borderBottom: "1px solid rgba(255,255,255,0.07)",
                pointerEvents: "none",
                marginTop: h, // sits below the iframe
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
