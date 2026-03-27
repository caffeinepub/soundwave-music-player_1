import { useCallback, useEffect, useRef, useState } from "react";

const tracks = [
  {
    title: "Midnight Mirage",
    artist: "Aurora Waves",
    album: "Neon Dreams",
    art: "🌌",
    duration: "3:47",
    color1: "#0a1628",
    color2: "#1a2744",
    glow: "rgba(30,80,200,0.4)",
  },
  {
    title: "Solar Winds",
    artist: "Prism Echo",
    album: "Ultraviolet",
    art: "☀️",
    duration: "4:12",
    color1: "#2a1800",
    color2: "#3d2500",
    glow: "rgba(255,150,20,0.4)",
  },
  {
    title: "Crystal Cave",
    artist: "Depths & Peaks",
    album: "Subterranean",
    art: "💎",
    duration: "3:22",
    color1: "#001a1a",
    color2: "#002626",
    glow: "rgba(0,200,200,0.35)",
  },
  {
    title: "Neon Sakura",
    artist: "Tokyo Drift",
    album: "Harajuku Nights",
    art: "🌸",
    duration: "3:55",
    color1: "#1a001a",
    color2: "#280028",
    glow: "rgba(200,0,200,0.35)",
  },
  {
    title: "Thunder Road",
    artist: "Static Voltage",
    album: "High Current",
    art: "⚡",
    duration: "4:33",
    color1: "#1a1500",
    color2: "#262000",
    glow: "rgba(200,180,0,0.35)",
  },
  {
    title: "Deep Space",
    artist: "Cosmic Drift",
    album: "Void Sessions",
    art: "🪐",
    duration: "5:01",
    color1: "#0f0020",
    color2: "#180030",
    glow: "rgba(120,0,255,0.35)",
  },
];

const playlists = [
  { name: "Chill Vibes", sub: "42 tracks", art: "🌊" },
  { name: "Workout Mix", sub: "38 tracks", art: "💪" },
  { name: "Lo-Fi Study", sub: "61 tracks", art: "📚" },
  { name: "Night Drive", sub: "29 tracks", art: "🌃" },
  { name: "Jazz & Soul", sub: "55 tracks", art: "🎷" },
  { name: "Indie Gold", sub: "47 tracks", art: "🎸" },
];

const trending = [
  { name: "After Hours", sub: "The Weeknd", art: "🌙" },
  { name: "Blinding Lights", sub: "The Weeknd", art: "✨" },
  { name: "Levitating", sub: "Dua Lipa", art: "🪐" },
  { name: "Starboy", sub: "The Weeknd", art: "⭐" },
  { name: "Save Your Tears", sub: "The Weeknd", art: "💧" },
  { name: "Ghost Town", sub: "Kanye West", art: "👻" },
];

const browseItems = [
  { icon: "🏠", label: "Home", active: true },
  { icon: "🔍", label: "Search", active: false },
  { icon: "📻", label: "Radio", active: false },
  { icon: "🔥", label: "Trending", active: false },
];

const libraryItems = [
  { icon: "❤️", label: "Liked Songs" },
  { icon: "📁", label: "Playlists" },
  { icon: "💽", label: "Albums" },
  { icon: "🎤", label: "Artists" },
];

const NAV_TABS = ["Discover", "Library", "Radio", "Artists"];

