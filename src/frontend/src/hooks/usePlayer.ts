import { useCallback, useEffect, useRef, useState } from "react";
import { type Song, songs } from "../data/songs";
import { type AudioMode, audioEngine } from "../engines/audioEngine";

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
  progress: number;
  currentTime: number;
  duration: number;
  likedIds: Set<string>;
  recentIds: number[];
  toastMsg: string;
  isCurrentLiked: boolean;
  currentSong: Song | null;
  currentMode: "local" | "youtube";
  ytQueue: Song[];
  ytQueueIdx: number;
  atmosMode: AudioMode;
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
  clearYtQueue: () => void;
  toggleAtmos: () => void;
  setAtmosMode: (mode: AudioMode) => void;
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
  const [currentMode, setCurrentMode] = useState<"local" | "youtube">("local");
  const [atmosMode, setAtmosModeState] = useState<AudioMode>("off");

  // ── YouTube queue (for search results navigation & auto-advance) ──────────
  const [ytQueue, setYtQueue] = useState<Song[]>([]);
  const [ytQueueIdx, setYtQueueIdx] = useState(-1);
  const ytQueueRef = useRef<Song[]>([]);
  const ytQueueIdxRef = useRef(-1);

  // keep refs in sync
  useEffect(() => {
    ytQueueRef.current = ytQueue;
  }, [ytQueue]);
  useEffect(() => {
    ytQueueIdxRef.current = ytQueueIdx;
  }, [ytQueueIdx]);

  // HTML5 Audio for local SoundHelix tracks
  const audioRef = useRef<HTMLAudioElement | null>(null);
  // YouTube IFrame Player instance
  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const ytReadyRef = useRef(false);
  // Track which player is currently active
  const activePlayerRef = useRef<"html5" | "youtube">("html5");
  // Pending video to load once YT player is ready
  const pendingYtVideoRef = useRef<string | null>(null);

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
  const atmosModeRef = useRef<AudioMode>("off");
  atmosModeRef.current = atmosMode;

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 2000);
  }, []);

  // ── Internal helper: play a YouTube Song from the ytQueue ─────────────────
  const playYtQueueItem = useCallback((song: Song) => {
    if (!song.youtubeId) return;
    activePlayerRef.current = "youtube";
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.src = "";
    }
    if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
    setCurrentMode("youtube");
    setExternalSong(song);
    setCurrentIdx(-1);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(true);

    const loadVideo = () => {
      const yt = ytPlayerRef.current;
      if (!yt) return;
      yt.loadVideoById(song.youtubeId as string);
      yt.setVolume(Math.round(volumeRef.current * 100));
      // Start Atmos simulation for YouTube
      if (atmosModeRef.current !== "off") {
        audioEngine.startYouTubeSimulation(yt);
      }
    };

    if (ytReadyRef.current && ytPlayerRef.current) {
      loadVideo();
    } else {
      pendingYtVideoRef.current = song.youtubeId;
    }
  }, []);

  // ── Helper: advance to next/handle repeat ──────────────────────────────────
  const handleTrackEnd = useCallback(() => {
    const rm = repeatRef.current;
    const sh = shuffleRef.current;
    const idx = currentIdxRef.current;

    // If an external YouTube song was playing, try to advance in ytQueue
    if (externalSongRef.current !== null) {
      const queue = ytQueueRef.current;
      const qIdx = ytQueueIdxRef.current;

      if (rm === "one" && externalSongRef.current.youtubeId) {
        // repeat single: replay same
        const yt = ytPlayerRef.current;
        if (yt) yt.loadVideoById(externalSongRef.current.youtubeId);
        setProgress(0);
        setCurrentTime(0);
        setIsPlaying(true);
        return;
      }

      const nextQIdx = qIdx + 1;
      if (nextQIdx < queue.length) {
        // advance to next in ytQueue
        const nextSong = queue[nextQIdx];
        setYtQueueIdx(nextQIdx);
        ytQueueIdxRef.current = nextQIdx;
        playYtQueueItem(nextSong);
      } else if (rm === "all" && queue.length > 0) {
        // loop back to start
        setYtQueueIdx(0);
        ytQueueIdxRef.current = 0;
        playYtQueueItem(queue[0]);
      } else {
        // end of queue, stop
        setExternalSong(null);
        setIsPlaying(false);
        setProgress(0);
        setCurrentTime(0);
        audioEngine.stopYouTubeSimulation();
      }
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
  }, [playYtQueueItem]);

  // Forward ref so handleTrackEnd can call playTrackInternal without circular dep
  const playTrackInternalRef = useRef<(idx: number) => void>(() => {});

  // ── Initialise HTML5 Audio ─────────────────────────────────────────────────
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.volume = volumeRef.current;
    audioRef.current = audio;

    // Connect audio engine once — MediaElementAudioSourceNode can only be created once per element
    try {
      audioEngine.connectLocalSource(audio);
    } catch (err) {
      console.warn("[usePlayer] Failed to connect audio engine:", err);
    }

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
            // Play any pending video that was queued before player was ready
            if (pendingYtVideoRef.current) {
              ytPlayerRef.current?.loadVideoById(pendingYtVideoRef.current);
              pendingYtVideoRef.current = null;
              // Start simulation if mode is on
              if (atmosModeRef.current !== "off" && ytPlayerRef.current) {
                audioEngine.startYouTubeSimulation(ytPlayerRef.current);
              }
            }
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
  const playTrackInternal = useCallback((idx: number) => {
    if (idx < 0 || idx >= songs.length) return;
    const song = songs[idx];

    setCurrentIdx(idx);
    setExternalSong(null);
    setProgress(0);
    setCurrentTime(0);

    // Auto-switch mode silently based on song type
    setCurrentMode(song.youtubeId ? "youtube" : "local");

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
      audioEngine.stopYouTubeSimulation();

      const loadYT = () => {
        const yt = ytPlayerRef.current;
        if (!yt) return;
        yt.loadVideoById(song.youtubeId as string);
        yt.setVolume(Math.round(volumeRef.current * 100));
        if (atmosModeRef.current !== "off") {
          audioEngine.startYouTubeSimulation(yt);
        }
      };

      if (ytReadyRef.current && ytPlayerRef.current) {
        loadYT();
      } else {
        pendingYtVideoRef.current = song.youtubeId;
      }

      setDuration(song.duration);
      setIsPlaying(true);
    } else {
      activePlayerRef.current = "html5";
      audioEngine.stopYouTubeSimulation();
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

      // Resume AudioContext before playing (browser policy)
      try {
        audioEngine.resumeContext();
      } catch (err) {
        console.warn("[usePlayer] resumeContext failed:", err);
      }
      audioEngine.setMode(atmosModeRef.current);

      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));

      setDuration(song.duration);
    }
  }, []);

  playTrackInternalRef.current = playTrackInternal;

  // ── Play external (YouTube search result) song ─────────────────────────────
  const playExternalSong = useCallback((song: Song) => {
    setExternalSong(song);
    setCurrentIdx(-1);
    setProgress(0);
    setCurrentTime(0);

    // Auto-switch mode silently based on song type
    setCurrentMode(song.youtubeId ? "youtube" : "local");

    if (song.youtubeId) {
      activePlayerRef.current = "youtube";
      const audio = audioRef.current;
      if (audio) {
        audio.pause();
        audio.src = "";
      }
      if (ytIntervalRef.current) clearInterval(ytIntervalRef.current);
      audioEngine.stopYouTubeSimulation();

      const loadYT = () => {
        const yt = ytPlayerRef.current;
        if (!yt) return;
        yt.loadVideoById(song.youtubeId as string);
        yt.setVolume(Math.round(volumeRef.current * 100));
        if (atmosModeRef.current !== "off") {
          audioEngine.startYouTubeSimulation(yt);
        }
      };

      if (ytReadyRef.current && ytPlayerRef.current) {
        loadYT();
      } else {
        pendingYtVideoRef.current = song.youtubeId;
      }

      setDuration(song.duration);
      setIsPlaying(true);
    } else if (song.src) {
      activePlayerRef.current = "html5";
      audioEngine.stopYouTubeSimulation();
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
      try {
        audioEngine.resumeContext();
      } catch (err) {
        console.warn("[usePlayer] resumeContext failed:", err);
      }
      audioEngine.setMode(atmosModeRef.current);
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => setIsPlaying(false));

      setDuration(song.duration);
    }
  }, []);

  // ── playYT: play a YouTube video by ID and title ───────────────────────────
  const playYT = useCallback(
    (videoId: string, title: string) => {
      const newSong: Song = {
        id: `yt-${videoId}`,
        title,
        artist: "YouTube",
        youtubeId: videoId,
        duration: 0,
        src: "",
        emoji: "🎵",
        colorClass: "c1",
      };

      // Add to ytQueue or update position if already present
      setYtQueue((prev) => {
        const existingIdx = prev.findIndex((s) => s.youtubeId === videoId);
        if (existingIdx >= 0) {
          ytQueueIdxRef.current = existingIdx;
          setYtQueueIdx(existingIdx);
          return prev;
        }
        const next = [...prev, newSong];
        const newIdx = next.length - 1;
        ytQueueIdxRef.current = newIdx;
        setYtQueueIdx(newIdx);
        return next;
      });

      // Play it
      playYtQueueItem(newSong);
    },
    [playYtQueueItem],
  );

  const clearYtQueue = useCallback(() => {
    setYtQueue([]);
    setYtQueueIdx(-1);
    ytQueueRef.current = [];
    ytQueueIdxRef.current = -1;
  }, []);

  const playTrack = useCallback(
    (idx: number) => playTrackInternal(idx),
    [playTrackInternal],
  );

  const togglePlay = useCallback(() => {
    const hasExternal = externalSongRef.current !== null;
    if (currentIdxRef.current < 0 && !hasExternal) {
      try {
        audioEngine.resumeContext();
      } catch (err) {
        console.warn("[usePlayer] resumeContext failed:", err);
      }
      playTrackInternal(0);
      return;
    }

    if (activePlayerRef.current === "youtube") {
      const yt = ytPlayerRef.current;
      if (!yt) return;
      try {
        audioEngine.resumeContext();
      } catch (err) {
        console.warn("[usePlayer] resumeContext failed:", err);
      }
      const state = yt.getPlayerState();
      if (window.YT && state === window.YT.PlayerState.PLAYING) {
        yt.pauseVideo();
        setIsPlaying(false);
      } else {
        yt.playVideo();
        setIsPlaying(true);
      }
    } else {
      const audio = audioRef.current;
      if (!audio) return;
      try {
        audioEngine.resumeContext();
      } catch (err) {
        console.warn("[usePlayer] resumeContext failed:", err);
      }
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
    if (activePlayerRef.current === "youtube") {
      const queue = ytQueueRef.current;
      const qIdx = ytQueueIdxRef.current;
      const nextQIdx = qIdx + 1;
      if (queue.length > 0 && nextQIdx < queue.length) {
        setYtQueueIdx(nextQIdx);
        ytQueueIdxRef.current = nextQIdx;
        playYtQueueItem(queue[nextQIdx]);
        return;
      }
    }
    setExternalSong(null);
    const idx = currentIdxRef.current < 0 ? 0 : currentIdxRef.current;
    const next = shuffleRef.current
      ? Math.floor(Math.random() * songs.length)
      : (idx + 1) % songs.length;
    playTrackInternal(next);
  }, [playTrackInternal, playYtQueueItem]);

  const prevTrack = useCallback(() => {
    if (activePlayerRef.current === "youtube") {
      const yt = ytPlayerRef.current;
      const ct = yt?.getCurrentTime() ?? 0;
      if (ct > 3) {
        yt?.seekTo(0, true);
        setCurrentTime(0);
        setProgress(0);
        return;
      }
      const queue = ytQueueRef.current;
      const qIdx = ytQueueIdxRef.current;
      const prevQIdx = qIdx - 1;
      if (queue.length > 0 && prevQIdx >= 0) {
        setYtQueueIdx(prevQIdx);
        ytQueueIdxRef.current = prevQIdx;
        playYtQueueItem(queue[prevQIdx]);
        return;
      }
      yt?.seekTo(0, true);
      setCurrentTime(0);
      setProgress(0);
      return;
    }

    const ct = audioRef.current?.currentTime ?? 0;
    if (ct > 3) {
      if (audioRef.current) audioRef.current.currentTime = 0;
      return;
    }
    setExternalSong(null);
    const idx = currentIdxRef.current < 0 ? 0 : currentIdxRef.current;
    const prev = (idx - 1 + songs.length) % songs.length;
    playTrackInternal(prev);
  }, [playTrackInternal, playYtQueueItem]);

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

  // ── Atmos controls ─────────────────────────────────────────────────────────
  const toggleAtmos = useCallback(() => {
    try {
      setAtmosModeState((prev) => {
        try {
          const next: AudioMode = prev === "off" ? "atmos" : "off";
          atmosModeRef.current = next;
          audioEngine.setMode(next);

          if (
            activePlayerRef.current === "youtube" &&
            ytPlayerRef.current &&
            ytReadyRef.current
          ) {
            if (next !== "off") {
              audioEngine.startYouTubeSimulation(ytPlayerRef.current);
            } else {
              audioEngine.stopYouTubeSimulation();
            }
          }

          showToast(next === "off" ? "Atmos off" : "Dolby Atmos ON");
          return next;
        } catch (err) {
          console.warn("[usePlayer] toggleAtmos inner failed:", err);
          audioEngine.safeDisable();
          return "off" as AudioMode;
        }
      });
    } catch (err) {
      console.warn("[usePlayer] toggleAtmos failed:", err);
      audioEngine.safeDisable();
      setAtmosModeState("off");
    }
  }, [showToast]);

  const setAtmosMode = useCallback((mode: AudioMode) => {
    try {
      setAtmosModeState(mode);
      atmosModeRef.current = mode;
      audioEngine.setMode(mode);

      if (
        activePlayerRef.current === "youtube" &&
        ytPlayerRef.current &&
        ytReadyRef.current
      ) {
        if (mode !== "off") {
          audioEngine.startYouTubeSimulation(ytPlayerRef.current);
        } else {
          audioEngine.stopYouTubeSimulation();
        }
      }
    } catch (err) {
      console.warn("[usePlayer] setAtmosMode failed:", err);
      audioEngine.safeDisable();
      setAtmosModeState("off");
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
    currentMode,
    ytQueue,
    ytQueueIdx,
    atmosMode,
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
    clearYtQueue,
    toggleAtmos,
    setAtmosMode,
  };
}
