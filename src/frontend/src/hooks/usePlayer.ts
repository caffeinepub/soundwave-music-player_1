import { useCallback, useEffect, useRef, useState } from "react";
import { type Song, songs } from "../data/songs";
import { type AudioMode, audioEngine } from "../engines/audioEngine";

export type RepeatMode = "none" | "one" | "all";

const LS_LIKED = "sw_liked";
const LS_RECENT = "sw_recent";
const LS_VOLUME = "sw_volume";

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

function loadVolume(): number {
  try {
    const v = Number.parseFloat(localStorage.getItem(LS_VOLUME) || "0.7");
    return Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.7;
  } catch {
    return 0.7;
  }
}

// Single global audio instance — created once at module level
const audio = new Audio();
audio.preload = "metadata";
audio.volume = loadVolume();

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
  currentMode: "local";
  atmosMode: AudioMode;
  showToast: (msg: string) => void;
  playTrack: (idx: number) => void;
  togglePlay: () => void;
  nextTrack: () => void;
  prevTrack: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  toggleLike: () => void;
  seek: (pct: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleAtmos: () => void;
  setAtmosMode: (mode: AudioMode) => void;
  pauseAudio: () => void;
}

export function usePlayer(): PlayerState {
  const [currentIdx, setCurrentIdx] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("none");
  const [volume, setVolumeState] = useState(loadVolume);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [likedIds, setLikedIds] = useState<Set<string>>(loadLiked);
  const [recentIds, setRecentIds] = useState<number[]>(loadRecent);
  const [toastMsg, setToastMsg] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [atmosMode, setAtmosModeState] = useState<AudioMode>("off");

  // Refs for stable closure access
  const currentIdxRef = useRef(currentIdx);
  currentIdxRef.current = currentIdx;
  const shuffleRef = useRef(isShuffle);
  shuffleRef.current = isShuffle;
  const repeatRef = useRef(repeatMode);
  repeatRef.current = repeatMode;
  const volumeRef = useRef(volume);
  volumeRef.current = volume;
  const atmosModeRef = useRef<AudioMode>("off");
  atmosModeRef.current = atmosMode;
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 2000);
  }, []);

  // Forward ref to avoid circular deps
  const playTrackInternalRef = useRef<(idx: number) => void>(() => {});

  const handleTrackEnd = useCallback(() => {
    const rm = repeatRef.current;
    const sh = shuffleRef.current;
    const idx = currentIdxRef.current;

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
  }, []);

  // Wire up the global audio element once
  useEffect(() => {
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
    const onEnded = () => handleTrackEnd();
    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
    };
  }, [handleTrackEnd]);

  const playTrackInternal = useCallback((idx: number) => {
    if (idx < 0 || idx >= songs.length) return;
    const song = songs[idx];

    setCurrentIdx(idx);
    setProgress(0);
    setCurrentTime(0);

    setRecentIds((prev) => {
      const next = [idx, ...prev.filter((x) => x !== idx)].slice(0, 8);
      localStorage.setItem(LS_RECENT, JSON.stringify(next));
      return next;
    });

    // Use src; fallback to SoundHelix Song-1 if empty
    const src =
      song.src ||
      "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
    audio.src = src;
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
      .catch((err) => {
        console.warn("[usePlayer] play() failed:", err);
        setIsPlaying(false);
      });

    setDuration(song.duration);
  }, []);

  playTrackInternalRef.current = playTrackInternal;

  const playTrack = useCallback(
    (idx: number) => playTrackInternal(idx),
    [playTrackInternal],
  );

  const togglePlay = useCallback(() => {
    if (currentIdxRef.current < 0) {
      try {
        audioEngine.resumeContext();
      } catch (_) {}
      playTrackInternal(0);
      return;
    }
    try {
      audioEngine.resumeContext();
    } catch (_) {}
    if (audio.paused) {
      audio
        .play()
        .then(() => setIsPlaying(true))
        .catch(() => {});
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, [playTrackInternal]);

  const nextTrack = useCallback(() => {
    const idx = currentIdxRef.current < 0 ? 0 : currentIdxRef.current;
    const next = shuffleRef.current
      ? Math.floor(Math.random() * songs.length)
      : (idx + 1) % songs.length;
    playTrackInternal(next);
  }, [playTrackInternal]);

  const prevTrack = useCallback(() => {
    if (audio.currentTime > 3) {
      audio.currentTime = 0;
      setCurrentTime(0);
      setProgress(0);
      return;
    }
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
    const idx = currentIdxRef.current;
    if (idx < 0) return;
    const songId = songs[idx].id;
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
    if (!audio.duration) return;
    const t = pct * audio.duration;
    audio.currentTime = t;
    setCurrentTime(t);
    setProgress(pct);
  }, []);

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    volumeRef.current = clamped;
    audio.volume = clamped;
    localStorage.setItem(LS_VOLUME, String(clamped));
  }, []);

  const toggleMute = useCallback(() => {
    audio.muted = !audio.muted;
  }, []);

  const toggleAtmos = useCallback(() => {
    try {
      setAtmosModeState((prev) => {
        const next: AudioMode = prev === "off" ? "atmos" : "off";
        atmosModeRef.current = next;
        try {
          audioEngine.setMode(next);
        } catch (err) {
          console.warn("[usePlayer] toggleAtmos setMode failed:", err);
          audioEngine.safeDisable();
          return "off" as AudioMode;
        }
        showToast(next === "off" ? "Atmos off" : "Dolby Atmos ON");
        return next;
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
    } catch (err) {
      console.warn("[usePlayer] setAtmosMode failed:", err);
      audioEngine.safeDisable();
      setAtmosModeState("off");
    }
  }, []);

  const pauseAudio = useCallback(() => {
    try {
      audio.pause();
    } catch (_) {}
    setIsPlaying(false);
  }, []);

  const currentSong = currentIdx >= 0 ? songs[currentIdx] : null;
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
    currentMode: "local",
    atmosMode,
    showToast,
    playTrack,
    togglePlay,
    nextTrack,
    prevTrack,
    toggleShuffle,
    toggleRepeat,
    toggleLike,
    seek,
    setVolume,
    toggleMute,
    toggleAtmos,
    setAtmosMode,
    pauseAudio,
  };
}
