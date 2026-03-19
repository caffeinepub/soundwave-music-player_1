import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Play,
  Search,
  X,
} from "lucide-react";
import { motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type ArtistPlaylist,
  type ArtistSong,
  FEATURED_ARTIST_PLAYLISTS,
} from "../data/artistPlaylists";
import { type Song, colorGradients, formatTime } from "../data/songs";

import {
  FallbackError,
  type YouTubeItem,
  searchYouTube,
} from "../utils/youtubeSearch";

type ActiveView = "home" | "search" | "liked" | "recent";

interface MainContentProps {
  activeView: ActiveView;
  songs: Song[];
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
const AccentPurple = "oklch(0.6 0.3 280)";
const SubtleColor = "#b3b3b3";
const MutedColor = "#6a6a6a";

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const BOLLYWOOD_ARTISTS = [
  {
    name: "Arijit Singh",
    topVideoId: "3USBFxVbNp4",
    searchQuery: "Arijit Singh best songs",
  },
  {
    name: "Shreya Ghoshal",
    topVideoId: "_LSkIX1BNYQ",
    searchQuery: "Shreya Ghoshal best songs",
  },
  {
    name: "Sonu Nigam",
    topVideoId: "dZBdWqc5gn4",
    searchQuery: "Sonu Nigam hits",
  },
  {
    name: "Armaan Malik",
    topVideoId: "2M5esPJDeVg",
    searchQuery: "Armaan Malik songs",
  },
  {
    name: "Neha Kakkar",
    topVideoId: "Qk9aJnrFi_Y",
    searchQuery: "Neha Kakkar hits",
  },
  {
    name: "KK",
    topVideoId: "fxqBStCPYBk",
    searchQuery: "KK singer best songs",
  },
  {
    name: "Atif Aslam",
    topVideoId: "xuR-GgZEMAs",
    searchQuery: "Atif Aslam songs",
  },
  {
    name: "Jubin Nautiyal",
    topVideoId: "D8BO5HXJLaU",
    searchQuery: "Jubin Nautiyal songs",
  },
  {
    name: "Mohit Chauhan",
    topVideoId: "8rJBYmWCeQ4",
    searchQuery: "Mohit Chauhan songs",
  },
  {
    name: "Sunidhi Chauhan",
    topVideoId: "7BDQZ9C9XBs",
    searchQuery: "Sunidhi Chauhan hits",
  },
].map((a) => ({
  ...a,
  image: `https://img.youtube.com/vi/${a.topVideoId}/hqdefault.jpg`,
}));

const HOLLYWOOD_ARTISTS = [
  {
    name: "Taylor Swift",
    topVideoId: "ApXoWvfEYVU",
    searchQuery: "Taylor Swift hits",
  },
  {
    name: "Ed Sheeran",
    topVideoId: "lp-EO5I60KA",
    searchQuery: "Ed Sheeran best songs",
  },
  {
    name: "Justin Bieber",
    topVideoId: "fRh_vgS2dFE",
    searchQuery: "Justin Bieber songs",
  },
  {
    name: "The Weeknd",
    topVideoId: "XXYlFuWEuKI",
    searchQuery: "The Weeknd hits",
  },
  {
    name: "Ariana Grande",
    topVideoId: "QYh6mYIJG2Y",
    searchQuery: "Ariana Grande songs",
  },
  { name: "Drake", topVideoId: "uxpDa-c-4Mc", searchQuery: "Drake best songs" },
  {
    name: "Billie Eilish",
    topVideoId: "H5v3kku4y6Q",
    searchQuery: "Billie Eilish songs",
  },
  {
    name: "Bruno Mars",
    topVideoId: "OPf0YbXqDm0",
    searchQuery: "Bruno Mars hits",
  },
  {
    name: "Dua Lipa",
    topVideoId: "oygrmJFkg68",
    searchQuery: "Dua Lipa songs",
  },
  {
    name: "Coldplay",
    topVideoId: "dvgZkm1xWPE",
    searchQuery: "Coldplay best songs",
  },
].map((a) => ({
  ...a,
  image: `https://img.youtube.com/vi/${a.topVideoId}/hqdefault.jpg`,
}));

// ── Hero Banner ──────────────────────────────────────────────────────────────
function HeroBanner({ onPlay }: { onPlay: () => void }) {
  const [imgSrc, setImgSrc] = useState(
    "https://img.youtube.com/vi/4NRXx6U8ABQ/hqdefault.jpg",
  );

  return (
    <div
      className="hero-banner relative w-full overflow-hidden rounded-2xl"
      style={{ height: "clamp(220px, 38vw, 420px)" }}
    >
      <img
        src={imgSrc}
        alt="The Weeknd - Blinding Lights"
        loading="lazy"
        onError={() => {
          console.warn("[HeroBanner] maxresdefault failed, trying hqdefault");
          if (imgSrc.includes("maxresdefault")) {
            setImgSrc("https://img.youtube.com/vi/4NRXx6U8ABQ/hqdefault.jpg");
          }
        }}
        className="hero-banner-img absolute inset-0 w-full h-full object-cover"
        style={{ transformOrigin: "center center" }}
      />
      {/* Gradient overlay */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(10,0,20,0.5) 50%, transparent 100%), linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)",
        }}
      />
      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
        }}
      />
      {/* Content */}
      <div className="absolute inset-0 flex flex-col justify-end p-8">
        <div
          className="text-[11px] font-bold uppercase tracking-[0.2em] mb-2"
          style={{ color: Accent }}
        >
          🎵 Featured Artist
        </div>
        <h1
          className="font-black text-white mb-1"
          style={{
            fontSize: "clamp(1.6rem, 4vw, 3rem)",
            letterSpacing: "-0.02em",
            lineHeight: 1.1,
            textShadow: "0 2px 20px rgba(0,0,0,0.8)",
          }}
        >
          Soundwave
        </h1>
        <p
          className="mb-5 font-medium"
          style={{
            color: SubtleColor,
            fontSize: "clamp(0.85rem, 1.5vw, 1rem)",
          }}
        >
          Premium Music Experience
        </p>
        <button
          type="button"
          data-ocid="hero.play.button"
          onClick={onPlay}
          className="flex items-center gap-2.5 rounded-full px-6 py-2.5 font-bold text-black text-[14px] w-fit transition-transform hover:scale-105 active:scale-95"
          style={{
            background: Accent,
            boxShadow: "0 0 28px rgba(29,185,84,0.4)",
          }}
        >
          <Play size={16} fill="#000" stroke="none" aria-hidden="true" />
          Play Now
        </button>
      </div>
    </div>
  );
}

