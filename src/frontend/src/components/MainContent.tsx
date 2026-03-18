import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Play,
  Search,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type Song,
  colorGradients,
  featuredPlaylists,
  formatTime,
} from "../data/songs";
import { type YouTubeItem, searchYouTube } from "../utils/youtubeSearch";

type ActiveView = "home" | "search" | "liked" | "recent";

interface MainContentProps {
  activeView: ActiveView;
  songs: Song[];
  // FIX: accept the actual currentSongId from the player (includes external/YT songs)
  currentSongId: string | null;
  isPlaying: boolean;
  likedIds: Set<string>;
  recentIds: number[];
  searchQuery: string;
  onSongPlay: (idx: number) => void;
  onPlayYouTubeSong: (song: Song) => void;
  onPlayYT: (videoId: string, title: string) => void;
  onToggleLike: (songId: string) => void;
  onViewChange: (view: string) => void;
  onSearchChange: (q: string) => void;
}

const Accent = "#1DB954";
const SubtleColor = "#b3b3b3";
const MutedColor = "#6a6a6a";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function FeaturedCard({
  title,
  emoji,
  colorClass,
  index,
  onPlay,
}: {
  title: string;
  emoji: string;
  colorClass: string;
  index: number;
  onPlay: () => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.25 }}
      data-ocid={`featured.item.${index + 1}`}
      onClick={onPlay}
      aria-label={`Play ${title}`}
      className="group relative flex items-center gap-0 rounded-xl overflow-hidden cursor-pointer text-left w-full"
      style={{
        background: "#282828",
        border: "none",
        transition: "background 0.2s ease, filter 0.2s ease",
      }}
      whileHover={{ filter: "brightness(1.12)" }}
    >
      <div
        className="w-[60px] h-[60px] flex-shrink-0 flex items-center justify-center text-2xl"
        style={{ background: colorGradients[colorClass] ?? colorGradients.c1 }}
      >
        {emoji}
      </div>
      <span className="flex-1 px-3.5 text-[13px] font-bold text-white truncate">
        {title}
      </span>
      <div
        className="absolute right-3 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200"
        style={{
          background: Accent,
          boxShadow: "0 4px 16px rgba(29,185,84,0.5)",
        }}
        aria-hidden="true"
      >
        <Play
          size={14}
          fill="#000"
          stroke="none"
          className="ml-0.5"
          aria-hidden="true"
        />
      </div>
    </motion.button>
  );
}

