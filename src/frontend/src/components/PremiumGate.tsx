import { AnimatePresence, motion } from "motion/react";

interface PremiumGateProps {
  isLocked: boolean;
  onUpgrade: () => void;
  children: React.ReactNode;
  featureName?: string;
}

export default function PremiumGate({
  isLocked,
  onUpgrade,
  children,
  featureName = "this feature",
}: PremiumGateProps) {
  if (!isLocked) return <>{children}</>;
  return (
    <div style={{ position: "relative" }}>
      <div
        style={{
          filter: "blur(4px)",
          pointerEvents: "none",
          userSelect: "none",
          opacity: 0.5,
        }}
      >
        {children}
      </div>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            borderRadius: 16,
            gap: 12,
            zIndex: 5,
          }}
        >
          <div style={{ fontSize: 32 }}>🔒</div>
          <div style={{ color: "#fff", fontWeight: 800, fontSize: 16 }}>
            Premium Feature
          </div>
          <div
            style={{
              color: "#b3b3b3",
              fontSize: 13,
              textAlign: "center",
              maxWidth: 200,
            }}
          >
            Unlock {featureName} and more with Premium
          </div>
          <button
            type="button"
            onClick={onUpgrade}
            style={{
              background: "linear-gradient(135deg, #1DB954, #00B8FF)",
              border: "none",
              borderRadius: 10,
              padding: "10px 24px",
              color: "#000",
              fontWeight: 800,
              fontSize: 13,
              cursor: "pointer",
              marginTop: 4,
            }}
          >
            Upgrade to Premium
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
