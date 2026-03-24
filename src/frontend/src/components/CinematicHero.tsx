import { Info, Play } from "lucide-react";
/**
 * CinematicHero — Netflix/Apple TV+ style hero with reliable image + optional video.
 */
import { type Variants, motion } from "motion/react";
import { useEffect, useRef, useState } from "react";

// Reliable Unsplash concert image as primary background
const HERO_IMAGE_URL =
  "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=1920&q=80";
// Video as a bonus layer (hidden on error)
const HERO_VIDEO_URL =
  "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4";

interface CinematicHeroProps {
  onPlay: () => void;
  onMoreInfo?: () => void;
}

interface GsapLike {
  fromTo(
    target: unknown,
    from: Record<string, unknown>,
    to: Record<string, unknown>,
  ): void;
}

declare global {
  interface Window {
    gsap?: GsapLike;
  }
}

function loadGsap(): Promise<GsapLike | null> {
  if (window.gsap) return Promise.resolve(window.gsap);
  return new Promise((resolve) => {
    const s = document.createElement("script");
    s.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js";
    s.onload = () => resolve(window.gsap ?? null);
    s.onerror = () => resolve(null);
    document.head.appendChild(s);
  });
}

export default function CinematicHero({
  onPlay,
  onMoreInfo,
}: CinematicHeroProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [videoError, setVideoError] = useState(false);

  // GSAP Ken Burns zoom on the image
  useEffect(() => {
    const img = imgRef.current;
    if (!img) return;
    loadGsap().then((gsap) => {
      if (!gsap || !imgRef.current) return;
      gsap.fromTo(
        imgRef.current,
        { scale: 1.1, opacity: 0.8 },
        { scale: 1.0, opacity: 1, duration: 3.0, ease: "power3.out" },
      );
    });
  }, []);

  const containerVariants = {
    hidden: {},
    visible: { transition: { staggerChildren: 0.18, delayChildren: 0.4 } },
  };
  const itemVariants: Variants = {
    hidden: { opacity: 0, y: 28 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.65, ease: "easeOut" as const },
    },
  };

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl"
      style={{ minHeight: "clamp(280px, 44vw, 560px)", position: "relative" }}
    >
      {/* ── Background image (always visible, z-index 0) ─────────── */}
      <img
        ref={imgRef}
        src={HERO_IMAGE_URL}
        alt="Hero background"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          zIndex: 0,
        }}
      />

      {/* ── Video overlay (bonus, hidden on error, z-index 1) ─────── */}
      {!videoError && (
        <video
          ref={videoRef}
          src={HERO_VIDEO_URL}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "cover", zIndex: 1 }}
          onError={() => setVideoError(true)}
        />
      )}

      {/* ── Gradient overlays (z-index 2) ─────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.2) 100%)",
          zIndex: 2,
        }}
      />
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(0,0,0,0.88) 0%, transparent 60%)",
          zIndex: 2,
        }}
      />

      {/* ── Purple ambient glow (z-index 2) ───────────────────────── */}
      <div
        className="absolute hero-glow-pulse"
        style={{
          top: "30%",
          left: "38%",
          width: 500,
          height: 300,
          borderRadius: "50%",
          background:
            "radial-gradient(ellipse, rgba(139,92,246,0.22) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
          zIndex: 2,
        }}
      />

      {/* ── Content (z-index 3) ───────────────────────────────────── */}
      <motion.div
        className="absolute inset-0 flex flex-col justify-end"
        style={{ padding: "clamp(20px, 4vw, 48px)", zIndex: 3 }}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          variants={itemVariants}
          className="text-[11px] font-bold uppercase tracking-[0.22em] mb-3"
          style={{ color: "#1DB954" }}
        >
          ✦ Featured Experience
        </motion.div>

        <motion.h1
          variants={itemVariants}
          className="font-black text-white mb-2"
          style={{
            fontSize: "clamp(2rem, 5vw, 3.6rem)",
            letterSpacing: "-0.03em",
            lineHeight: 1.05,
            textShadow:
              "0 4px 32px rgba(0,0,0,0.9), 0 0 60px rgba(139,92,246,0.3)",
          }}
        >
          Soundwave
        </motion.h1>

        <motion.p
          variants={itemVariants}
          className="mb-2 font-semibold"
          style={{
            color: "rgba(255,255,255,0.7)",
            fontSize: "clamp(0.85rem, 1.6vw, 1.05rem)",
          }}
        >
          Premium Music Experience · 10M+ tracks
        </motion.p>

        <motion.p
          variants={itemVariants}
          className="mb-6 text-sm"
          style={{ color: "rgba(255,255,255,0.45)", maxWidth: 360 }}
        >
          Discover, stream, and immerse yourself in music.
        </motion.p>

        <motion.div
          variants={itemVariants}
          className="flex items-center gap-3 flex-wrap"
        >
          <motion.button
            type="button"
            data-ocid="hero.play.button"
            onClick={onPlay}
            whileHover={{
              scale: 1.06,
              boxShadow: "0 0 40px rgba(29,185,84,0.7)",
            }}
            whileTap={{ scale: 0.97 }}
            className="hero-btn-primary flex items-center gap-2.5 rounded-full px-7 py-3 font-bold text-black text-sm"
            style={{
              background: "#1DB954",
              boxShadow:
                "0 0 32px rgba(29,185,84,0.5), 0 4px 16px rgba(0,0,0,0.3)",
              border: "none",
              cursor: "pointer",
            }}
          >
            <Play size={16} fill="#000" stroke="none" aria-hidden="true" />
            Play Now
          </motion.button>

          <motion.button
            type="button"
            data-ocid="hero.more_info.button"
            onClick={onMoreInfo}
            whileHover={{ scale: 1.06, background: "rgba(255,255,255,0.22)" }}
            whileTap={{ scale: 0.97 }}
            className="hero-btn-secondary flex items-center gap-2 rounded-full px-6 py-3 font-semibold text-sm"
            style={{
              background: "rgba(255,255,255,0.12)",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "#fff",
              backdropFilter: "blur(8px)",
              cursor: "pointer",
            }}
          >
            <Info size={15} aria-hidden="true" />
            More Info
          </motion.button>
        </motion.div>
      </motion.div>

      {/* ── Bottom fade ───────────────────────────────────────────── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent, var(--bg-base, #0a0a0a))",
          zIndex: 3,
        }}
      />
    </div>
  );
}