function parseDuration(d: string): number {
  const p = d.split(":");
  return Number.parseInt(p[0]) * 60 + Number.parseInt(p[1]);
}

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export default function App() {
  const [currentTrack, setCurrentTrack] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0.35);
  const [progressSecs, setProgressSecs] = useState(84);
  const [volume, setVolume] = useState(0.72);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [atmos, setAtmos] = useState(false);
  const [liked, setLiked] = useState(false);
  const [trackInfoChanging, setTrackInfoChanging] = useState(false);
  const [activeTab, setActiveTab] = useState("Discover");
  const [playBeat, setPlayBeat] = useState(false);
  const [progPulsing, setProgPulsing] = useState(false);
  const [ripples, setRipples] = useState<
    { id: number; x: number; y: number; size: number }[]
  >([]);

  const eqContainerRef = useRef<HTMLDivElement>(null);
  const albumContainerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const progressTrackRef = useRef<HTMLDivElement>(null);
  const volTrackRef = useRef<HTMLDivElement>(null);
  const eqRafRef = useRef<number>(0);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressSecsRef = useRef(84);
  const progressRef = useRef(0.35);
  const rippleKeyRef = useRef(0);

  const track = tracks[currentTrack];

  // sync refs
  useEffect(() => {
    progressSecsRef.current = progressSecs;
  }, [progressSecs]);
  useEffect(() => {
    progressRef.current = progress;
  }, [progress]);

  // Update CSS glow var
  useEffect(() => {
    document.documentElement.style.setProperty("--glow", track.glow);
  }, [track.glow]);

  // Auto-start after 1.2s
  useEffect(() => {
    const t = setTimeout(() => setPlaying(true), 1200);
    return () => clearTimeout(t);
  }, []);

  // EQ animation
  useEffect(() => {
    if (!playing) {
      cancelAnimationFrame(eqRafRef.current);
      if (eqContainerRef.current) {
        for (const b of eqContainerRef.current.querySelectorAll(".sw-eq-bar")) {
          (b as HTMLElement).style.height = "4px";
        }
      }
      return;
    }
    let beatPhase = 0;
    const animate = () => {
      eqRafRef.current = requestAnimationFrame(animate);
      beatPhase += 0.07;
      if (eqContainerRef.current) {
        let idx = 0;
        for (const bar of eqContainerRef.current.querySelectorAll(
          ".sw-eq-bar",
        )) {
          const base = Math.abs(Math.sin(beatPhase + idx * 0.4)) * 18;
          const variation = Math.random() * 6;
          const h = Math.max(3, base + variation);
          (bar as HTMLElement).style.height = `${h}px`;
          (bar as HTMLElement).style.opacity = String(0.4 + (h / 24) * 0.6);
          idx++;
        }
      }
      if (Math.abs(Math.sin(beatPhase)) > 0.97) {
        setPlayBeat(true);
        setTimeout(() => setPlayBeat(false), 260);
        setProgPulsing(true);
        setTimeout(() => setProgPulsing(false), 400);
      }
    };
    animate();
    return () => cancelAnimationFrame(eqRafRef.current);
  }, [playing]);

  const switchTrack = useCallback((idx: number) => {
    setTrackInfoChanging(true);
    setTimeout(() => {
      setCurrentTrack(idx);
      setProgressSecs(0);
      setProgress(0);
      progressSecsRef.current = 0;
      progressRef.current = 0;
      setTrackInfoChanging(false);
    }, 350);
  }, []);

  const goPrev = useCallback(() => {
    switchTrack((currentTrack - 1 + tracks.length) % tracks.length);
  }, [currentTrack, switchTrack]);

  const goNext = useCallback(() => {
    const next = shuffle
      ? Math.floor(Math.random() * tracks.length)
      : (currentTrack + 1) % tracks.length;
    switchTrack(next);
  }, [currentTrack, shuffle, switchTrack]);

  // Progress timer
  // biome-ignore lint/correctness/useExhaustiveDependencies: goNext is intentionally excluded to avoid timer restart loop
  useEffect(() => {
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    if (!playing) return;
    progressTimerRef.current = setInterval(() => {
      const dur = parseDuration(tracks[currentTrack].duration);
      const newSecs = Math.min(progressSecsRef.current + 1, dur);
      const newProg = newSecs / dur;
      progressSecsRef.current = newSecs;
      progressRef.current = newProg;
      setProgressSecs(newSecs);
      setProgress(newProg);
      if (newSecs >= dur) {
        if (repeat) {
          setProgressSecs(0);
          setProgress(0);
          progressSecsRef.current = 0;
          progressRef.current = 0;
        } else {
          goNext();
        }
      }
    }, 1000);
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [playing, currentTrack, repeat]);

  // 3D tilt on stage
  useEffect(() => {
    const stage = stageRef.current;
    const container = albumContainerRef.current;
    if (!stage || !container) return;
    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (window.innerWidth / 2);
      const dy = (e.clientY - cy) / (window.innerHeight / 2);
      container.style.transform = `perspective(1200px) rotateX(${-dy * 8}deg) rotateY(${dx * 8}deg) translateZ(10px)`;
      container.style.transition = "transform 0.1s ease-out";
    };
    const onLeave = () => {
      container.style.transform =
        "perspective(1200px) rotateX(0) rotateY(0) translateZ(0)";
      container.style.transition =
        "transform 0.6s cubic-bezier(0.34,1.56,0.64,1)";
    };
    stage.addEventListener("mousemove", onMove);
    stage.addEventListener("mouseleave", onLeave);
    return () => {
      stage.removeEventListener("mousemove", onMove);
      stage.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  // 3D tilt on now-playing bar
  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;
    const onMove = (e: MouseEvent) => {
      const rect = bar.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = (e.clientX - cx) / (rect.width / 2);
      const dy = (e.clientY - cy) / (rect.height / 2);
      bar.style.transform = `perspective(1200px) rotateX(${-dy * 3}deg) rotateY(${dx * 3}deg) scale(1.005)`;
      bar.style.transition = "transform 0.1s ease-out, box-shadow 0.3s";
      bar.style.boxShadow = `0 -8px 40px rgba(0,0,0,0.3), 0 0 60px ${track.glow.replace(/[\d.]+\)/, "0.12)")}`;
    };
    const onLeave = () => {
      bar.style.transform =
        "perspective(1200px) rotateX(0) rotateY(0) scale(1)";
      bar.style.transition =
        "transform 0.6s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.4s";
      bar.style.boxShadow = "";
    };
    bar.addEventListener("mousemove", onMove);
    bar.addEventListener("mouseleave", onLeave);
    return () => {
      bar.removeEventListener("mousemove", onMove);
      bar.removeEventListener("mouseleave", onLeave);
    };
  }, [track.glow]);

  // Progress drag
  useEffect(() => {
    const trackEl = progressTrackRef.current;
    if (!trackEl) return;
    let dragging = false;
    const setFromEvent = (clientX: number) => {
      const rect = trackEl.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const dur = parseDuration(tracks[currentTrack].duration);
      const secs = Math.round(pct * dur);
      progressSecsRef.current = secs;
      progressRef.current = pct;
      setProgressSecs(secs);
      setProgress(pct);
    };
    const onDown = (e: MouseEvent) => {
      dragging = true;
      setFromEvent(e.clientX);
    };
    const onMove = (e: MouseEvent) => {
      if (dragging) setFromEvent(e.clientX);
    };
    const onUp = () => {
      dragging = false;
    };
    trackEl.addEventListener("mousedown", onDown);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      trackEl.removeEventListener("mousedown", onDown);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [currentTrack]);

  // Volume drag
  useEffect(() => {
    const trackEl = volTrackRef.current;
    if (!trackEl) return;
    let dragging = false;
    const setFromEvent = (clientX: number) => {
      const rect = trackEl.getBoundingClientRect();
      const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      setVolume(pct);
    };
    const onDown = (e: MouseEvent) => {
      dragging = true;
      setFromEvent(e.clientX);
    };
    const onMove = (e: MouseEvent) => {
      if (dragging) setFromEvent(e.clientX);
    };
    const onUp = () => {
      dragging = false;
    };
    trackEl.addEventListener("mousedown", onDown);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      trackEl.removeEventListener("mousedown", onDown);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, []);

  const togglePlay = (e?: React.MouseEvent<HTMLButtonElement>) => {
    if (e) {
      const btn = e.currentTarget;
      if (btn.classList.contains("sw-play-btn")) {
        const size = Math.max(btn.offsetWidth, btn.offsetHeight);
        const id = ++rippleKeyRef.current;
        setRipples((r) => [
          ...r,
          {
            id,
            x: (btn.offsetWidth - size) / 2,
            y: (btn.offsetHeight - size) / 2,
            size,
          },
        ]);
        setTimeout(
          () => setRipples((r) => r.filter((rr) => rr.id !== id)),
          600,
        );
      }
    }
    setPlaying((p) => !p);
  };

  const bgStyle = {
    background: `radial-gradient(ellipse 60% 50% at 50% 110%, ${track.color2} 0%, #080b12 70%), radial-gradient(ellipse 100% 80% at 80% 0%, ${track.color1}88 0%, transparent 60%)`,
  };

  const pct = `${progress * 100}%`;
  const currentTimeStr = formatTime(progressSecs);
  const totalTimeStr = track.duration;

  return (
    <>
      <div className="sw-bg-canvas" style={bgStyle} />
      <div className="sw-noise" />

      <div className="sw-app">
        {/* HEADER */}
        <header className="sw-header">
          <div className="sw-logo">
            <div className="sw-logo-icon">🎵</div>
            <div className="sw-logo-text">
              Sound<span>wave</span>
            </div>
          </div>
          <nav className="sw-nav-tabs">
            {NAV_TABS.map((tab) => (
              <button
                type="button"
                key={tab}
                className={`sw-nav-tab${activeTab === tab ? " active" : ""}`}
                onClick={() => setActiveTab(tab)}
                data-ocid={`nav.${tab.toLowerCase()}.tab`}
              >
                {tab}
              </button>
            ))}
          </nav>
          <div className="sw-header-actions">
            <button
              type="button"
              className={`sw-atmos-badge${atmos ? " active" : ""}`}
              onClick={() => setAtmos((a) => !a)}
              data-ocid="atmos.toggle"
            >
              <div className="sw-atmos-dot" />
              Dolby Atmos
            </button>
          </div>
        </header>

        {/* CONTENT */}
        <div className="sw-content">
          {/* SIDEBAR */}
          <aside className="sw-sidebar">
            <div className="sw-sidebar-section">
              <div className="sw-sidebar-label">Browse</div>
              {browseItems.map((item) => (
                <div
                  key={item.label}
                  className={`sw-sidebar-item${item.active ? " active" : ""}`}
                >
                  <span className="sw-sidebar-icon">{item.icon}</span>{" "}
                  {item.label}
                </div>
              ))}
            </div>
            <div className="sw-sidebar-section">
              <div className="sw-sidebar-label">Your Music</div>
              {libraryItems.map((item) => (
                <div key={item.label} className="sw-sidebar-item">
                  <span className="sw-sidebar-icon">{item.icon}</span>{" "}
                  {item.label}
                </div>
              ))}
            </div>
            <div className="sw-sidebar-section">
              <div className="sw-sidebar-label">Up Next</div>
              {tracks.map((t, i) => (
                <button
                  type="button"
                  key={t.title}
                  className={`sw-queue-item${i === currentTrack ? " playing" : ""}`}
                  onClick={() => switchTrack(i)}
                  data-ocid={`queue.item.${i + 1}`}
                >
                  <div className="sw-queue-num">{i + 1}</div>
                  <div className="sw-queue-bars">
                    <div className="sw-queue-bar" />
                    <div className="sw-queue-bar" />
                    <div className="sw-queue-bar" />
                  </div>
                  <div className="sw-queue-info">
                    <div className="sw-queue-title">{t.title}</div>
                    <div className="sw-queue-artist">{t.artist}</div>
                  </div>
                  <div className="sw-queue-dur">{t.duration}</div>
                </button>
              ))}
            </div>
          </aside>

          {/* STAGE */}
          <main
            ref={stageRef}
            className={`sw-stage${playing ? " playing" : ""}`}
          >
            {/* Album Art */}
            <div className="sw-album-container" ref={albumContainerRef}>
              <div
                className="sw-album-aura"
                style={{
                  background: `radial-gradient(circle, ${track.glow.replace(/[\d.]+\)/, "0.6)")} 0%, transparent 70%)`,
                }}
              />
              <div className="sw-album-ring" />
              <div className="sw-album-art">{track.art}</div>
            </div>

            {/* EQ Bars */}
            <div className="sw-eq-container" ref={eqContainerRef}>
              {Array.from({ length: 18 }).map((_, i) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: static array
                <div key={i} className="sw-eq-bar" />
              ))}
            </div>

            {/* Track Info */}
            <div
              className={`sw-track-info${trackInfoChanging ? " changing" : ""}`}
            >
              <div className="sw-track-title">{track.title}</div>
              <div className="sw-track-artist">
                {track.artist} · {track.album}
              </div>
              <div className="sw-track-tags">
                <span className="sw-track-tag sw-tag-quality">LOSSLESS</span>
                {atmos && (
                  <span className="sw-track-tag sw-tag-atmos">ATMOS</span>
                )}
              </div>
            </div>

            {/* Progress */}
            <div className="sw-progress-section">
              <div className="sw-progress-times">
                <span>{currentTimeStr}</span>
                <span>{totalTimeStr}</span>
              </div>
              <div className="sw-progress-track" ref={progressTrackRef}>
                <div
                  className={`sw-progress-fill${progPulsing ? " pulsing" : ""}`}
                  style={{ width: pct }}
                >
                  <div className="sw-progress-thumb" />
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="sw-controls">
              <button
                type="button"
                className={`sw-ctrl-btn${shuffle ? " active" : ""}`}
                onClick={() => setShuffle((s) => !s)}
                title="Shuffle"
                data-ocid="player.shuffle.toggle"
              >
                ⇄
              </button>
              <button
                type="button"
                className="sw-ctrl-btn"
                onClick={goPrev}
                title="Previous"
                data-ocid="player.prev.button"
              >
                ⏮
              </button>
              <div className="sw-play-btn-wrap">
                <button
                  type="button"
                  className={`sw-play-btn${playBeat ? " beat" : ""}`}
                  onClick={togglePlay}
                  title="Play/Pause"
                  data-ocid="player.play.button"
                  style={{ position: "relative", overflow: "hidden" }}
                >
                  {playing ? "⏸" : "▶"}
                  {ripples.map((r) => (
                    <span
                      key={r.id}
                      className="sw-ripple"
                      style={{
                        width: r.size,
                        height: r.size,
                        left: r.x,
                        top: r.y,
                      }}
                    />
                  ))}
                </button>
              </div>
              <button
                type="button"
                className="sw-ctrl-btn"
                onClick={goNext}
                title="Next"
                data-ocid="player.next.button"
              >
                ⏭
              </button>
              <button
                type="button"
                className={`sw-ctrl-btn${repeat ? " active" : ""}`}
                onClick={() => setRepeat((r) => !r)}
                title="Repeat"
                data-ocid="player.repeat.toggle"
              >
                ↺
              </button>
            </div>

            {/* Volume */}
            <div className="sw-volume-section">
              <span className="sw-vol-icon">🔈</span>
              <div className="sw-vol-track" ref={volTrackRef}>
                <div
                  className="sw-vol-fill"
                  style={{ width: `${volume * 100}%` }}
                >
                  <div className="sw-vol-thumb" />
                </div>
              </div>
              <span className="sw-vol-icon">🔊</span>
            </div>
          </main>

          {/* FEATURED */}
          <section className="sw-featured-section">
            <div className="sw-featured-header">
              <div className="sw-featured-title">Featured Playlists</div>
              <div className="sw-see-all">See all →</div>
            </div>
            <div className="sw-cards-grid">
              {playlists.map((p, i) => (
                <div
                  key={p.name}
                  className="sw-card"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <div className="sw-card-art">{p.art}</div>
                  <div className="sw-card-info">
                    <div className="sw-card-name">{p.name}</div>
                    <div className="sw-card-sub">{p.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <div className="sw-featured-header">
              <div className="sw-featured-title">Trending Now</div>
              <div className="sw-see-all">See all →</div>
            </div>
            <div className="sw-cards-grid">
              {trending.map((t, i) => (
                <div
                  key={t.name}
                  className="sw-card"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <div className="sw-card-art">{t.art}</div>
                  <div className="sw-card-info">
                    <div className="sw-card-name">{t.name}</div>
                    <div className="sw-card-sub">{t.sub}</div>
                  </div>
                </div>
              ))}
            </div>
            <footer className="sw-footer">
              © {new Date().getFullYear()}. Built with ❤️ using{" "}
              <a
                href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                caffeine.ai
              </a>
            </footer>
          </section>
        </div>

        {/* NOW PLAYING BAR */}
        <div
          ref={barRef}
          className={`sw-now-playing-bar${playing ? " playing" : ""}${atmos ? " atmos-on" : ""}`}
        >
          <div className="sw-atmos-aura">
            <div className="sw-atmos-wave" />
            <div className="sw-atmos-wave" />
            <div className="sw-atmos-wave" />
          </div>

          <div className="sw-bar-track">
            <div className="sw-bar-art">{track.art}</div>
            <div className="sw-bar-info">
              <div className="sw-bar-title">{track.title}</div>
              <div className="sw-bar-artist">{track.artist}</div>
            </div>
            <button
              type="button"
              className={`sw-bar-heart${liked ? " liked" : ""}`}
              onClick={() => setLiked((l) => !l)}
              data-ocid="player.like.toggle"
            >
              {liked ? "♥" : "♡"}
            </button>
          </div>

          <div className="sw-bar-controls">
            <button
              type="button"
              className="sw-bar-ctrl"
              onClick={goPrev}
              data-ocid="bar.prev.button"
            >
              ⏮
            </button>
            <button
              type="button"
              className="sw-bar-play"
              onClick={togglePlay}
              data-ocid="bar.play.button"
            >
              {playing ? "⏸" : "▶"}
            </button>
            <button
              type="button"
              className="sw-bar-ctrl"
              onClick={goNext}
              data-ocid="bar.next.button"
            >
              ⏭
            </button>
          </div>

          <div className="sw-bar-progress">
            <div className="sw-bar-prog-track">
              <div className="sw-bar-prog-fill" style={{ width: pct }} />
            </div>
            <div className="sw-bar-times">
              <span>{currentTimeStr}</span>
              <span>{totalTimeStr}</span>
            </div>
          </div>

          <div className="sw-bar-right">
            <div className="sw-bar-vol">
              <span className="sw-bar-icon">🔊</span>
              <div className="sw-bar-vol-track">
                <div
                  className="sw-bar-vol-fill"
                  style={{ width: `${volume * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
