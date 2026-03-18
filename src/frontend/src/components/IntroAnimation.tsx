import { useEffect, useRef, useState } from "react";

interface IntroAnimationProps {
  onDone: () => void;
}

const BAR_KEYS = ["b1", "b2", "b3", "b4", "b5", "b6", "b7"];

export default function IntroAnimation({ onDone }: IntroAnimationProps) {
  const [phase, setPhase] = useState<"enter" | "exit">("enter");
  const doneRef = useRef(false);

  useEffect(() => {
    // Start exit fade at 2.5s
    const exitTimer = setTimeout(() => setPhase("exit"), 2500);
    // Call onDone at 3s
    const doneTimer = setTimeout(() => {
      if (!doneRef.current) {
        doneRef.current = true;
        try {
          sessionStorage.setItem("sw_intro_seen", "1");
        } catch (_) {
          // ignore storage errors
        }
        onDone();
      }
    }, 3000);

    return () => {
      clearTimeout(exitTimer);
      clearTimeout(doneTimer);
    };
  }, [onDone]);

  return (
    <>
      <style>{`
        @keyframes sw-enter {
          from { opacity: 0; transform: scale(0.85); }
          to   { opacity: 1; transform: scale(1); }
        }

        @keyframes sw-sweep {
          0%   { left: -60%; }
          100% { left: 120%; }
        }

        @keyframes sw-bar-1 {
          0%, 100% { transform: scaleY(0.15); }
          50%       { transform: scaleY(1); }
        }
        @keyframes sw-bar-2 {
          0%, 100% { transform: scaleY(0.25); }
          50%       { transform: scaleY(0.85); }
        }
        @keyframes sw-bar-3 {
          0%, 100% { transform: scaleY(0.4); }
          50%       { transform: scaleY(1.1); }
        }
        @keyframes sw-bar-4 {
          0%, 100% { transform: scaleY(0.2); }
          50%       { transform: scaleY(0.95); }
        }
        @keyframes sw-bar-5 {
          0%, 100% { transform: scaleY(0.3); }
          50%       { transform: scaleY(0.75); }
        }
        @keyframes sw-bar-6 {
          0%, 100% { transform: scaleY(0.5); }
          50%       { transform: scaleY(1.05); }
        }
        @keyframes sw-bar-7 {
          0%, 100% { transform: scaleY(0.1); }
          50%       { transform: scaleY(0.9); }
        }

        .sw-intro-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: radial-gradient(ellipse 60% 50% at 50% 50%, #1a0a2e 0%, #0a0010 45%, #000 100%);
          transition: opacity 0.5s ease;
        }

        .sw-intro-content {
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          animation: sw-enter 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }

        .sw-title-wrap {
          position: relative;
          overflow: hidden;
        }

        .sw-title {
          font-family: 'Bricolage Grotesque', 'Inter', sans-serif;
          font-weight: 800;
          font-size: clamp(3rem, 10vw, 7rem);
          letter-spacing: -0.02em;
          color: #ffffff;
          text-shadow:
            0 0 30px oklch(0.72 0.28 290),
            0 0 60px oklch(0.6 0.22 290),
            0 0 120px oklch(0.5 0.18 290);
          line-height: 1;
          user-select: none;
        }

        .sw-sweep {
          position: absolute;
          top: 0;
          bottom: 0;
          width: 50%;
          background: linear-gradient(
            105deg,
            transparent 20%,
            rgba(255, 255, 255, 0.55) 50%,
            transparent 80%
          );
          animation: sw-sweep 0.55s ease 0.35s forwards;
          left: -60%;
          pointer-events: none;
        }

        .sw-subtitle {
          font-family: 'Inter', sans-serif;
          font-size: clamp(0.85rem, 2.5vw, 1.25rem);
          font-weight: 400;
          letter-spacing: 0.35em;
          text-transform: uppercase;
          color: oklch(0.65 0.1 285);
          user-select: none;
        }

        .sw-bars {
          display: flex;
          align-items: flex-end;
          gap: 5px;
          height: 60px;
          margin-top: 32px;
        }

        .sw-bar {
          width: 4px;
          height: 60px;
          border-radius: 3px;
          background: oklch(0.62 0.22 290 / 0.55);
          transform-origin: bottom;
          animation-duration: 1.1s;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
        }

        .sw-bar:nth-child(1) { animation-name: sw-bar-1; animation-delay: 0s; }
        .sw-bar:nth-child(2) { animation-name: sw-bar-2; animation-delay: 0.12s; }
        .sw-bar:nth-child(3) { animation-name: sw-bar-3; animation-delay: 0.22s; }
        .sw-bar:nth-child(4) { animation-name: sw-bar-4; animation-delay: 0.08s; }
        .sw-bar:nth-child(5) { animation-name: sw-bar-5; animation-delay: 0.18s; }
        .sw-bar:nth-child(6) { animation-name: sw-bar-6; animation-delay: 0.28s; }
        .sw-bar:nth-child(7) { animation-name: sw-bar-7; animation-delay: 0.05s; }

        @media (prefers-reduced-motion: reduce) {
          .sw-intro-content { animation: none; opacity: 1; }
          .sw-sweep { animation: none; display: none; }
          .sw-bar { animation: none; transform: scaleY(0.5); }
        }
      `}</style>

      <div
        className="sw-intro-overlay"
        style={{ opacity: phase === "exit" ? 0 : 1 }}
        data-ocid="intro.modal"
      >
        <div className="sw-intro-content">
          <div className="sw-title-wrap">
            <span className="sw-title">Soundwave</span>
            <div className="sw-sweep" aria-hidden="true" />
          </div>
          <span className="sw-subtitle">Music Player</span>
          <div className="sw-bars" aria-hidden="true">
            {BAR_KEYS.map((k) => (
              <div key={k} className="sw-bar" />
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
