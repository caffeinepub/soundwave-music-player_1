import { useEffect } from "react";
import type { AudioMode } from "../engines/audioEngine";

interface AtmosToggleProps {
  mode: AudioMode;
  onToggle: () => void;
}

const labels: Record<AudioMode, string> = {
  atmos: "Dolby Atmos",
  bassBoost: "Bass Boost",
  surround: "Surround",
  night: "Night Mode",
  off: "Atmos",
};

const STYLE_ID = "atmos-toggle-styles";

const CSS = `
@keyframes atmos-pulse {
  0% { transform: scale(1); opacity: 0.6; }
  100% { transform: scale(2.2); opacity: 0; }
}
@keyframes atmos-bar1 {
  0%, 100% { height: 6px; } 50% { height: 13px; }
}
@keyframes atmos-bar2 {
  0%, 100% { height: 10px; } 50% { height: 5px; }
}
@keyframes atmos-bar3 {
  0%, 100% { height: 7px; } 50% { height: 14px; }
}
.atmos-eq-bar:nth-child(1) { animation: atmos-bar1 0.7s ease-in-out infinite; }
.atmos-eq-bar:nth-child(2) { animation: atmos-bar2 0.5s ease-in-out infinite; }
.atmos-eq-bar:nth-child(3) { animation: atmos-bar3 0.9s ease-in-out infinite; }
`;

export default function AtmosToggle({ mode, onToggle }: AtmosToggleProps) {
  useEffect(() => {
    try {
      if (!document.getElementById(STYLE_ID)) {
        const style = document.createElement("style");
        style.id = STYLE_ID;
        style.textContent = CSS;
        document.head.appendChild(style);
      }
    } catch (err) {
      console.warn("[AtmosToggle] Failed to inject styles:", err);
    }
  }, []);

  try {
    const isOn = mode !== "off";

    const buttonStyle: React.CSSProperties = isOn
      ? {
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 12px",
          borderRadius: 20,
          background: "linear-gradient(135deg, #1a3a2a 0%, #0d2018 100%)",
          border: "1px solid rgba(29,185,84,0.4)",
          boxShadow:
            "0 0 12px rgba(29,185,84,0.4), 0 0 4px rgba(29,185,84,0.2)",
          cursor: "pointer",
          position: "relative",
          overflow: "visible",
          transition: "box-shadow 0.3s ease",
          flexShrink: 0,
          whiteSpace: "nowrap",
        }
      : {
          display: "flex",
          alignItems: "center",
          gap: 6,
          padding: "5px 12px",
          borderRadius: 20,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.08)",
          cursor: "pointer",
          position: "relative",
          overflow: "visible",
          transition: "background 0.3s ease, box-shadow 0.3s ease",
          flexShrink: 0,
          whiteSpace: "nowrap",
        };

    return (
      <button
        type="button"
        data-ocid="player.atmos.toggle"
        onClick={onToggle}
        style={buttonStyle}
        aria-label={
          isOn
            ? `${labels[mode]} active, click to disable`
            : "Enable Dolby Atmos"
        }
        aria-pressed={isOn}
      >
        {/* Pulse ring */}
        {isOn && (
          <span
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: -4,
              borderRadius: 24,
              border: "1px solid rgba(29,185,84,0.5)",
              animation: "atmos-pulse 2s ease-out infinite",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Icon */}
        <span
          aria-hidden="true"
          style={{
            fontSize: 10,
            color: isOn ? "#1DB954" : "#6a6a6a",
            lineHeight: 1,
            transition: "color 0.3s ease",
          }}
        >
          {isOn ? "✦" : "○"}
        </span>

        {/* Label */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            letterSpacing: "0.02em",
            color: isOn ? "#1DB954" : "#6a6a6a",
            transition: "color 0.3s ease",
          }}
        >
          {labels[mode]}
        </span>

        {/* Equalizer bars (only when on) */}
        {isOn && (
          <div
            aria-hidden="true"
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: 2,
              height: 14,
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="atmos-eq-bar"
                style={{
                  display: "block",
                  width: 2,
                  background: "#1DB954",
                  borderRadius: 2,
                  height: 8,
                  transformOrigin: "bottom",
                }}
              />
            ))}
          </div>
        )}
      </button>
    );
  } catch (err) {
    console.warn("[AtmosToggle] Render error:", err);
    return null; // Fallback: hide toggle rather than crash
  }
}