function SongCard({
  song,
  index,
  isActive,
  isPlaying,
  isLiked,
  onPlay,
  onToggleLike,
  ocidPrefix,
  thumbnailUrl,
}: {
  song: Song;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  isLiked: boolean;
  onPlay: () => void;
  onToggleLike: () => void;
  ocidPrefix: string;
  thumbnailUrl?: string;
}) {
  return (
    <div
      data-ocid={`${ocidPrefix}.item.${index + 1}`}
      onClick={onPlay}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onPlay();
      }}
      tabIndex={0}
      aria-label={`Play ${song.title}`}
      // biome-ignore lint/a11y/useSemanticElements: styled card
      role="button"
      className="music-card group relative cursor-pointer p-3.5 outline-none"
      style={{
        background: isActive ? "#282828" : "#181818",
        boxShadow: isActive
          ? "0 4px 16px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(29,185,84,0.35)"
          : "0 4px 16px rgba(0,0,0,0.25)",
      }}
    >
      {/* Art area */}
      <div
        className={`relative w-full aspect-square rounded-xl mb-3.5 flex items-center justify-center text-5xl overflow-hidden ${
          !thumbnailUrl ? song.colorClass : ""
        }`}
        style={thumbnailUrl ? { background: "#111" } : {}}
      >
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={song.title}
            className="w-full h-full object-cover"
          />
        ) : isActive && isPlaying ? (
          <div className="absolute inset-0 bg-black/30 flex items-end justify-center gap-0.5 pb-2">
            <div className="eq-bar" />
            <div className="eq-bar" />
            <div className="eq-bar" />
          </div>
        ) : (
          <span aria-hidden="true">{song.emoji}</span>
        )}
        {isActive && isPlaying && thumbnailUrl && (
          <div className="absolute inset-0 bg-black/30 flex items-end justify-center gap-0.5 pb-2">
            <div className="eq-bar" />
            <div className="eq-bar" />
            <div className="eq-bar" />
          </div>
        )}
        {/* Bottom gradient on art */}
        <div
          className="absolute inset-x-0 bottom-0 h-12 pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.5), transparent)",
          }}
        />
        {/* Centered play button overlay */}
        <div
          className="play-overlay absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: Accent,
              boxShadow: "0 4px 20px rgba(29,185,84,0.55)",
            }}
          >
            <Play
              size={18}
              fill="#000"
              stroke="none"
              className="ml-0.5"
              aria-hidden="true"
            />
          </div>
        </div>
      </div>
      <div
        className="text-[13px] font-bold truncate mb-1"
        style={{ color: isActive ? Accent : "#fff", letterSpacing: "-0.01em" }}
      >
        {song.title}
      </div>
      <div className="text-[11px] truncate" style={{ color: SubtleColor }}>
        {song.artist}
      </div>
      <div className="flex items-center justify-between mt-2">
        <button
          type="button"
          data-ocid={`${ocidPrefix}.like.${index + 1}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike();
          }}
          aria-label={isLiked ? "Unlike" : "Like"}
          className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 cursor-pointer"
          style={{
            color: isLiked ? Accent : "#888",
            background: "none",
            border: "none",
            transition: "opacity 0.2s ease, color 0.15s ease",
          }}
        >
          <svg
            aria-hidden="true"
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill={isLiked ? "currentColor" : "none"}
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        <span className="text-[11px] font-medium" style={{ color: MutedColor }}>
          {song.duration > 0 ? formatTime(song.duration) : ""}
        </span>
      </div>
    </div>
  );
}

function SearchInput({
  value,
  onChange,
  onSuggestionClick,
}: {
  value: string;
  onChange: (v: string) => void;
  onSuggestionClick: (song: Song) => void;
}) {
  const [focused, setFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<YouTubeItem[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fetch top 3 suggestions when typing (debounced 350ms)
  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      setShowDropdown(false);
      return;
    }

    setLoadingSuggestions(true);
    const timer = setTimeout(async () => {
      try {
        const items = await searchYouTube(value);
        setSuggestions(items.slice(0, 3));
        setShowDropdown(true);
      } catch (_e) {
        setSuggestions([]);
      } finally {
        setLoadingSuggestions(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSuggestionClick = (item: YouTubeItem) => {
    const song: Song = {
      id: `yt-${item.id.videoId}`,
      title: item.snippet.title,
      artist: item.snippet.channelTitle,
      duration: 0,
      emoji: "🎬",
      colorClass: "c1",
      src: "",
      youtubeId: item.id.videoId,
    };
    setShowDropdown(false);
    onSuggestionClick(song);
  };

  return (
    <div className="relative flex-1 max-w-sm mx-4" ref={wrapperRef}>
      <Search
        size={14}
        className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: focused ? Accent : MutedColor, zIndex: 1 }}
        aria-hidden="true"
      />
      <input
        data-ocid="search.input"
        type="text"
        value={value}
        onChange={(e) => {
          console.log("[SearchInput] Input changed:", e.target.value);
          onChange(e.target.value);
        }}
        placeholder="Search YouTube…"
        className="w-full rounded-full py-2 pl-9 pr-4 text-[13px] text-white placeholder:text-[#4a4a4a] outline-none"
        style={{
          background: focused ? "#2a2a2a" : "#1e1e1e",
          border: focused
            ? `1.5px solid ${Accent}60`
            : "1.5px solid rgba(255,255,255,0.06)",
          fontFamily: "Inter, sans-serif",
          transition: "background 0.2s ease, border-color 0.2s ease",
        }}
        onFocus={() => {
          setFocused(true);
          if (suggestions.length > 0) setShowDropdown(true);
        }}
        onBlur={() => setFocused(false)}
      />

      {/* Suggestions dropdown (top 3 quick access) */}
      {showDropdown && value.trim() && (
        <div
          data-ocid="search.popover"
          className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50"
          style={{
            background: "#1e1e1e",
            boxShadow: "0 12px 40px rgba(0,0,0,0.6)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          {loadingSuggestions ? (
            <div className="flex items-center gap-2 px-4 py-3">
              <Loader2
                size={12}
                className="animate-spin"
                style={{ color: Accent }}
              />
              <span className="text-[12px]" style={{ color: SubtleColor }}>
                Searching…
              </span>
            </div>
          ) : suggestions.length > 0 ? (
            suggestions.map((item) => (
              <button
                type="button"
                key={item.id.videoId}
                data-ocid="search.button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSuggestionClick(item);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 transition-colors cursor-pointer text-left"
                style={{ background: "transparent", border: "none" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.06)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                }}
              >
                <img
                  src={item.snippet.thumbnails.medium.url}
                  alt=""
                  className="w-9 h-9 rounded-lg object-cover flex-shrink-0"
                  style={{ background: "#333" }}
                />
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[12px] font-semibold truncate"
                    style={{ color: "#fff" }}
                  >
                    {item.snippet.title}
                  </div>
                  <div
                    className="text-[11px] truncate mt-0.5"
                    style={{ color: SubtleColor }}
                  >
                    {item.snippet.channelTitle}
                  </div>
                </div>
                <Play
                  size={11}
                  fill={Accent}
                  stroke="none"
                  style={{ color: Accent, flexShrink: 0 }}
                  aria-hidden="true"
                />
              </button>
            ))
          ) : null}
        </div>
      )}
    </div>
  );
}

function YouTubeSearchResults({
  query,
  currentSongId,
  isPlaying,
  likedIds,
  onPlay,
  onToggleLike,
}: {
  query: string;
  currentSongId: string | null;
  isPlaying: boolean;
  likedIds: Set<string>;
  onPlay: (videoId: string, title: string) => void;
  onToggleLike: (id: string) => void;
}) {
  const [ytItems, setYtItems] = useState<YouTubeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    console.log("[YouTubeSearchResults] Starting search for:", q);
    setLoading(true);
    setError(null);
    setYtItems([]);

    try {
      const items = await searchYouTube(q);
      console.log("[YouTubeSearchResults] Got", items.length, "results");
      setYtItems(items);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to load results";
      console.error("[YouTubeSearchResults] Search failed:", e);
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = query.trim();
    console.log("[YouTubeSearchResults] Query changed:", q);

    if (timerRef.current) clearTimeout(timerRef.current);

    if (!q) {
      setYtItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Debounce 400ms
    timerRef.current = setTimeout(() => {
      runSearch(q);
    }, 400);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, runSearch]);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-20 gap-3"
        data-ocid="search.loading_state"
      >
        <Loader2 size={22} className="animate-spin" style={{ color: Accent }} />
        <span style={{ color: SubtleColor, fontSize: 14 }}>
          Searching YouTube…
        </span>
      </div>
    );
  }

  if (error) {
    // FIX: Only show error on real API failures. No "check console" copy.
    return (
      <div className="text-center py-16" data-ocid="search.error_state">
        <div className="text-4xl mb-3">⚠️</div>
        <div
          className="text-[14px] font-semibold mb-2"
          style={{ color: "#e05555" }}
        >
          Could not load results
        </div>
        <div
          className="text-[12px] max-w-xs mx-auto"
          style={{ color: SubtleColor }}
        >
          {error.includes("quota") || error.includes("403")
            ? "Your YouTube API quota has been reached. Try again tomorrow or use a different API key."
            : error.includes("Network") || error.includes("fetch")
              ? "Could not reach YouTube. Check your internet connection or disable any ad blockers."
              : error}
        </div>
      </div>
    );
  }

  if (ytItems.length === 0 && query.trim()) {
    return (
      <div
        className="text-center py-16 text-[14px]"
        style={{ color: SubtleColor }}
        data-ocid="search.empty_state"
      >
        No results found for “{query}”
      </div>
    );
  }

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}
      data-ocid="search.list"
    >
      {ytItems.map((item, i) => {
        const song: Song = {
          id: `yt-${item.id.videoId}`,
          title: item.snippet.title,
          artist: item.snippet.channelTitle,
          duration: 0,
          emoji: "🎬",
          colorClass: "c1",
          src: "",
          youtubeId: item.id.videoId,
        };
        // FIX: isActive now correctly matches YouTube songs via currentSongId
        return (
          <SongCard
            key={song.id}
            song={song}
            index={i}
            isActive={currentSongId === song.id}
            isPlaying={isPlaying}
            isLiked={likedIds.has(song.id)}
            onPlay={() => {
              console.log(
                "[YouTubeSearchResults] Playing:",
                item.snippet.title,
                item.id.videoId,
              );
              onPlay(item.id.videoId, item.snippet.title);
            }}
            onToggleLike={() => onToggleLike(song.id)}
            ocidPrefix="search"
            thumbnailUrl={item.snippet.thumbnails.medium.url}
          />
        );
      })}
    </div>
  );
}

export default function MainContent({
  activeView,
  songs,
  currentSongId,
  isPlaying,
  likedIds,
  recentIds,
  searchQuery,
  onSongPlay,
  onPlayYouTubeSong,
  onPlayYT,
  onToggleLike,
  onViewChange,
  onSearchChange,
}: MainContentProps) {
  const likedSongs = songs.filter((s) => likedIds.has(s.id));
  const recentSongs = recentIds
    .map((idx) => ({ song: songs[idx], idx }))
    .filter((x) => x.song != null);

  const renderCards = (list: Song[], prefix: string) => (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}
    >
      {list.map((song, i) => {
        const globalIdx = songs.findIndex((s) => s.id === song.id);
        return (
          <SongCard
            key={song.id}
            song={song}
            index={i}
            isActive={currentSongId === song.id}
            isPlaying={isPlaying}
            isLiked={likedIds.has(song.id)}
            onPlay={() => onSongPlay(globalIdx)}
            onToggleLike={() => onToggleLike(song.id)}
            ocidPrefix={prefix}
          />
        );
      })}
    </div>
  );

  const handleSuggestionClick = (song: Song) => {
    onPlayYouTubeSong(song);
    onViewChange("search");
  };

  // gradient background per view
  const bgGradient =
    activeView === "home"
      ? "linear-gradient(180deg, #1a2e1a 0%, #121212 320px)"
      : activeView === "liked"
        ? "linear-gradient(180deg, #2e1a2e 0%, #121212 320px)"
        : activeView === "recent"
          ? "linear-gradient(180deg, #1a1a2e 0%, #121212 320px)"
          : "#121212";

  return (
    <div className="main-scroll" style={{ background: bgGradient }}>
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-3.5"
        style={{
          background: "rgba(18,18,18,0.88)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.04)",
        }}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-ocid="topbar.back.button"
            aria-label="Go back"
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              color: SubtleColor,
              transition: "background 0.15s ease, color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.14)";
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLButtonElement).style.color = SubtleColor;
            }}
          >
            <ChevronLeft size={17} aria-hidden="true" />
          </button>
          <button
            type="button"
            data-ocid="topbar.forward.button"
            aria-label="Go forward"
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "none",
              color: SubtleColor,
              transition: "background 0.15s ease, color 0.15s ease",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.14)";
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background =
                "rgba(255,255,255,0.08)";
              (e.currentTarget as HTMLButtonElement).style.color = SubtleColor;
            }}
          >
            <ChevronRight size={17} aria-hidden="true" />
          </button>
        </div>

        {/* Search always visible in topbar */}
        <SearchInput
          value={searchQuery}
          onChange={(q) => {
            onSearchChange(q);
            if (activeView !== "search") onViewChange("search");
          }}
          onSuggestionClick={handleSuggestionClick}
        />

        <button
          type="button"
          data-ocid="topbar.user.button"
          className="flex items-center gap-2 px-3 py-1.5 rounded-full cursor-pointer text-white font-semibold text-[12px] flex-shrink-0"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "none",
            transition: "background 0.15s ease",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(255,255,255,0.14)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background =
              "rgba(255,255,255,0.08)";
          }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: Accent }}
          >
            <User
              size={13}
              strokeWidth={2.5}
              aria-hidden="true"
              style={{ color: "#000" }}
            />
          </div>
          User
        </button>
      </div>

      <div className="px-6 pb-8">
        <div key={activeView} className="fade-in">
          {activeView === "home" && (
            <>
              <motion.h1
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[28px] font-extrabold text-white mb-4 mt-4"
                style={{ letterSpacing: "-0.03em" }}
              >
                {getGreeting()}
              </motion.h1>
              <section className="mb-8">
                <div
                  className="grid gap-2"
                  style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
                  data-ocid="featured.list"
                >
                  {featuredPlaylists.map((pl, i) => (
                    <FeaturedCard
                      key={pl.id}
                      title={pl.title}
                      emoji={pl.emoji}
                      colorClass={pl.colorClass}
                      index={i}
                      onPlay={() => onSongPlay(i % songs.length)}
                    />
                  ))}
                </div>
              </section>
              <section className="mb-8">
                <h2
                  className="text-[20px] font-bold text-white mb-4"
                  style={{ letterSpacing: "-0.02em" }}
                >
                  Trending Now
                </h2>
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(160px, 1fr))",
                  }}
                  data-ocid="trending.list"
                >
                  {songs.slice(0, 6).map((song, i) => (
                    <SongCard
                      key={song.id}
                      song={song}
                      index={i}
                      isActive={currentSongId === song.id}
                      isPlaying={isPlaying}
                      isLiked={likedIds.has(song.id)}
                      onPlay={() => onSongPlay(i)}
                      onToggleLike={() => onToggleLike(song.id)}
                      ocidPrefix="trending"
                    />
                  ))}
                </div>
              </section>
              <section>
                <div className="flex items-center justify-between mb-4">
                  <h2
                    className="text-[20px] font-bold text-white"
                    style={{ letterSpacing: "-0.02em" }}
                  >
                    Recently Played
                  </h2>
                  <button
                    type="button"
                    data-ocid="recent.see_all.button"
                    onClick={() => onViewChange("recent")}
                    className="text-[12px] font-semibold cursor-pointer hover:text-white transition-colors"
                    style={{
                      color: SubtleColor,
                      background: "none",
                      border: "none",
                    }}
                  >
                    See all
                  </button>
                </div>
                {recentSongs.length === 0 ? (
                  <div
                    className="text-[14px] mt-4"
                    style={{ color: SubtleColor }}
                    data-ocid="recent.home.empty_state"
                  >
                    Nothing played yet. Start listening!
                  </div>
                ) : (
                  <div
                    className="grid gap-4"
                    style={{
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(160px, 1fr))",
                    }}
                    data-ocid="recent.home.list"
                  >
                    {recentSongs.slice(0, 6).map(({ song, idx }, i) => (
                      <SongCard
                        key={`${song.id}-${i}`}
                        song={song}
                        index={i}
                        isActive={currentSongId === song.id}
                        isPlaying={isPlaying}
                        isLiked={likedIds.has(song.id)}
                        onPlay={() => onSongPlay(idx)}
                        onToggleLike={() => onToggleLike(song.id)}
                        ocidPrefix="recent_home"
                      />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}

          {activeView === "liked" && (
            <>
              <motion.h1
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[26px] font-extrabold text-white mb-6 mt-4"
                style={{ letterSpacing: "-0.02em" }}
              >
                ❤️ Liked Songs
              </motion.h1>
              {likedSongs.length === 0 ? (
                <div
                  className="text-[14px] mt-8"
                  style={{ color: SubtleColor }}
                  data-ocid="liked.empty_state"
                >
                  No liked songs yet. Tap ♥ on any song!
                </div>
              ) : (
                renderCards(likedSongs, "liked")
              )}
            </>
          )}

          {activeView === "recent" && (
            <>
              <motion.h1
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[26px] font-extrabold text-white mb-6 mt-4"
                style={{ letterSpacing: "-0.02em" }}
              >
                🕐 Recently Played
              </motion.h1>
              {recentSongs.length === 0 ? (
                <div
                  className="text-[14px] mt-8"
                  style={{ color: SubtleColor }}
                  data-ocid="recent.empty_state"
                >
                  Nothing played yet. Start listening!
                </div>
              ) : (
                <div
                  className="grid gap-4"
                  style={{
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(160px, 1fr))",
                  }}
                  data-ocid="recent.list"
                >
                  {recentSongs.map(({ song, idx }, i) => (
                    <SongCard
                      key={`${song.id}-${i}`}
                      song={song}
                      index={i}
                      isActive={currentSongId === song.id}
                      isPlaying={isPlaying}
                      isLiked={likedIds.has(song.id)}
                      onPlay={() => onSongPlay(idx)}
                      onToggleLike={() => onToggleLike(song.id)}
                      ocidPrefix="recent"
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {activeView === "search" && (
            <>
              <motion.h1
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-[26px] font-extrabold text-white mb-6 mt-4"
                style={{ letterSpacing: "-0.02em" }}
              >
                🔍 Search
              </motion.h1>
              {searchQuery.trim() ? (
                <YouTubeSearchResults
                  query={searchQuery}
                  currentSongId={currentSongId}
                  isPlaying={isPlaying}
                  likedIds={likedIds}
                  onPlay={onPlayYT}
                  onToggleLike={onToggleLike}
                />
              ) : (
                <div
                  className="text-center py-20"
                  style={{ color: SubtleColor }}
                  data-ocid="search.browse_state"
                >
                  <div className="text-5xl mb-4">🎵</div>
                  <div className="text-[15px] font-medium">
                    Type something to search YouTube
                  </div>
                  <div
                    className="text-[13px] mt-2"
                    style={{ color: MutedColor }}
                  >
                    Find your favorite songs, artists, and more
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <footer
        className="px-6 py-5 text-center"
        style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}
      >
        <p className="text-[11px]" style={{ color: MutedColor }}>
          &copy; {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
            style={{ color: Accent }}
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
