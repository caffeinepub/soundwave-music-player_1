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
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: "#282828" }}
      >
        <span className="text-white font-bold text-[15px]">Up Next</span>
        <button
          type="button"
          data-ocid="queue.close.button"
          onClick={onClose}
          className="text-[#b3b3b3] hover:text-white transition-colors cursor-pointer text-lg leading-none"
          aria-label="Close queue"
        >
          ✕
        </button>
      </div>

      {/* List */}
      <div
        className="flex-1 overflow-y-auto"
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
              className="w-full flex items-center gap-3 px-4 py-2 cursor-pointer transition-colors text-left"
              style={{ background: isActive ? "#1a1a1a" : "transparent" }}
            >
              {/* Art */}
              <div
                className="w-10 h-10 rounded flex-shrink-0 flex items-center justify-center text-lg"
                style={{
                  background:
                    colorGradients[song.colorClass] ?? colorGradients.c1,
                }}
              >
                {song.emoji}
              </div>
              {/* Info */}
              <div className="flex-1 min-w-0">
                <div
                  className="text-[12px] font-semibold truncate"
                  style={{ color: isActive ? "oklch(0.65 0.19 145)" : "#fff" }}
                >
                  {song.title}
                  {isActive && (
                    <span
                      className="ml-1.5 text-[10px]"
                      style={{ color: "oklch(0.65 0.19 145)" }}
                    >
                      ▶ playing
                    </span>
                  )}
                </div>
                <div className="text-[11px]" style={{ color: "#555" }}>
                  {song.artist}
                </div>
              </div>
              {/* Duration */}
              <div
                className="text-[11px] flex-shrink-0"
                style={{ color: "#555" }}
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
