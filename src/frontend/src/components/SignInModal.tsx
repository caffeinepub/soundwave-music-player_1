import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { type AuthUser, useAuth } from "../hooks/useAuth";

interface SignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (user: AuthUser) => void;
  onToast?: (msg: string) => void;
}

const Accent = "#1DB954";

export default function SignInModal({
  isOpen,
  onClose,
  onSuccess,
  onToast,
}: SignInModalProps) {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const [tab, setTab] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setEmail("");
    setPass("");
    setName("");
    setError(null);
    setLoading(false);
  }, []);

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleGoogle = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      onSuccess(user);
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleApple = () => {
    onToast?.("Apple Sign-In coming soon");
  };

  const handleSubmit = async () => {
    if (!email.trim() || !pass.trim()) {
      setError("Please fill in all fields");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithEmail(email.trim(), pass, tab === "signup");
      onSuccess(user);
      handleClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-ocid="signin.modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.8)",
            backdropFilter: "blur(12px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "16px",
          }}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#111118",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              padding: "36px 32px",
              width: "100%",
              maxWidth: 400,
              position: "relative",
            }}
          >
            {/* Close */}
            <button
              data-ocid="signin.close_button"
              type="button"
              onClick={handleClose}
              style={{
                position: "absolute",
                top: 14,
                right: 14,
                background: "rgba(255,255,255,0.06)",
                border: "none",
                borderRadius: "50%",
                width: 30,
                height: 30,
                color: "#b3b3b3",
                cursor: "pointer",
                fontSize: 14,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              ✕
            </button>

            {/* Logo */}
            <div style={{ textAlign: "center", marginBottom: 24 }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🎵</div>
              <div
                style={{
                  color: "#fff",
                  fontSize: 22,
                  fontWeight: 800,
                  letterSpacing: "-0.03em",
                }}
              >
                Soundwave
              </div>
              <div style={{ color: "#6a6a6a", fontSize: 13, marginTop: 4 }}>
                Premium Music Experience
              </div>
            </div>

            {/* Social buttons */}
            <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
              <button
                data-ocid="signin.google.button"
                type="button"
                onClick={handleGoogle}
                disabled={loading}
                style={socialBtnStyle}
              >
                <span style={{ color: "#EA4335", fontWeight: 800 }}>G</span>
                Google
              </button>
              <button
                data-ocid="signin.apple.button"
                type="button"
                onClick={handleApple}
                disabled={loading}
                style={socialBtnStyle}
              >
                <span style={{ fontSize: 16 }}>🍎</span>
                Apple
              </button>
            </div>

            {/* Divider */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "rgba(255,255,255,0.08)",
                }}
              />
              <span style={{ color: "#6a6a6a", fontSize: 12 }}>
                or continue with email
              </span>
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "rgba(255,255,255,0.08)",
                }}
              />
            </div>

            {/* Tab switcher */}
            <div
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.05)",
                borderRadius: 10,
                padding: 4,
                marginBottom: 16,
              }}
            >
              {(["signin", "signup"] as const).map((t) => (
                <button
                  key={t}
                  data-ocid={`signin.${t}.tab`}
                  type="button"
                  onClick={() => {
                    setTab(t);
                    setError(null);
                  }}
                  style={{
                    flex: 1,
                    padding: "8px",
                    borderRadius: 8,
                    border: "none",
                    background: tab === t ? Accent : "transparent",
                    color: tab === t ? "#000" : "#b3b3b3",
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  {t === "signin" ? "Sign In" : "Sign Up"}
                </button>
              ))}
            </div>

            {/* Inputs */}
            {tab === "signup" && (
              <input
                data-ocid="signin.name.input"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputStyle}
              />
            )}
            <input
              data-ocid="signin.email.input"
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={inputStyle}
            />
            <input
              data-ocid="signin.password.input"
              type="password"
              placeholder="Password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              style={inputStyle}
            />

            {/* Error */}
            {error && (
              <div
                data-ocid="signin.error_state"
                style={{
                  color: "#ff4d4d",
                  fontSize: 12,
                  marginBottom: 12,
                  padding: "8px 12px",
                  background: "rgba(255,77,77,0.1)",
                  borderRadius: 8,
                  border: "1px solid rgba(255,77,77,0.2)",
                }}
              >
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              data-ocid="signin.submit_button"
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              style={{
                width: "100%",
                background: loading
                  ? "rgba(29,185,84,0.3)"
                  : "linear-gradient(135deg, #1DB954, #00B8FF)",
                border: "none",
                borderRadius: 12,
                padding: "13px",
                color: loading ? Accent : "#000",
                fontWeight: 800,
                fontSize: 14,
                cursor: loading ? "not-allowed" : "pointer",
                letterSpacing: "0.02em",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              {loading ? (
                <>
                  <span
                    style={{
                      width: 16,
                      height: 16,
                      border: `2px solid ${Accent}`,
                      borderTopColor: "transparent",
                      borderRadius: "50%",
                      animation: "spin 0.8s linear infinite",
                      display: "inline-block",
                    }}
                  />
                  Signing in...
                </>
              ) : tab === "signin" ? (
                "→ Sign In"
              ) : (
                "→ Create Account"
              )}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const socialBtnStyle: React.CSSProperties = {
  flex: 1,
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  padding: "10px 8px",
  color: "#fff",
  fontSize: 13,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 6,
  fontWeight: 600,
  transition: "border-color 0.2s",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: 10,
  padding: "11px 14px",
  color: "#fff",
  fontSize: 14,
  marginBottom: 12,
  outline: "none",
  boxSizing: "border-box",
};
