import type { Song } from "../data/songs";
import { colorGradients, formatTime } from "../data/songs";

interface QueuePanelProps {
  isOpen: boolean;
  songs: Song[];
  currentIdx: number;
  onClose: () => void;
  onPlayTrack: (idx: number) => void;
}

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
            color: "#b3b3b3",
            background: "rgba(255,255,255,0.06)",
            border: "none",
            fontSize: 14,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(255,255,255,0.12)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(255,255,255,0.06)";
          }}
          aria-label="Close queue"
        >
          ✕
        </button>
      </div>

      {/* List */}
      <div
        className="flex-1 overflow-y-auto py-2"
        style={{ scrollbarWidth: "thin" }}
      >
        {songs.map((song, i) => {
          const isActive = i === currentIdx;
          return (
            <button
              key={song.id}
              type="button"
              data-ocid={`queue.item.${i + 1}`}
              onClick={() => onPlayTrack(i)}
              className="w-full flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all text-left group"
              style={{
                background: isActive ? "rgba(29,185,84,0.1)" : "transparent",
                border: "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.04)";
              }}
              onMouseLeave={(e) => {
                if (!isActive)
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
              }}
            >
              {/* Art */}
              <div
                className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-base"
                style={{
                  background:
                    colorGradients[song.colorClass] ?? colorGradients.c1,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                }}
              >
                {song.emoji}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-[13px] font-semibold truncate"
                  style={{ color: isActive ? "#1DB954" : "#fff" }}
                >
                  {song.title}
                  {isActive && (
                    <span
                      className="ml-1.5 text-[10px] font-medium"
                      style={{ color: "#1DB954" }}
                    >
                      ● now playing
                    </span>
                  )}
                </div>
                <div
                  className="text-[11px] mt-0.5"
                  style={{ color: "#6a6a6a" }}
                >
                  {song.artist}
                </div>
              </div>
              {/* Duration */}
              <div
                className="text-[11px] flex-shrink-0 font-medium"
                style={{ color: "#6a6a6a" }}
              >
                {formatTime(song.duration)}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
