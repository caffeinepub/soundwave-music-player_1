import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Play,
  Search,
  User,
} from "lucide-react";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
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
  currentIdx: number;
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
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      data-ocid={`featured.item.${index + 1}`}
      onClick={onPlay}
      aria-label={`Play ${title}`}
      className="group relative flex items-center gap-0 rounded-lg overflow-hidden cursor-pointer transition-colors text-left w-full"
      style={{ background: "#252525", border: "none" }}
    >
      <div
        className="w-[60px] h-[60px] flex-shrink-0 flex items-center justify-center text-2xl"
        style={{ background: colorGradients[colorClass] ?? colorGradients.c1 }}
      >
        {emoji}
      </div>
      <span className="flex-1 px-3 text-[12px] font-bold text-white truncate">
        {title}
      </span>
      <div
        className="absolute right-2.5 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-200 shadow-lg"
        style={{ background: "oklch(0.65 0.19 145)" }}
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
  const GreenColor = "oklch(0.65 0.19 145)";
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
      className="group relative cursor-pointer rounded-[10px] p-3.5 transition-colors outline-none"
      style={{
        background: isActive ? "#252525" : "#1a1a1a",
        boxShadow: isActive ? `inset 0 0 0 1px ${GreenColor}` : "none",
      }}
    >
      <div
        className={`relative w-full aspect-square rounded-md mb-3 flex items-center justify-center text-5xl overflow-hidden ${!thumbnailUrl ? song.colorClass : ""}`}
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
        <div
          className="absolute bottom-1.5 right-1.5 w-9 h-9 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-1.5 group-hover:translate-y-0 transition-all duration-200 shadow-lg"
          style={{ background: GreenColor }}
          aria-hidden="true"
        >
          <Play
            size={16}
            fill="#000"
            stroke="none"
            className="ml-0.5"
            aria-hidden="true"
          />
        </div>
      </div>
      <div
        className="text-[13px] font-semibold truncate mb-0.5"
        style={{ color: isActive ? GreenColor : "#fff" }}
      >
        {song.title}
      </div>
      <div className="text-[11px] truncate" style={{ color: "#b3b3b3" }}>
        {song.artist}
      </div>
      <div className="flex items-center justify-between mt-1">
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
            color: isLiked ? GreenColor : "#888",
            background: "none",
            border: "none",
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
        <span className="text-[11px]" style={{ color: "#555" }}>
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
  const GreenColor = "oklch(0.65 0.19 145)";

  // Fetch top 3 suggestions when typing
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
        size={15}
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: focused ? GreenColor : "#555", zIndex: 1 }}
        aria-hidden="true"
      />
      <input
        data-ocid="search.input"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search songs, artists…"
        className="w-full rounded-full py-2 pl-8 pr-4 text-[13px] text-white placeholder:text-[#555] outline-none transition-colors"
        style={{
          background: "#252525",
          border: focused
            ? `1px solid ${GreenColor}40`
            : "1px solid transparent",
          fontFamily: "Figtree, sans-serif",
        }}
        onFocus={() => {
          setFocused(true);
          if (suggestions.length > 0) setShowDropdown(true);
        }}
        onBlur={() => setFocused(false)}
      />

      {/* Suggestions dropdown */}
      {showDropdown && value.trim() && (
        <div
          data-ocid="search.popover"
          className="absolute top-full left-0 right-0 mt-1.5 rounded-lg overflow-hidden z-50"
          style={{
            background: "#1e1e1e",
            boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
            border: "1px solid #2a2a2a",
          }}
        >
          {loadingSuggestions ? (
            <div className="flex items-center gap-2 px-3 py-2.5">
              <Loader2
                size={13}
                className="animate-spin"
                style={{ color: GreenColor }}
              />
              <span className="text-[12px]" style={{ color: "#888" }}>
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
                className="w-full flex items-center gap-2.5 px-3 py-2 transition-colors cursor-pointer text-left"
                style={{ background: "transparent", border: "none" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "#2a2a2a";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "transparent";
                }}
              >
                <img
                  src={item.snippet.thumbnails.medium.url}
                  alt=""
                  className="w-8 h-8 rounded object-cover flex-shrink-0"
                  style={{ background: "#333" }}
                />
                <div className="flex-1 min-w-0">
                  <div
                    className="text-[12px] font-medium truncate"
                    style={{ color: "#fff" }}
                  >
                    {item.snippet.title}
                  </div>
                  <div
                    className="text-[11px] truncate"
                    style={{ color: "#888" }}
                  >
                    {item.snippet.channelTitle}
                  </div>
                </div>
                <Play
                  size={11}
                  fill={GreenColor}
                  stroke="none"
                  style={{ color: GreenColor, flexShrink: 0 }}
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

  useEffect(() => {
    if (!query.trim()) {
      setYtItems([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const items = await searchYouTube(query);
        setYtItems(items);
      } catch (_e) {
        setError("Failed to fetch YouTube results. Check your API key.");
      } finally {
        setLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [query]);

  if (loading) {
    return (
      <div
        className="flex items-center justify-center py-16 gap-3"
        data-ocid="search.loading_state"
      >
        <Loader2
          size={22}
          className="animate-spin"
          style={{ color: "oklch(0.65 0.19 145)" }}
        />
        <span style={{ color: "#b3b3b3", fontSize: 14 }}>
          Searching YouTube…
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="text-center py-12"
        style={{ color: "#e05555" }}
        data-ocid="search.error_state"
      >
        {error}
      </div>
    );
  }

  if (ytItems.length === 0 && query.trim()) {
    return (
      <div
        className="text-center py-12"
        style={{ color: "#b3b3b3" }}
        data-ocid="search.empty_state"
      >
        No results found for &ldquo;{query}&rdquo;
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
        return (
          <SongCard
            key={song.id}
            song={song}
            index={i}
            isActive={currentSongId === song.id}
            isPlaying={isPlaying}
            isLiked={likedIds.has(song.id)}
            onPlay={() => onPlay(item.id.videoId, item.snippet.title)}
            onToggleLike={() => onToggleLike(song.id)}
            ocidPrefix="search"
            thumbnailUrl={item.snippet.thumbnails.medium.url}
          />
        );
      })}
    </div>
  );
}

function LocalSearchResults({
  query,
  songs: allSongs,
  currentIdx,
  isPlaying,
  likedIds,
  onPlay,
  onToggleLike,
}: {
  query: string;
  songs: Song[];
  currentIdx: number;
  isPlaying: boolean;
  likedIds: Set<string>;
  onPlay: (idx: number) => void;
  onToggleLike: (id: string) => void;
}) {
  const results = query.trim()
    ? allSongs.filter(
        (s) =>
          s.title.toLowerCase().includes(query.toLowerCase()) ||
          s.artist.toLowerCase().includes(query.toLowerCase()),
      )
    : allSongs;

  if (results.length === 0) {
    return (
      <div
        className="text-center py-12"
        style={{ color: "#b3b3b3" }}
        data-ocid="search.empty_state"
      >
        No songs found for &ldquo;{query}&rdquo;
      </div>
    );
  }

  return (
    <div
      className="grid gap-4"
      style={{ gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }}
      data-ocid="search.list"
    >
      {results.map((song) => {
        const idx = allSongs.findIndex((s) => s.id === song.id);
        return (
          <SongCard
            key={song.id}
            song={song}
            index={idx}
            isActive={currentIdx === idx}
            isPlaying={isPlaying}
            isLiked={likedIds.has(song.id)}
            onPlay={() => onPlay(idx)}
            onToggleLike={() => onToggleLike(song.id)}
            ocidPrefix="search"
          />
        );
      })}
    </div>
  );
}

export default function MainContent({
  activeView,
  songs,
  currentIdx,
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

  const currentSong = currentIdx >= 0 ? songs[currentIdx] : null;
  const currentSongId = currentSong?.id ?? null;

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
            isActive={currentIdx === globalIdx}
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

  return (
    <div
      className="main-scroll"
      style={{
        background:
          activeView === "home"
            ? "linear-gradient(180deg, #1a2e1a 0%, #111 280px)"
            : "#111",
      }}
    >
      {/* Top bar */}
      <div
        className="sticky top-0 z-10 flex items-center justify-between px-6 py-4"
        style={{
          background: "rgba(17,17,17,0.85)",
          backdropFilter: "blur(12px)",
        }}
      >
        <div className="flex items-center gap-2">
          <button
            type="button"
            data-ocid="topbar.back.button"
            aria-label="Go back"
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
            style={{
              background: "rgba(0,0,0,0.6)",
              border: "none",
              color: "#fff",
            }}
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </button>
          <button
            type="button"
            data-ocid="topbar.forward.button"
            aria-label="Go forward"
            className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer"
            style={{
              background: "rgba(0,0,0,0.6)",
              border: "none",
              color: "#fff",
            }}
          >
            <ChevronRight size={18} aria-hidden="true" />
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
          style={{ background: "rgba(0,0,0,0.6)", border: "none" }}
        >
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center"
            style={{ background: "oklch(0.65 0.19 145)" }}
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
        {activeView === "home" && (
          <>
            <motion.h1
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[28px] font-extrabold text-white mb-4 mt-1"
            >
              {getGreeting()}
            </motion.h1>
            <section className="mb-8">
              <div
                className="grid gap-2.5"
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
              <h2 className="text-[20px] font-bold text-white mb-4">
                Trending Now
              </h2>
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                }}
                data-ocid="trending.list"
              >
                {songs.slice(0, 6).map((song, i) => (
                  <SongCard
                    key={song.id}
                    song={song}
                    index={i}
                    isActive={currentIdx === i}
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
                <h2 className="text-[20px] font-bold text-white">
                  Recently Played
                </h2>
                <button
                  type="button"
                  data-ocid="recent.see_all.button"
                  onClick={() => onViewChange("recent")}
                  className="text-[12px] font-semibold cursor-pointer hover:underline"
                  style={{
                    color: "#b3b3b3",
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
                  style={{ color: "#b3b3b3" }}
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
                      isActive={currentIdx === idx}
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
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[24px] font-bold text-white mb-5 mt-1"
            >
              ❤️ Liked Songs
            </motion.h1>
            {likedSongs.length === 0 ? (
              <div
                className="text-[14px] mt-8"
                style={{ color: "#b3b3b3" }}
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
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[24px] font-bold text-white mb-5 mt-1"
            >
              🕐 Recently Played
            </motion.h1>
            {recentSongs.length === 0 ? (
              <div
                className="text-[14px] mt-8"
                style={{ color: "#b3b3b3" }}
                data-ocid="recent.empty_state"
              >
                Nothing played yet. Start listening!
              </div>
            ) : (
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                }}
                data-ocid="recent.list"
              >
                {recentSongs.map(({ song, idx }, i) => (
                  <SongCard
                    key={`${song.id}-${i}`}
                    song={song}
                    index={i}
                    isActive={currentIdx === idx}
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
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-[24px] font-bold text-white mb-5 mt-1"
            >
              🔍 Browse All
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
              <LocalSearchResults
                query={searchQuery}
                songs={songs}
                currentIdx={currentIdx}
                isPlaying={isPlaying}
                likedIds={likedIds}
                onPlay={onSongPlay}
                onToggleLike={onToggleLike}
              />
            )}
          </>
        )}
      </div>

      <footer
        className="px-6 py-4 text-center"
        style={{ borderTop: "1px solid #1a1a1a" }}
      >
        <p className="text-[11px]" style={{ color: "#555" }}>
          &copy; {new Date().getFullYear()}. Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(typeof window !== "undefined" ? window.location.hostname : "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white transition-colors"
            style={{ color: "oklch(0.65 0.19 145)" }}
          >
            caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
