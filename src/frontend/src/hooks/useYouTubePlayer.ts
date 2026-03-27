import { useCallback, useEffect, useRef, useState } from "react";

// Extend window with YT global
declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface YTQueueItem {
  videoId: string;
  title: string;
  thumbnail: string;
}

export interface YouTubePlayerState {
  ytActive: boolean;
  ytVideoId: string | null;
  ytTitle: string;
  ytThumbnail: string;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  duration: number;
  volume: number;
  queue: YTQueueItem[];
  loadVideo: (videoId: string, title: string, thumbnail: string) => void;
  togglePlay: () => void;
  seekTo: (pct: number) => void;
  setVolume: (v: number) => void;
  stop: () => void;
  addToQueue: (item: YTQueueItem) => void;
  nextTrack: () => void;
  prevTrack: () => void;
}

// Module-level ref so other components can call stop
export const ytPlayerRef = { current: null as any };

let scriptLoaded = false;
let scriptLoading = false;
const readyCallbacks: Array<() => void> = [];

function loadYTScript(onReady: () => void) {
  if (scriptLoaded) {
    onReady();
    return;
  }
  readyCallbacks.push(onReady);
  if (scriptLoading) return;
  scriptLoading = true;

  window.onYouTubeIframeAPIReady = () => {
    scriptLoaded = true;
    for (const cb of readyCallbacks) cb();
    readyCallbacks.length = 0;
  };

  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

// The div rendered by YouTubeMiniPlayer component
export const MINI_PLAYER_DIV_ID = "yt-mini-container";

// ── LocalStorage persistence ──────────────────────────────────────────────
const LS_YT_QUEUE = "sw_yt_queue";
const LS_YT_LAST = "sw_yt_last";

function loadYTQueue(): YTQueueItem[] {
  try {
    return JSON.parse(localStorage.getItem(LS_YT_QUEUE) || "[]");
  } catch {
    return [];
  }
}

interface LastPlayed {
  videoId: string;
  title: string;
  thumbnail: string;
}

function loadLastPlayed(): LastPlayed | null {
  try {
    return JSON.parse(localStorage.getItem(LS_YT_LAST) || "null");
  } catch {
    return null;
  }
}

function saveYTQueue(queue: YTQueueItem[]) {
  try {
    localStorage.setItem(LS_YT_QUEUE, JSON.stringify(queue));
  } catch (_) {}
}

function saveLastPlayed(item: LastPlayed) {
  try {
    localStorage.setItem(LS_YT_LAST, JSON.stringify(item));
  } catch (_) {}
}

export function useYouTubePlayer(): YouTubePlayerState {
  // Restore last played on init (no autoplay)
  const lastPlayed = loadLastPlayed();

  const [ytActive, setYtActive] = useState(() => !!lastPlayed);
  const [ytVideoId, setYtVideoId] = useState<string | null>(
    () => lastPlayed?.videoId ?? null,
  );
  const [ytTitle, setYtTitle] = useState(() => lastPlayed?.title ?? "");
  const [ytThumbnail, setYtThumbnail] = useState(
    () => lastPlayed?.thumbnail ?? "",
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [queue, setQueue] = useState<YTQueueItem[]>(() => loadYTQueue());

  const playerRef = useRef<any>(null);
  const playerReadyRef = useRef(false);
  const pendingVideoRef = useRef<LastPlayed | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queueRef = useRef<YTQueueItem[]>([]);
  const currentVideoIdRef = useRef<string | null>(lastPlayed?.videoId ?? null);
  const volumeRef = useRef(0.7);
  // needsLoad: true when a video is set from localStorage restore but not yet
  // loaded into the YT player (prevents autoplay on refresh)
  const needsLoadRef = useRef<boolean>(!!lastPlayed);

  queueRef.current = queue;

  const startPolling = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      const p = playerRef.current;
      if (!p?.getCurrentTime) return;
      try {
        const ct = p.getCurrentTime() as number;
        const dur = p.getDuration() as number;
        if (dur > 0) {
          setCurrentTime(ct);
          setDuration(dur);
          setProgress(ct / dur);
        }
      } catch (_) {}
    }, 500);
  }, []);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const loadVideoInternal = useCallback(
    (videoId: string, title: string, thumbnail: string) => {
      currentVideoIdRef.current = videoId;
      needsLoadRef.current = false; // loading for real, not a restore
      setYtVideoId(videoId);
      setYtTitle(title);
      setYtThumbnail(thumbnail);
      setYtActive(true);
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);

      // Persist last-played
      saveLastPlayed({ videoId, title, thumbnail });

      if (playerReadyRef.current && playerRef.current?.loadVideoById) {
        try {
          playerRef.current.loadVideoById(videoId);
        } catch (e) {
          console.warn("[YTPlayer] loadVideoById failed:", e);
        }
      } else {
        pendingVideoRef.current = { videoId, title, thumbnail };
      }
    },
    [],
  );

  useEffect(() => {
    loadYTScript(() => {
      if (playerRef.current) return;

      // Wait for the mini-player div to be in the DOM
      const tryInit = () => {
        const container = document.getElementById(MINI_PLAYER_DIV_ID);
        if (!container) {
          // Retry shortly — the React component may not have mounted yet
          setTimeout(tryInit, 100);
          return;
        }

        try {
          const player = new window.YT.Player(MINI_PLAYER_DIV_ID, {
            width: "100%",
            height: "100%",
            playerVars: {
              autoplay: 0,
              controls: 1, // Show YT controls (policy-compliant)
              modestbranding: 1,
              rel: 0,
              playsinline: 1,
            },
            events: {
              onReady: () => {
                playerReadyRef.current = true;
                playerRef.current = player;
                ytPlayerRef.current = player;
                try {
                  player.setVolume(volumeRef.current * 100);
                } catch (_) {}
                if (pendingVideoRef.current) {
                  const { videoId, title, thumbnail } = pendingVideoRef.current;
                  pendingVideoRef.current = null;
                  loadVideoInternal(videoId, title, thumbnail);
                }
              },
              onStateChange: (event: any) => {
                const YTState = window.YT?.PlayerState;
                if (!YTState) return;
                if (event.data === YTState.PLAYING) {
                  setIsPlaying(true);
                  startPolling();
                } else if (
                  event.data === YTState.PAUSED ||
                  event.data === YTState.BUFFERING
                ) {
                  setIsPlaying(false);
                  if (event.data === YTState.PAUSED) stopPolling();
                } else if (event.data === YTState.ENDED) {
                  setIsPlaying(false);
                  stopPolling();
                  setProgress(1);
                  const q = queueRef.current;
                  if (q.length > 0) {
                    const [next, ...rest] = q;
                    setQueue(rest);
                    saveYTQueue(rest);
                    loadVideoInternal(next.videoId, next.title, next.thumbnail);
                  }
                }
              },
              onError: (e: any) => {
                console.warn("[YTPlayer] error:", e.data);
                setIsPlaying(false);
                stopPolling();
              },
            },
          });
          playerRef.current = player;
          ytPlayerRef.current = player;
        } catch (err) {
          console.warn("[YTPlayer] Failed to create player:", err);
        }
      };

      tryInit();
    });

    return () => {
      stopPolling();
    };
  }, [loadVideoInternal, startPolling, stopPolling]);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
      // If this is a restored track that hasn't been loaded yet, load it first
      if (needsLoadRef.current && currentVideoIdRef.current) {
        needsLoadRef.current = false;
        p.loadVideoById(currentVideoIdRef.current);
        // onStateChange PLAYING will set isPlaying=true
        return;
      }
      if (isPlaying) {
        p.pauseVideo();
      } else {
        p.playVideo();
      }
    } catch (e) {
      console.warn("[YTPlayer] togglePlay failed:", e);
    }
  }, [isPlaying]);

  const seekTo = useCallback((pct: number) => {
    const p = playerRef.current;
    if (!p?.getDuration) return;
    try {
      const dur = p.getDuration() as number;
      if (dur > 0) {
        p.seekTo(pct * dur, true);
        setCurrentTime(pct * dur);
        setProgress(pct);
      }
    } catch (e) {
      console.warn("[YTPlayer] seekTo failed:", e);
    }
  }, []);

  const setVolumeHandler = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    volumeRef.current = clamped;
    try {
      playerRef.current?.setVolume(clamped * 100);
    } catch (_) {}
  }, []);

  const stop = useCallback(() => {
    try {
      playerRef.current?.stopVideo();
    } catch (_) {}
    setYtActive(false);
    setYtVideoId(null);
    setYtTitle("");
    setYtThumbnail("");
    setIsPlaying(false);
    setProgress(0);
    setCurrentTime(0);
    setDuration(0);
    stopPolling();
    needsLoadRef.current = false;
    try {
      localStorage.removeItem(LS_YT_LAST);
    } catch (_) {}
  }, [stopPolling]);

  const addToQueue = useCallback((item: YTQueueItem) => {
    setQueue((prev) => {
      const next = [...prev, item];
      saveYTQueue(next);
      return next;
    });
  }, []);

  const nextTrack = useCallback(() => {
    const q = queueRef.current;
    if (q.length > 0) {
      const [next, ...rest] = q;
      setQueue(rest);
      saveYTQueue(rest);
      loadVideoInternal(next.videoId, next.title, next.thumbnail);
    }
  }, [loadVideoInternal]);

  const prevTrack = useCallback(() => {
    seekTo(0);
  }, [seekTo]);

  return {
    ytActive,
    ytVideoId,
    ytTitle,
    ytThumbnail,
    isPlaying,
    progress,
    currentTime,
    duration,
    volume,
    queue,
    loadVideo: loadVideoInternal,
    togglePlay,
    seekTo,
    setVolume: setVolumeHandler,
    stop,
    addToQueue,
    nextTrack,
    prevTrack,
  };
}