// ── Artist image system ──────────────────────────────────────────────────────

// ── Artist Card ──────────────────────────────────────────────────────────────
function ArtistCard({
  name,
  onPlay,
}: {
  name: string;
  imageUrl?: string;
  onPlay: () => void;
}) {
  return (
    <button
      type="button"
      data-ocid="artist.card"
      onClick={onPlay}
      className="artist-card flex-shrink-0 rounded-xl overflow-hidden relative cursor-pointer"
      style={{
        width: "clamp(130px, 14vw, 180px)",
        aspectRatio: "1",
        border: "none",
        background: "#1a1a1a",
      }}
    >
      <img
        src={`https://source.unsplash.com/300x300/?${encodeURIComponent(name)},singer`}
        alt={name}
        className="artist-img"
        loading="lazy"
        onError={(e) => {
          const t = e.currentTarget;
          t.onerror = null;
          t.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=111&color=00ff88&size=300`;
          console.log("Artist Image fallback:", name);
        }}
        onLoad={() => console.log("Artist Image:", name)}
      />
      {/* Dark overlay + play */}
      <div
        className="artist-card-overlay absolute inset-0 flex flex-col items-center justify-center gap-2"
        style={{ background: "rgba(0,0,0,0.55)" }}
      >
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center"
          style={{ background: Accent }}
        >
          <Play size={18} fill="#000" stroke="none" aria-hidden="true" />
        </div>
      </div>
      {/* Name badge */}
      <div
        className="absolute bottom-0 left-0 right-0 px-2.5 pb-2.5 pt-6"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 100%)",
        }}
      >
        <p
          className="text-white font-semibold text-[12px] truncate"
          style={{ letterSpacing: "-0.01em" }}
        >
          {name}
        </p>
      </div>
      {/* Top Songs badge */}
      <div
        className="absolute top-2 left-2 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide"
        style={{
          background: "rgba(29,185,84,0.85)",
          color: "#000",
        }}
      >
        Top Songs
      </div>
    </button>
  );
}

// ── Horizontal scrollable row ─────────────────────────────────────────────────
function HorizontalRow({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const rowRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    if (!rowRef.current) return;
    rowRef.current.scrollBy({
      left: dir === "right" ? 300 : -300,
      behavior: "smooth",
    });
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4 px-1">
        <h2
          className="font-bold text-white"
          style={{
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            letterSpacing: "-0.01em",
          }}
        >
          {title}
        </h2>
        <div className="flex gap-1">
          <button
            type="button"
            data-ocid="row.pagination_prev"
            onClick={() => scroll("left")}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: SubtleColor,
              border: "none",
            }}
          >
            <ChevronLeft size={14} aria-hidden="true" />
          </button>
          <button
            type="button"
            data-ocid="row.pagination_next"
            onClick={() => scroll("right")}
            className="w-7 h-7 rounded-full flex items-center justify-center transition-colors"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: SubtleColor,
              border: "none",
            }}
          >
            <ChevronRight size={14} aria-hidden="true" />
          </button>
        </div>
      </div>
      <div
        ref={rowRef}
        className="flex gap-3 overflow-x-auto hide-scrollbar pb-2"
        style={{ scrollSnapType: "x mandatory" }}
      >
        {children}
      </div>
    </div>
  );
}

// ── Horizontal song card (small) ─────────────────────────────────────────────
function HorizSongCard({
  song,
  isActive,
  isPlaying,
  onPlay,
}: {
  song: Song;
  isActive: boolean;
  isPlaying: boolean;
  onPlay: () => void;
}) {
  return (
    <button
      type="button"
      data-ocid="song.card"
      onClick={onPlay}
      className="music-card flex-shrink-0 flex flex-col rounded-xl overflow-hidden cursor-pointer"
      style={{
        width: "clamp(130px, 14vw, 180px)",
        background: isActive
          ? "rgba(29,185,84,0.12)"
          : "rgba(255,255,255,0.04)",
        border: isActive
          ? "1px solid rgba(29,185,84,0.3)"
          : "1px solid rgba(255,255,255,0.06)",
        scrollSnapAlign: "start",
      }}
    >
      {/* Art */}
      <div
        className={`w-full flex items-center justify-center text-3xl relative overflow-hidden ${song.colorClass}`}
        style={{ aspectRatio: "1" }}
      >
        {isActive && isPlaying ? (
          <div className="absolute inset-0 bg-black/30 flex items-end justify-center gap-0.5 pb-2">
            <div className="eq-bar" />
            <div className="eq-bar" />
            <div className="eq-bar" />
          </div>
        ) : (
          <span aria-hidden="true">{song.emoji}</span>
        )}
        {/* Hover play overlay */}
        <div
          className="play-overlay absolute inset-0 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)" }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{ background: Accent }}
          >
            <Play size={16} fill="#000" stroke="none" aria-hidden="true" />
          </div>
        </div>
      </div>
      {/* Meta */}
      <div className="p-2.5">
        <p
          className="font-semibold text-[12px] truncate"
          style={{ color: isActive ? Accent : "#fff" }}
        >
          {song.title}
        </p>
        <p
          className="text-[10px] truncate mt-0.5"
          style={{ color: MutedColor }}
        >
          {song.artist}
        </p>
        <p className="text-[10px] mt-1" style={{ color: MutedColor }}>
          {formatTime(song.duration)}
        </p>
      </div>
    </button>
  );
}

// ── Song Card (grid view) ─────────────────────────────────────────────────────
function SongCard({
  song,
  index,
  isActive,
  isPlaying,
  isLiked,
  onPlay,
  onToggleLike,
}: {
  song: Song;
  index: number;
  isActive: boolean;
  isPlaying: boolean;
  isLiked: boolean;
  onPlay: () => void;
  onToggleLike: () => void;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      type="button"
      data-ocid={`song.item.${index + 1}`}
      className="music-card flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer group w-full text-left"
      style={{
        background: isActive
          ? "rgba(29,185,84,0.1)"
          : hovered
            ? "rgba(255,255,255,0.06)"
            : "transparent",
        border: isActive
          ? "1px solid rgba(29,185,84,0.2)"
          : "1px solid transparent",
      }}
      onClick={onPlay}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Index/playing indicator */}
      <div
        className="w-5 flex-shrink-0 flex items-center justify-center text-[12px] font-medium"
        style={{ color: isActive ? Accent : MutedColor }}
      >
        {isActive && isPlaying ? (
          <div className="flex items-end gap-0.5 h-4">
            <div className="eq-bar" />
            <div className="eq-bar" />
            <div className="eq-bar" />
          </div>
        ) : (
          <span>{index + 1}</span>
        )}
      </div>

      {/* Art */}
      <div
        className={`w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center text-lg relative overflow-hidden ${song.colorClass}`}
      >
        <span aria-hidden="true">{song.emoji}</span>
      </div>

      {/* Meta */}
      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-semibold truncate"
          style={{ color: isActive ? Accent : "#fff" }}
        >
          {song.title}
        </p>
        <p
          className="text-[11px] truncate mt-0.5"
          style={{ color: MutedColor }}
        >
          {song.artist}
        </p>
      </div>

      {/* Duration + like */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <button
          type="button"
          data-ocid={`song.like.button.${index + 1}`}
          onClick={(e) => {
            e.stopPropagation();
            onToggleLike();
          }}
          className="p-1"
          style={{
            color: isLiked ? Accent : "transparent",
            opacity: isLiked || hovered ? 1 : 0,
            background: "none",
            border: "none",
            transition: "color 0.2s ease, opacity 0.2s ease",
          }}
          aria-label={isLiked ? "Unlike" : "Like"}
        >
          <svg
            aria-hidden="true"
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill={isLiked ? "currentColor" : "none"}
            stroke={isLiked ? "currentColor" : SubtleColor}
            strokeWidth="2"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
        </button>
        <span className="text-[11px] font-medium" style={{ color: MutedColor }}>
          {formatTime(song.duration)}
        </span>
      </div>
    </button>
  );
}

// ── YouTube search result card ────────────────────────────────────────────────
function YTResultCard({
  item,
  isActive,
  isPlaying,
  index,
  onPlay,
}: {
  item: YouTubeItem;
  isActive: boolean;
  isPlaying: boolean;
  index: number;
  onPlay: () => void;
}) {
  const [imgErr, setImgErr] = useState(false);

  return (
    <button
      type="button"
      data-ocid={`search.result.item.${index + 1}`}
      onClick={onPlay}
      className="music-card flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer w-full text-left"
      style={{
        background: isActive ? "rgba(29,185,84,0.1)" : "rgba(255,255,255,0.03)",
        border: isActive
          ? "1px solid rgba(29,185,84,0.25)"
          : "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div
        className="flex-shrink-0 rounded-lg overflow-hidden relative"
        style={{ width: 52, height: 52 }}
      >
        {imgErr ? (
          <div
            className="w-full h-full flex items-center justify-center text-xl"
            style={{ background: "#1a1a1a" }}
          >
            🎬
          </div>
        ) : (
          <img
            src={item.snippet.thumbnails.medium.url}
            alt={item.snippet.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.warn(
                "[SearchResult] Thumbnail failed:",
                (e.target as HTMLImageElement).src,
              );
              setImgErr(true);
            }}
          />
        )}
        {isActive && isPlaying && (
          <div className="absolute inset-0 bg-black/50 flex items-end justify-center gap-0.5 pb-1">
            <div className="eq-bar" />
            <div className="eq-bar" />
            <div className="eq-bar" />
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p
          className="text-[13px] font-semibold truncate"
          style={{ color: isActive ? Accent : "#fff" }}
        >
          {item.snippet.title}
        </p>
        <p
          className="text-[11px] truncate mt-0.5"
          style={{ color: MutedColor }}
        >
          {item.snippet.channelTitle}
        </p>
      </div>
      <div
        className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center"
        style={{
          background: isActive ? Accent : "rgba(255,255,255,0.08)",
        }}
      >
        <Play
          size={13}
          fill={isActive ? "#000" : "#fff"}
          stroke="none"
          aria-hidden="true"
        />
      </div>
    </button>
  );
}

// ── Artist playlist section ───────────────────────────────────────────────────
function FeaturedArtistCard({
  playlist,
  onPlayAll,
  onPlaySong,
  currentSongId,
  isPlaying,
}: {
  playlist: ArtistPlaylist;
  onPlayAll: (songs: ArtistSong[]) => void;
  onPlaySong: (song: ArtistSong) => void;
  currentSongId: string | null;
  isPlaying: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div
      className="flex-shrink-0 rounded-2xl overflow-hidden cursor-pointer"
      style={{
        width: expanded
          ? "clamp(280px, 30vw, 360px)"
          : "clamp(160px, 18vw, 220px)",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.07)",
        transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)",
        scrollSnapAlign: "start",
      }}
    >
      {/* Card header with image */}
      <div
        className="relative overflow-hidden"
        style={{
          aspectRatio: expanded ? "16/7" : "1",
          transition: "aspect-ratio 0.35s",
        }}
      >
        <img
          src={`https://source.unsplash.com/300x300/?${encodeURIComponent(playlist.name)},singer`}
          alt={playlist.name}
          className="artist-img w-full h-full object-cover"
          loading="lazy"
          style={{ background: "#111", minHeight: "100px" }}
          onError={(e) => {
            const t = e.currentTarget;
            t.onerror = null;
            t.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(playlist.name)}&background=111&color=00ff88&size=300`;
            console.log("Artist Image fallback:", playlist.name);
          }}
          onLoad={() => console.log("Artist Image:", playlist.name)}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.1) 60%)",
          }}
        />
        {/* Name + buttons */}
        <div className="absolute bottom-0 left-0 right-0 p-3 flex items-end justify-between">
          <div>
            <p
              className="font-bold text-white"
              style={{
                fontSize: "clamp(0.85rem, 1.5vw, 1rem)",
                letterSpacing: "-0.01em",
              }}
            >
              {playlist.name}
            </p>
            <p className="text-[10px] mt-0.5" style={{ color: SubtleColor }}>
              {playlist.topSongs.length + playlist.popularTracks.length} songs
            </p>
          </div>
          <div className="flex gap-1.5">
            <button
              type="button"
              data-ocid="artist.play.button"
              onClick={(e) => {
                e.stopPropagation();
                onPlayAll([...playlist.topSongs, ...playlist.popularTracks]);
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{ background: Accent }}
            >
              <Play size={14} fill="#000" stroke="none" aria-hidden="true" />
            </button>
            <button
              type="button"
              data-ocid="artist.expand.button"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded((v) => !v);
              }}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-transform hover:scale-110"
              style={{
                background: expanded
                  ? "rgba(29,185,84,0.2)"
                  : "rgba(255,255,255,0.1)",
                border: expanded
                  ? "1px solid rgba(29,185,84,0.4)"
                  : "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <ChevronRight
                size={14}
                style={{
                  color: expanded ? Accent : SubtleColor,
                  transform: expanded ? "rotate(180deg)" : "none",
                  transition: "transform 0.3s",
                }}
                aria-hidden="true"
              />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded song list */}
      {expanded && (
        <div className="p-3 space-y-0.5">
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-2"
            style={{ color: MutedColor }}
          >
            Top Songs
          </p>
          {playlist.topSongs.map((s, i) => {
            const songId = `yt-${s.videoId}`;
            const active = currentSongId === songId;
            return (
              <button
                key={s.videoId}
                type="button"
                data-ocid={`artist.top_song.item.${i + 1}`}
                onClick={() => onPlaySong(s)}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-colors hover:bg-white/5"
                style={{ border: "none", background: "transparent" }}
              >
                <span
                  className="text-[11px] w-4 text-center flex-shrink-0 font-medium"
                  style={{ color: active ? Accent : MutedColor }}
                >
                  {active && isPlaying ? "▶" : i + 1}
                </span>
                <img
                  src={s.thumbnail}
                  alt={s.title}
                  className="w-7 h-7 rounded object-cover flex-shrink-0"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    console.warn(
                      `[SongThumbnail] Image failed for "${s.title}": ${img.src}`,
                    );
                    if (img.src.includes("maxresdefault")) {
                      img.src = s.thumbnail.replace(
                        "maxresdefault",
                        "hqdefault",
                      );
                    } else {
                      img.style.display = "none";
                      const parent = img.parentElement;
                      if (parent && !parent.querySelector(".thumb-fallback")) {
                        const fb = document.createElement("div");
                        fb.className = "thumb-fallback";
                        fb.style.cssText =
                          "width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1a0a2e,#0a0a1a);font-size:1.2rem;border-radius:6px;";
                        fb.textContent = "🎵";
                        parent.appendChild(fb);
                      }
                    }
                  }}
                />
                <span
                  className="text-[12px] font-medium truncate"
                  style={{ color: active ? Accent : "#fff" }}
                >
                  {s.title}
                </span>
              </button>
            );
          })}
          <p
            className="text-[10px] font-bold uppercase tracking-widest mt-3 mb-2"
            style={{ color: MutedColor }}
          >
            Popular Tracks
          </p>
          {playlist.popularTracks.map((s, i) => {
            const songId = `yt-${s.videoId}`;
            const active = currentSongId === songId;
            return (
              <button
                key={s.videoId}
                type="button"
                data-ocid={`artist.popular_track.item.${i + 1}`}
                onClick={() => onPlaySong(s)}
                className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-left transition-colors hover:bg-white/5"
                style={{ border: "none", background: "transparent" }}
              >
                <span
                  className="text-[11px] w-4 text-center flex-shrink-0 font-medium"
                  style={{ color: active ? Accent : MutedColor }}
                >
                  {active && isPlaying ? "▶" : i + 1}
                </span>
                <img
                  src={s.thumbnail}
                  alt={s.title}
                  className="w-7 h-7 rounded object-cover flex-shrink-0"
                  onError={(e) => {
                    const img = e.target as HTMLImageElement;
                    console.warn(
                      `[SongThumbnail] Image failed for "${s.title}": ${img.src}`,
                    );
                    if (img.src.includes("maxresdefault")) {
                      img.src = s.thumbnail.replace(
                        "maxresdefault",
                        "hqdefault",
                      );
                    } else {
                      img.style.display = "none";
                      const parent = img.parentElement;
                      if (parent && !parent.querySelector(".thumb-fallback")) {
                        const fb = document.createElement("div");
                        fb.className = "thumb-fallback";
                        fb.style.cssText =
                          "width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,#1a0a2e,#0a0a1a);font-size:1.2rem;border-radius:6px;";
                        fb.textContent = "🎵";
                        parent.appendChild(fb);
                      }
                    }
                  }}
                />
                <span
                  className="text-[12px] font-medium truncate"
                  style={{ color: active ? Accent : "#fff" }}
                >
                  {s.title}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Search Input (with dropdown suggestions) ──────────────────────────────────
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

  useEffect(() => {
    if (!value.trim() || value.trim().length < 3) {
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
    }, 300);

    return () => clearTimeout(timer);
  }, [value]);

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
        onChange={(e) => onChange(e.target.value)}
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
                data-ocid="search.suggestion.button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSuggestionClick(item);
                }}
                className="w-full flex items-center gap-3 px-3.5 py-2.5 transition-colors"
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#fff",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background =
                    "rgba(255,255,255,0.05)";
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
                  aria-hidden="true"
                  onError={(e) => {
                    console.warn(
                      "[SearchResult] Thumbnail failed:",
                      (e.target as HTMLImageElement).src,
                    );
                    (e.target as HTMLImageElement).style.display = "none";
                  }}
                />
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-[12px] font-medium truncate">
                    {item.snippet.title}
                  </p>
                  <p
                    className="text-[10px] truncate"
                    style={{ color: MutedColor }}
                  >
                    {item.snippet.channelTitle}
                  </p>
                </div>
                <Play
                  size={10}
                  className="flex-shrink-0"
                  style={{ color: MutedColor }}
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

// ── YouTube search results section ────────────────────────────────────────────
function YouTubeSearchResults({
  query,
  currentSongId,
  isPlaying,
  onPlay,
}: {
  query: string;
  currentSongId: string | null;
  isPlaying: boolean;
  onPlay: (item: YouTubeItem) => void;
}) {
  const [ytItems, setYtItems] = useState<YouTubeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fallbackUrl, setFallbackUrl] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(async (q: string) => {
    setLoading(true);
    setError(null);
    setFallbackUrl(null);
    try {
      const items = await searchYouTube(q);
      setYtItems(items);
      if (items.length === 0) setError("No YouTube results found");
    } catch (e) {
      if (e instanceof FallbackError) {
        setFallbackUrl(e.fallbackUrl);
        setError("Search temporarily unavailable");
      } else {
        setError(e instanceof Error ? e.message : "Search failed");
      }
      setYtItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 3) {
      setYtItems([]);
      setError(null);
      setLoading(false);
      return;
    }
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => runSearch(q), 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, runSearch]);

  if (query.trim().length < 3) {
    return (
      <div
        data-ocid="search.empty_state"
        className="flex flex-col items-center justify-center py-16 gap-3"
      >
        <Search size={48} style={{ color: MutedColor }} aria-hidden="true" />
        <p className="text-[15px] font-semibold" style={{ color: SubtleColor }}>
          Search for music
        </p>
        <p className="text-[13px]" style={{ color: MutedColor }}>
          Type at least 3 characters to search YouTube
        </p>
      </div>
    );
  }

  if (loading) {
    return (
      <div data-ocid="search.loading_state" className="flex flex-col gap-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-2.5">
            <Skeleton className="w-[52px] h-[52px] rounded-lg flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div
        data-ocid="search.error_state"
        className="flex flex-col items-center justify-center py-12 gap-4"
      >
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
          style={{ background: "rgba(255,60,60,0.1)" }}
        >
          ⚠️
        </div>
        <div className="text-center">
          <p
            className="text-[15px] font-semibold mb-1"
            style={{ color: SubtleColor }}
          >
            {error}
          </p>
          {fallbackUrl ? (
            <a
              href={fallbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[13px] underline"
              style={{ color: AccentPurple }}
            >
              View results on YouTube →
            </a>
          ) : (
            <button
              type="button"
              data-ocid="search.retry.button"
              onClick={() => runSearch(query.trim())}
              className="text-[13px] px-4 py-1.5 rounded-full"
              style={{
                background: "rgba(255,255,255,0.1)",
                color: SubtleColor,
                border: "none",
              }}
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div data-ocid="search.list" className="flex flex-col gap-2">
      {ytItems.map((item, i) => (
        <YTResultCard
          key={item.id.videoId}
          item={item}
          isActive={currentSongId === `yt-${item.id.videoId}`}
          isPlaying={isPlaying}
          index={i}
          onPlay={() => onPlay(item)}
        />
      ))}
    </div>
  );
}

// ── Main Content ──────────────────────────────────────────────────────────────
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
  // Preload artist images on mount
  useEffect(() => {
    const allNames = [
      ...BOLLYWOOD_ARTISTS.map((a) => a.name),
      "Taylor Swift",
      "Ed Sheeran",
      "The Weeknd",
      "Justin Bieber",
      "Billie Eilish",
      "Ariana Grande",
      "Drake",
      "Bruno Mars",
      "Dua Lipa",
      "Coldplay",
    ];
    for (const n of allNames) {
      const img = new window.Image();
      img.src = `https://source.unsplash.com/300x300/?${encodeURIComponent(n)},singer`;
    }
  }, []);

  const likedSongs = songs.filter((s) => likedIds.has(s.id));
  const recentSongs = recentIds
    .map((idx) => songs[idx])
    .filter(Boolean) as Song[];

  const renderCards = (list: Song[]) => (
    <div className="flex flex-col gap-1">
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
          />
        );
      })}
    </div>
  );

  const handleSuggestionClick = (song: Song) => {
    onPlayYouTubeSong(song);
    onViewChange("search");
  };

  const handleYTResultPlay = (item: YouTubeItem) => {
    onPlayYT(item.id.videoId, item.snippet.title);
  };

  const handleFeaturedPlayAll = (artistSongs: ArtistSong[]) => {
    if (artistSongs.length > 0) {
      const first = artistSongs[0];
      onPlayYT(first.videoId, first.title);
    }
  };

  const handleFeaturedPlaySong = (s: ArtistSong) => {
    onPlayYT(s.videoId, s.title);
  };

  const bgGradient =
    activeView === "home"
      ? "linear-gradient(to bottom, #1a0a2e 0%, #0a0a0f 300px)"
      : "#0a0a0f";

  return (
    <main
      className="main-scroll"
      style={{ background: bgGradient }}
      data-ocid="main.section"
    >
      {/* Top bar */}
      <div
        className="sticky top-0 z-30 flex items-center gap-3 px-6 py-3"
        style={{
          background: "rgba(10,10,15,0.88)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <h2
          className="font-bold text-white text-[15px] flex-shrink-0"
          style={{ letterSpacing: "-0.01em" }}
        >
          {activeView === "home" && getGreeting()}
          {activeView === "search" && "Search"}
          {activeView === "liked" && "Liked Songs"}
          {activeView === "recent" && "Recently Played"}
        </h2>
        <SearchInput
          value={searchQuery}
          onChange={onSearchChange}
          onSuggestionClick={handleSuggestionClick}
        />
        {searchQuery && (
          <button
            type="button"
            data-ocid="search.clear.button"
            onClick={() => onSearchChange("")}
            className="flex-shrink-0 p-1.5 rounded-full"
            style={{
              background: "rgba(255,255,255,0.08)",
              color: SubtleColor,
              border: "none",
            }}
            aria-label="Clear search"
          >
            <X size={13} aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Content */}
      <motion.div
        key={activeView}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.28 }}
        className="px-6 pt-5"
      >
        {/* ── SEARCH ── */}
        {activeView === "search" && (
          <YouTubeSearchResults
            query={searchQuery}
            currentSongId={currentSongId}
            isPlaying={isPlaying}
            onPlay={handleYTResultPlay}
          />
        )}

        {/* ── HOME ── */}
        {activeView === "home" && (
          <>
            {/* Hero banner */}
            <div className="mb-8">
              <HeroBanner
                onPlay={() => {
                  const weeknd = FEATURED_ARTIST_PLAYLISTS.find(
                    (a) => a.id === "the-weeknd",
                  );
                  if (weeknd) handleFeaturedPlayAll(weeknd.topSongs);
                }}
              />
            </div>

            {/* Featured Artist Playlists */}
            <HorizontalRow title="Featured Artists">
              {FEATURED_ARTIST_PLAYLISTS.map((pl) => (
                <FeaturedArtistCard
                  key={pl.id}
                  playlist={pl}
                  onPlayAll={handleFeaturedPlayAll}
                  onPlaySong={handleFeaturedPlaySong}
                  currentSongId={currentSongId}
                  isPlaying={isPlaying}
                />
              ))}
            </HorizontalRow>

            {/* Trending Now (local songs) */}
            <HorizontalRow title="Trending Now">
              {songs.slice(0, 8).map((song, i) => (
                <HorizSongCard
                  key={song.id}
                  song={song}
                  isActive={currentSongId === song.id}
                  isPlaying={isPlaying}
                  onPlay={() => onSongPlay(i)}
                />
              ))}
            </HorizontalRow>

            {/* Top Bollywood Artists */}
            <HorizontalRow title="Top Bollywood Artists">
              {BOLLYWOOD_ARTISTS.map((a) => (
                <ArtistCard
                  key={a.name}
                  name={a.name}
                  imageUrl={a.image}
                  onPlay={() => {
                    onSearchChange(a.searchQuery);
                    onViewChange("search");
                  }}
                />
              ))}
            </HorizontalRow>

            {/* Top Global Artists */}
            <HorizontalRow title="Top Global Artists">
              {HOLLYWOOD_ARTISTS.map((a) => (
                <ArtistCard
                  key={a.name}
                  name={a.name}
                  imageUrl={a.image}
                  onPlay={() => {
                    onSearchChange(a.searchQuery);
                    onViewChange("search");
                  }}
                />
              ))}
            </HorizontalRow>

            {/* Recently Played */}
            {recentSongs.length > 0 && (
              <HorizontalRow title="Recently Played">
                {recentSongs.map((song) => (
                  <HorizSongCard
                    key={song.id}
                    song={song}
                    isActive={currentSongId === song.id}
                    isPlaying={isPlaying}
                    onPlay={() => {
                      const globalIdx = songs.findIndex(
                        (s) => s.id === song.id,
                      );
                      onSongPlay(globalIdx);
                    }}
                  />
                ))}
              </HorizontalRow>
            )}
          </>
        )}

        {/* ── LIKED SONGS ── */}
        {activeView === "liked" &&
          (likedSongs.length === 0 ? (
            <div
              data-ocid="liked.empty_state"
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <div className="text-5xl">❤️</div>
              <p
                className="text-[16px] font-semibold"
                style={{ color: SubtleColor }}
              >
                No liked songs yet
              </p>
              <p className="text-[13px]" style={{ color: MutedColor }}>
                Hit the heart on any song to save it here
              </p>
            </div>
          ) : (
            renderCards(likedSongs)
          ))}

        {/* ── RECENTLY PLAYED ── */}
        {activeView === "recent" &&
          (recentSongs.length === 0 ? (
            <div
              data-ocid="recent.empty_state"
              className="flex flex-col items-center justify-center py-20 gap-4"
            >
              <div className="text-5xl">🕐</div>
              <p
                className="text-[16px] font-semibold"
                style={{ color: SubtleColor }}
              >
                Nothing played yet
              </p>
              <p className="text-[13px]" style={{ color: MutedColor }}>
                Start listening to see your history here
              </p>
            </div>
          ) : (
            renderCards(recentSongs)
          ))}
      </motion.div>

      {/* Footer */}
      <footer className="px-6 py-8 mt-4">
        <p className="text-[11px] text-center" style={{ color: MutedColor }}>
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline"
            style={{ color: MutedColor }}
          >
            Built with ❤️ using caffeine.ai
          </a>
        </p>
      </footer>
    </main>
  );
}
