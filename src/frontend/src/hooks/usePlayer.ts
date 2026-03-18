import { useCallback, useEffect, useRef, useState } from "react";
import { type Song, songs } from "../data/songs";

export type RepeatMode = "none" | "one" | "all";

// Extend window with YouTube IFrame API types
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        options: {
          width?: number | string;
          height?: number | string;
          videoId?: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (event: { target: YTPlayer }) => void;
            onStateChange?: (event: { data: number }) => void;
            onError?: () => void;
          };
        },
      ) => YTPlayer;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface YTPlayer {
  playVideo(): void;
  pauseVideo(): void;
  stopVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  setVolume(volume: number): void;
  mute(): void;
  unMute(): void;
  isMuted(): boolean;
  getVolume(): number;
  getCurrentTime(): number;
  getDuration(): number;
  getPlayerState(): number;
  loadVideoById(videoId: string): void;
  cueVideoById(videoId: string): void;
  destroy(): void;
}

export interface PlayerState {
  currentIdx: number;
  isPlaying: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  volume: number;
  progress: number; // 0-1
  currentTime: number; // seconds
  duration: number; // seconds
  likedIds: Set<string>;
  recentIds: number[]; // indices into songs array
  toastMsg: string;
  isCurrentLiked: boolean;
  currentSong: Song | null;
  showToast: (msg: string) => void;
  playTrack: (idx: number) => void;
  playExternalSong: (song: Song) => void;
  playYT: (videoId: string, title: string) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleLike: () => void;
  seek: (pct: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
}

const LS_LIKED = "sw_liked";
const LS_RECENT = "sw_recent";

function loadLiked(): Set<string> {
  try {
    return new Set(JSON.parse(localStorage.getItem(LS_LIKED) || "[]"));
  } catch {
    return new Set();
  }
}

function loadRecent(): number[] {
  try {
    return JSON.parse(localStorage.getItem(LS_RECENT) || "[]");
  } catch {
    return [];
  }
}

export function usePlayer(): PlayerState {
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [externalSong, setExternalSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("none");
  const [volume, setVolumeState] = useState(0.7);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [likedIds, setLikedIds] = useState<Set<string>>(loadLiked);
  const [recentIds, setRecentIds] = useState<number[]>(loadRecent);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  // HTML5 Audio for local SoundHelix tracks
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // YouTube IFrame Player instance
  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const ytReadyRef = useRef(false);
  // Track which player is currently active
  const activePlayerRef = useRef<"html5" | "youtube">("html5");

  // Progress polling interval for YouTube (no native events)
  const ytIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Refs for stale-closure-safe access
  const currentIdxRef = useRef(currentIdx);
  currentIdxRef.current = currentIdx;
  const externalSongRef = useRef(externalSong);
  externalSongRef.current = externalSong;
  const shuffleRef = useRef(isShuffle);
  shuffleRef.current = isShuffle;
  const repeatRef = useRef(repeatMode);
  repeatRef.current = repeatMode;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 2000);
  }, []);

  // ── Helper: advance to next/handle repeat ──────────────────────────────────
  const handleTrackEnd = useCallback(() => {
    const rm = repeatRef.current;
    const sh = shuffleRef.current;
    const idx = currentIdxRef.current;

    // If external song was playing, just stop
    if (externalSongRef.current !== null) {
      setExternalSong(null);
      setIsPlaying(false);
      setProgress(0);
      setCurrentTime(0);
      return;
    }

    if (rm === "one") {
      playTrackInternalRef.current(idx);
    } else if (rm === "all" || sh) {
      const next = sh
        ? Math.floor(Math.random() * songs.length)
        : (idx + 1) % songs.length;
      playTrackInternalRef.current(next);
    } else {
      const next = idx + 1;
      if (next < songs.length) {
        playTrackInternalRef.current(next);
      } else {
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Forward ref so handleTrackEnd can call playTrackInternal without circular dep
  const playTrackInternalRef = useRef<(idx: number) => void>(() => {});

  // ── Initialise HTML5 Audio ─────────────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.volume = volumeRef.current;
    audioRef.current = audio;

    const onTimeUpdate = () => {
      if (audio.duration) {
        setCurrentTime(audio.currentTime);
        setProgress(audio.currentTime / audio.duration);
      }
    };
    const onLoadedMetadata = () => setDuration(audio.duration || 0);
    const onEnded = () => {
      if (activePlayerRef.current === "html5") handleTrackEnd();
    };

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
    };
  }, [handleTrackEnd]);

  // ── Initialise YouTube IFrame API ──────────────────────────────────────────
  useEffect(() => {
    const initYT = () => {
      if (!document.getElementById("yt-player")) return;
      ytPlayerRef.current = new window.YT.Player("yt-player", {
        height: "0",
        width: "0",
        videoId: "",
        playerVars: {
          autoplay: 0,
          controls: 0,
        },
        events: {
          onReady: () => {
            ytReadyRef.current = true;
            ytPlayerRef.current?.setVolume(Math.round(volumeRef.current * 100));
          },
          onStateChange: (event) => {
            if (!window.YT) return;
            const { PLAYING, PAUSED, ENDED } = window.YT.PlayerState;
            if (event.data === PLAYING) {
              setIsPlaying(true);
              if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
              ytIntervalRef.current = setInterval(() => {
                const yt = ytPlayerRef.current;
                if (!yt) return;
                const ct = yt.getCurrentTime();
                const dur = yt.getDuration();
                if (dur) {
                  setCurrentTime(ct);
                  setDuration(dur);
                  setProgress(ct / dur);
                }
              }, 500);
            } else if (event.data === PAUSED) {
              setIsPlaying(false);
              if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
            } else if (event.data === ENDED) {
              if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
              if (activePlayerRef.current === "youtube") handleTrackEnd();
            }
          },
          onError: () => {
            // Fallback to local src if available
            const idx = currentIdxRef.current;
            if (idx >= 0 && songs[idx].src) {
              activePlayerRef.current = "html5";
              const audio = audioRef.current;
              if (audio) {
                audio.src = songs[idx].src;
                audio.load();
                audio.play().catch(() => setIsPlaying(false));
              }
            } else {
              setIsPlaying(false);
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      initYT();
    } else {
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        initYT();
      };
    }

    return () => {
      if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
    };
  }, [handleTrackEnd]);

  // ── Core play logic ────────────────────────────────────────────────────────
  const playTrackInternal = useCallback(
    (idx: number) => {
      if (idx < 0 || idx >= songs.length) return;
      const song = songs[idx];

      setCurrentIdx(idx);
      setExternalSong(null);
      setProgress(0);
      setCurrentTime(0);

      setRecentIds((prev) => {
        const next = [idx, ...prev.filter((x) => x !== idx)].slice(0, 8);
        localStorage.setItem(LS_RECENT, JSON.stringify(next));
        return next;
      });

      if (song.youtubeId) {
        activePlayerRef.current = "youtube";
        const audio = audioRef.current;
        if (audio) {
          audio.pause();
          audio.src = "";
        }
        if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);

        const loadYT = () => {
          const yt = ytPlayerRef.current;
          if (!yt) return;
          yt.loadVideoById(song.youtubeId as string);
          yt.setVolume(Math.round(volumeRef.current * 100));
        };

        if (ytReadyRef.current && ytPlayerRef.current) {
          loadYT();
        } else {
          const prev = window.onYouTubeIframeAPIReady;
          window.onYouTubeIframeAPIReady = () => {
            if (prev) prev();
            setTimeout(loadYT, 200);
          };
        }

        setDuration(song.duration);
        setIsPlaying(true);
      } else {
        activePlayerRef.current = "html5";
        if (ytPlayerRef.current && ytReadyRef.current) {
          try {
            ytPlayerRef.current.stopVideo();
          } catch (_) {}
        }
        if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);

        const audio = audioRef.current;
        if (!audio) return;
        audio.src = song.src;
        audio.load();
        audio.volume = volumeRef.current;
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));

        setDuration(song.duration);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  playTrackInternalRef.current = playTrackInternal;

  // ── Play external (YouTube search result) song ─────────────────────────────
  const playExternalSong = useCallback(
    (song: Song) => {
      setExternalSong(song);
      setCurrentIdx(-1);
      setProgress(0);
      setCurrentTime(0);

      if (song.youtubeId) {
        activePlayerRef.current = "youtube";
        const audio = audioRef.current;
        if (audio) {
          audio.pause();
          audio.src = "";
        }
        if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);

        const loadYT = () => {
          const yt = ytPlayerRef.current;
          if (!yt) return;
          yt.loadVideoById(song.youtubeId as string);
          yt.setVolume(Math.round(volumeRef.current * 100));
        };

        if (ytReadyRef.current && ytPlayerRef.current) {
          loadYT();
        } else {
          const prev = window.onYouTubeIframeAPIReady;
          window.onYouTubeIframeAPIReady = () => {
            if (prev) prev();
            setTimeout(loadYT, 200);
          };
        }

        setDuration(song.duration);
        setIsPlaying(true);
      } else if (song.src) {
        activePlayerRef.current = "html5";
        if (ytPlayerRef.current && ytReadyRef.current) {
          try {
            ytPlayerRef.current.stopVideo();
          } catch (_) {}
        }
        if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);

        const audio = audioRef.current;
        if (!audio) return;
        audio.src = song.src;
        audio.load();
        audio.volume = volumeRef.current;
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => setIsPlaying(false));

        setDuration(song.duration);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // ── playYT: play a YouTube video by ID and title directly ──────────────────
  const playYT = useCallback(
    (videoId: string, title: string) => {
      const song: Song = {
        id: `yt-${videoId}`,
        title,
        artist: "YouTube",
        youtubeId: videoId,
        duration: 0,
        src: "",
        emoji: "🎵",
        colorClass: "bg-red-900",
      };
      playExternalSong(song);
    },
    [playExternalSong],
  );

  const playTrack = useCallback(
    (idx: number) => playTrackInternal(idx),
    [playTrackInternal],
  );

  const togglePlay = useCallback(() => {
    const hasExternal = externalSongRef.current !== null;
    if (currentIdxRef.current < 0 && !hasExternal) {
      playTrackInternal(0);
      return;
    }

    if (activePlayerRef.current === "youtube") {
      const yt = ytPlayerRef.current;
      if (!yt) return;
      const state = yt.getPlayerState();
      if (window.YT && state === window.YT.PlayerState.PLAYING) {
        yt.pauseVideo();
      } else {
        yt.playVideo();
      }
    } else {
      const audio = audioRef.current;
      if (!audio) return;
      if (audio.paused) {
        audio
          .play()
          .then(() => setIsPlaying(true))
          .catch(() => {});
      } else {
        audio.pause();
        setIsPlaying(false);
      }
    }
  }, [playTrackInternal]);

  const nextTrack = useCallback(() => {
    setExternalSong(null);
    const idx = currentIdxRef.current < 0 ? 0 : currentIdxRef.current;
    const next = shuffleRef.current
      ? Math.floor(Math.random() * songs.length)
      : (idx + 1) % songs.length;
    playTrackInternal(next);
  }, [playTrackInternal]);

  const prevTrack = useCallback(() => {
    const isYT = activePlayerRef.current === "youtube";
    const ct = isYT
      ? (ytPlayerRef.current?.getCurrentTime() ?? 0)
      : (audioRef.current?.currentTime ?? 0);

    if (ct > 3) {
      if (isYT) ytPlayerRef.current?.seekTo(0, true);
      else if (audioRef.current) audioRef.current.currentTime = 0;
      return;
    }
    setExternalSong(null);
    const idx = currentIdxRef.current < 0 ? 0 : currentIdxRef.current;
    const prev = (idx - 1 + songs.length) % songs.length;
    playTrackInternal(prev);
  }, [playTrackInternal]);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => {
      const next = !prev;
      showToast(next ? "Shuffle on" : "Shuffle off");
      return next;
    });
  }, [showToast]);

  const toggleRepeat = useCallback(() => {
    setRepeatMode((prev) => {
      const next = prev === "none" ? "all" : prev === "all" ? "one" : "none";
      const labels = {
        none: "Repeat off",
        one: "Repeat one",
        all: "Repeat all",
      };
      showToast(labels[next]);
      return next;
    });
  }, [showToast]);

  const toggleLike = useCallback(() => {
    const extSong = externalSongRef.current;
    const idx = currentIdxRef.current;
    const songId = extSong ? extSong.id : idx >= 0 ? songs[idx].id : null;
    if (!songId) return;
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) {
        next.delete(songId);
        showToast("Removed from Liked Songs");
      } else {
        next.add(songId);
        showToast("Added to Liked Songs");
      }
      localStorage.setItem(LS_LIKED, JSON.stringify([...next]));
      return next;
    });
  }, [showToast]);

  const seek = useCallback((pct: number) => {
    if (activePlayerRef.current === "youtube") {
      const yt = ytPlayerRef.current;
      if (!yt) return;
      const dur = yt.getDuration();
      if (!dur) return;
      const t = pct * dur;
      yt.seekTo(t, true);
      setCurrentTime(t);
      setProgress(pct);
    } else {
      const audio = audioRef.current;
      if (!audio || !audio.duration) return;
      const t = pct * audio.duration;
      audio.currentTime = t;
      setCurrentTime(t);
      setProgress(pct);
    }
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    volumeRef.current = clamped;
    if (audioRef.current) audioRef.current.volume = clamped;
    if (ytPlayerRef.current && ytReadyRef.current) {
      ytPlayerRef.current.setVolume(Math.round(clamped * 100));
    }
  }, []);

  const toggleMute = useCallback(() => {
    if (activePlayerRef.current === "youtube") {
      const yt = ytPlayerRef.current;
      if (!yt) return;
      if (yt.isMuted()) yt.unMute();
      else yt.mute();
    } else {
      const audio = audioRef.current;
      if (!audio) return;
      audio.muted = !audio.muted;
    }
  }, []);

  const currentSong =
    externalSong ?? (currentIdx >= 0 ? songs[currentIdx] : null);
  const isCurrentLiked = currentSong ? likedIds.has(currentSong.id) : false;

  return {
    currentIdx,
    isPlaying,
    isShuffle,
    repeatMode,
    volume,
    progress,
    currentTime,
    duration,
    likedIds,
    recentIds,
    toastMsg: toastVisible ? toastMsg : "",
    isCurrentLiked,
    currentSong,
    showToast,
    playTrack,
    playExternalSong,
    playYT,
    togglePlay,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
    seek,
    setVolume,
    toggleMute,
  };
}
