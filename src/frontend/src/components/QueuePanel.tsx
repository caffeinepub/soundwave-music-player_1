import { Play } from "lucide-react";
import type { Song } from "../data/songs";
import { colorGradients, formatTime } from "../data/songs";

interface QueuePanelProps {
  isOpen: boolean;
  songs: Song[];
  currentIdx: number;
  currentSong: Song | null;
  onClose: () => void;
  onPlayTrack: (idx: number) => void;
}

const Accent = "#1DB954";
const SubtleColor = "#b3b3b3";
const MutedColor = "#6a6a6a";

export default function QueuePanel({
  isOpen,
  songs,
  currentIdx,
  onClose,
  onPlayTrack,
}: QueuePanelProps) {
  return (
    <div
      data-ocid="queue.panel"
      className={`queue-panel${isOpen ? " open" : ""}`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      >
        <span
          className="text-white font-bold text-[15px]"
          style={{ letterSpacing: "-0.01em" }}
        >
          Up Next
        </span>
        <button
          type="button"
          data-ocid="queue.close.button"
          onClick={onClose}
          className="w-7 h-7 rounded-full flex items-center justify-center cursor-pointer transition-colors"
          style={{
            color: SubtleColor,
            background: "rgba(255,255,255,0.06)",
            border: "none",
            fontSize: 14,
          }}
        >
          ✕
        </button>
      </div>

      {/* Song list */}
      <div style={{ overflowY: "auto", flex: 1, padding: "8px 0" }}>
        {songs.map((song, i) => {
          const isActive = i === currentIdx;
          const bg = colorGradients[song.colorClass] ?? colorGradients.c1;
          return (
            <button
              key={song.id}
              type="button"
              data-ocid={`queue.item.${i + 1}`}
              onClick={() => onPlayTrack(i)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                width: "100%",
                padding: "10px 20px",
                background: isActive ? "rgba(29,185,84,0.08)" : "transparent",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                transition: "background 0.15s",
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 6,
                  background: bg,
                  flexShrink: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 16,
                  position: "relative",
                }}
              >
                {isActive ? (
                  <Play
                    size={14}
                    fill={Accent}
                    stroke="none"
                    aria-hidden="true"
                  />
                ) : (
                  song.emoji
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    color: isActive ? Accent : "#fff",
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 500,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {song.title}
                </div>
                <div style={{ color: MutedColor, fontSize: 11, marginTop: 1 }}>
                  {song.artist}
                </div>
              </div>
              <div style={{ color: MutedColor, fontSize: 11, flexShrink: 0 }}>
                {formatTime(song.duration)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
