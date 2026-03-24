import { motion } from "motion/react";
import { useState } from "react";
import { colorGradients, songs } from "../data/songs";
import { useRecommendations } from "../hooks/useRecommendations";

const Accent = "#1DB954";
const AccentPurple = "oklch(0.6 0.3 280)";
const MutedColor = "#6a6a6a";

type MoodFilter = "All" | "chill" | "workout" | "focus" | "party" | "adventure";

interface AIRecommendationsProps {
  likedIds: Set<string>;
  recentIds: number[];
  searchHistory: string[];
  currentSongId: string | null;
  isPlaying: boolean;
  onPlay: (songIndex: number) => void;
}

export default function AIRecommendations({
  likedIds,
  recentIds,
  searchHistory,
  currentSongId,
  isPlaying,
  onPlay,
}: AIRecommendationsProps) {
  const { recommendations, topMood, refreshRecs } = useRecommendations(
    likedIds,
    recentIds,
    searchHistory,
  );
  const [moodFilter, setMoodFilter] = useState<MoodFilter>("All");
  const [isLoaded, setIsLoaded] = useState(false);

  // Trigger loaded after first render
  if (!isLoaded) setTimeout(() => setIsLoaded(true), 600);

  const filteredRecs =
    moodFilter === "All"
      ? recommendations
      : recommendations.filter((r) => r.mood === moodFilter);

  const hasActivity =
    likedIds.size > 0 || recentIds.length > 0 || searchHistory.length > 0;

  const moods: MoodFilter[] = [
    "All",
    "chill",
    "workout",
    "focus",
    "party",
    "adventure",
  ];

  return (
    <div
      style={{
        marginBottom: 32,
        background:
          "linear-gradient(135deg, rgba(139,92,246,0.07), rgba(255,255,255,0.02))",
        border: "1px solid rgba(139,92,246,0.15)",
        borderRadius: 16,
        padding: "20px 20px 16px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 14,
          flexWrap: "wrap",
          gap: 8,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              background:
                "linear-gradient(135deg, oklch(0.6 0.3 280), oklch(0.65 0.28 320))",
              borderRadius: 8,
              padding: "5px 9px",
              fontSize: 14,
            }}
          >
            ✨
          </div>
          <div>
            <div
              style={{
                color: "#fff",
                fontWeight: 800,
                fontSize: 15,
                letterSpacing: "-0.01em",
              }}
            >
              Recommended for You
            </div>
            <div style={{ color: MutedColor, fontSize: 11, marginTop: 1 }}>
              AI-powered · Updates as you listen
            </div>
          </div>
          {topMood !== "chill" && (
            <span
              style={{
                background: "rgba(139,92,246,0.15)",
                color: AccentPurple,
                fontSize: 10,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 6,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {topMood}
            </span>
          )}
        </div>
        <button
          data-ocid="ai.refresh.button"
          type="button"
          onClick={refreshRecs}
          title="Refresh recommendations"
          style={{
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8,
            color: "#b3b3b3",
            width: 30,
            height: 30,
            cursor: "pointer",
            fontSize: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          ↻
        </button>
      </div>

      {/* Mood filters */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 16,
          flexWrap: "wrap",
        }}
      >
        {moods.map((m) => (
          <button
            key={m}
            data-ocid={`ai.mood.${m}.tab`}
            type="button"
            onClick={() => setMoodFilter(m)}
            style={{
              background:
                moodFilter === m
                  ? "rgba(29,185,84,0.15)"
                  : "rgba(255,255,255,0.04)",
              border: `1px solid ${
                moodFilter === m
                  ? "rgba(29,185,84,0.4)"
                  : "rgba(255,255,255,0.07)"
              }`,
              color: moodFilter === m ? Accent : "#b3b3b3",
              borderRadius: 20,
              padding: "5px 12px",
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
              textTransform: "capitalize",
            }}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Cards */}
      {!isLoaded ? (
        <div
          data-ocid="ai.loading_state"
          style={{ display: "flex", gap: 12, overflow: "hidden" }}
        >
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              style={{
                flex: "0 0 clamp(130px, 14vw, 160px)",
                height: 160,
                background: "rgba(255,255,255,0.04)",
                borderRadius: 12,
                animation: "pulse 1.5s ease-in-out infinite",
              }}
            />
          ))}
        </div>
      ) : !hasActivity ? (
        <div
          data-ocid="ai.empty_state"
          style={{
            textAlign: "center",
            padding: "24px 16px",
            color: MutedColor,
            fontSize: 13,
          }}
        >
          🎵 Play some music to get personalized recommendations
        </div>
      ) : filteredRecs.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "16px",
            color: MutedColor,
            fontSize: 13,
          }}
        >
          No {moodFilter} tracks found — try a different mood
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            gap: 12,
            overflowX: "auto",
            paddingBottom: 8,
            scrollSnapType: "x mandatory",
          }}
        >
          {filteredRecs.map((rec, i) => {
            const songIdx = songs.findIndex((s) => s.id === rec.songId);
            const song = songs[songIdx];
            if (!song) return null;
            const isActive = currentSongId === song.id;

            return (
              <motion.button
                key={rec.songId}
                data-ocid={`ai.rec.item.${i + 1}`}
                type="button"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                onClick={() => songIdx >= 0 && onPlay(songIdx)}
                style={{
                  background: isActive
                    ? "rgba(29,185,84,0.12)"
                    : "rgba(255,255,255,0.04)",
                  border: isActive
                    ? "1px solid rgba(29,185,84,0.3)"
                    : "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 12,
                  padding: 0,
                  cursor: "pointer",
                  flexShrink: 0,
                  width: "clamp(130px, 14vw, 165px)",
                  textAlign: "left",
                  overflow: "hidden",
                  transition: "all 0.2s",
                  scrollSnapAlign: "start",
                }}
              >
                {/* Art */}
                <div
                  className={song.colorClass}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 32,
                    background: colorGradients[song.colorClass],
                    position: "relative",
                  }}
                >
                  <span>{song.emoji}</span>
                  {isActive && isPlaying && (
                    <div
                      style={{
                        position: "absolute",
                        inset: 0,
                        background: "rgba(0,0,0,0.3)",
                        display: "flex",
                        alignItems: "flex-end",
                        justifyContent: "center",
                        gap: 2,
                        paddingBottom: 8,
                      }}
                    >
                      <div className="eq-bar" />
                      <div className="eq-bar" />
                      <div className="eq-bar" />
                    </div>
                  )}
                  {/* Match score badge */}
                  <div
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      background: "rgba(29,185,84,0.85)",
                      color: "#000",
                      fontSize: 9,
                      fontWeight: 800,
                      padding: "2px 5px",
                      borderRadius: 5,
                    }}
                  >
                    {rec.matchScore}%
                  </div>
                </div>
                {/* Meta */}
                <div style={{ padding: "10px 10px 10px" }}>
                  <div
                    style={{
                      color: isActive ? Accent : "#fff",
                      fontWeight: 700,
                      fontSize: 12,
                      marginBottom: 2,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {song.title}
                  </div>
                  <div
                    style={{
                      color: MutedColor,
                      fontSize: 11,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {song.artist}
                  </div>
                  <div
                    style={{
                      color: AccentPurple,
                      fontSize: 10,
                      marginTop: 4,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {rec.reason}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      )}
    </div>
  );
}
