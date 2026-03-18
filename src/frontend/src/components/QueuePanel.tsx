import { Play } from "lucide-react";
import type { Song } from "../data/songs";
import { colorGradients, formatTime } from "../data/songs";

interface QueuePanelProps {
  isOpen: boolean;
  songs: Song[];
  currentIdx: number;
  ytQueue: Song[];
  ytQueueIdx: number;
  currentSong: Song | null;
  onClose: () => void;
  onPlayTrack: (idx: number) => void;
  onPlayYT: (song: Song) => void;
}

const Accent = "#1DB954";
const SubtleColor = "#b3b3b3";
const MutedColor = "#6a6a6a";

export default function QueuePanel({
  isOpen,
  songs,
  currentIdx,
  ytQueue,
  ytQueueIdx,
  currentSong,
  onClose,
  onPlayTrack,
  onPlayYT,
}: QueuePanelProps) {
  const isYouTubeMode = currentSong?.youtubeId != null;

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
        {/* YouTube queue */}
        {isYouTubeMode && ytQueue.length > 0 && (
          <>
            <div
              className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: MutedColor }}
            >
              YouTube Queue
            </div>
            {ytQueue.map((song, i) => {
              const isActive = i === ytQueueIdx;
              return (
                <button
                  key={`${song.id}-${i}`}
                  type="button"
                  data-ocid={`queue.yt.item.${i + 1}`}
                  onClick={() => onPlayYT(song)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-all text-left group"
                  style={{
                    background: isActive
                      ? "rgba(29,185,84,0.1)"
                      : "transparent",
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
                  {/* Art — YouTube thumbnail or fallback */}
                  <div
                    className="w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-base overflow-hidden"
                    style={{
                      background:
                        colorGradients[song.colorClass] ?? colorGradients.c1,
                      boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                    }}
                  >
                    <span aria-hidden="true">{song.emoji}</span>
                  </div>
                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div
                      className="text-[13px] font-semibold truncate"
                      style={{ color: isActive ? Accent : "#fff" }}
                    >
                      {song.title}
                      {isActive && (
                        <span
                          className="ml-1.5 text-[10px] font-medium"
                          style={{ color: Accent }}
                        >
                          ● now playing
                        </span>
                      )}
                    </div>
                    <div
                      className="text-[11px] mt-0.5 flex items-center gap-1"
                      style={{ color: MutedColor }}
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 24 24"
                        fill="#ff0000"
                        aria-hidden="true"
                      >
                        <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2C0 8.1 0 12 0 12s0 3.9.5 5.8a3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1C24 15.9 24 12 24 12s0-3.9-.5-5.8z" />
                        <path d="M9.7 15.5V8.5l6.3 3.5-6.3 3.5z" fill="white" />
                      </svg>
                      YouTube
                    </div>
                  </div>
                  {/* Play icon on hover */}
                  <div
                    className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    style={{ color: SubtleColor }}
                    aria-hidden="true"
                  >
                    <Play size={13} fill="currentColor" stroke="none" />
                  </div>
                </button>
              );
            })}

            {/* Divider */}
            <div
              className="mx-5 my-2"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            />
            <div
              className="px-5 py-2 text-[10px] font-bold uppercase tracking-widest"
              style={{ color: MutedColor }}
            >
              Local Tracks
            </div>
          </>
        )}

        {/* Local tracks */}
        {songs.map((song, i) => {
          const isActive = !isYouTubeMode && i === currentIdx;
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
                  style={{ color: isActive ? Accent : "#fff" }}
                >
                  {song.title}
                  {isActive && (
                    <span
                      className="ml-1.5 text-[10px] font-medium"
                      style={{ color: Accent }}
                    >
                      ● now playing
                    </span>
                  )}
                </div>
                <div
                  className="text-[11px] mt-0.5"
                  style={{ color: MutedColor }}
                >
                  {song.artist}
                </div>
              </div>
              {/* Duration */}
              <div
                className="text-[11px] flex-shrink-0 font-medium"
                style={{ color: MutedColor }}
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
