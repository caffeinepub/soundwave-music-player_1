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

  // Must be set BEFORE script loads
  window.onYouTubeIframeAPIReady = () => {
    scriptLoaded = true;
    for (const cb of readyCallbacks) cb();
    readyCallbacks.length = 0;
  };

  const tag = document.createElement("script");
  tag.src = "https://www.youtube.com/iframe_api";
  document.head.appendChild(tag);
}

const HIDDEN_DIV_ID = "yt-hidden-player";

function ensureHiddenDiv(): HTMLElement {
  let el = document.getElementById(HIDDEN_DIV_ID);
  if (!el) {
    el = document.createElement("div");
    el.id = HIDDEN_DIV_ID;
    el.style.cssText =
      "position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;z-index:-1;pointer-events:none;";
    document.body.appendChild(el);
  }
  return el;
}

export function useYouTubePlayer(): YouTubePlayerState {
  const [ytActive, setYtActive] = useState(false);
  const [ytVideoId, setYtVideoId] = useState<string | null>(null);
  const [ytTitle, setYtTitle] = useState("");
  const [ytThumbnail, setYtThumbnail] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.7);
  const [queue, setQueue] = useState<YTQueueItem[]>([]);

  const playerRef = useRef<any>(null);
  const playerReadyRef = useRef(false);
  const pendingVideoRef = useRef<{
    videoId: string;
    title: string;
    thumbnail: string;
  } | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const queueRef = useRef<YTQueueItem[]>([]);
  const currentVideoIdRef = useRef<string | null>(null);
  const volumeRef = useRef(0.7);

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
      setYtVideoId(videoId);
      setYtTitle(title);
      setYtThumbnail(thumbnail);
      setYtActive(true);
      setProgress(0);
      setCurrentTime(0);
      setDuration(0);

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
    ensureHiddenDiv();

    loadYTScript(() => {
      if (playerRef.current) return; // Already created

      try {
        const player = new window.YT.Player(HIDDEN_DIV_ID, {
          width: 1,
          height: 1,
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            fs: 0,
            iv_load_policy: 3,
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
              // Play pending video if any
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
                // Auto-play next in queue
                const q = queueRef.current;
                if (q.length > 0) {
                  const [next, ...rest] = q;
                  setQueue(rest);
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
    });

    return () => {
      stopPolling();
    };
  }, [loadVideoInternal, startPolling, stopPolling]);

  const togglePlay = useCallback(() => {
    const p = playerRef.current;
    if (!p) return;
    try {
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
  }, [stopPolling]);

  const addToQueue = useCallback((item: YTQueueItem) => {
    setQueue((prev) => [...prev, item]);
  }, []);

  const nextTrack = useCallback(() => {
    const q = queueRef.current;
    if (q.length > 0) {
      const [next, ...rest] = q;
      setQueue(rest);
      loadVideoInternal(next.videoId, next.title, next.thumbnail);
    }
  }, [loadVideoInternal]);

  const prevTrack = useCallback(() => {
    // Restart current video
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
