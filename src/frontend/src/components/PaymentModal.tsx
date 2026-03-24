import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";

export interface PlanInfo {
  name: string;
  price: string;
  amountPaise: number;
  period: string;
  color: string;
}

interface PaymentModalProps {
  isOpen: boolean;
  plan: PlanInfo;
  onClose: () => void;
  onSuccess: () => void;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  handler: (response: { razorpay_payment_id: string }) => void;
  prefill?: { name?: string; email?: string };
  theme?: { color?: string };
  modal?: { ondismiss?: () => void };
}

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_demo";

const PLAN_FEATURES: Record<string, string[]> = {
  Premium: [
    "No ads ever",
    "Unlimited skips",
    "HD Audio quality",
    "All devices",
    "Offline mode",
  ],
  Family: [
    "6 accounts",
    "No ads",
    "Spatial Audio",
    "All devices",
    "Offline + Downloads",
    "Family Mix playlist",
  ],
};

type Step = "form" | "processing" | "success";

export default function PaymentModal({
  isOpen,
  plan,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [step, setStep] = useState<Step>("form");
  const [isDemo, setIsDemo] = useState(false);

  const handleClose = useCallback(() => {
    setStep("form");
    setIsDemo(false);
    onClose();
  }, [onClose]);

  const handleSuccess = useCallback(() => {
    localStorage.setItem("sw_premium", "true");
    setStep("success");
    setTimeout(() => {
      onSuccess();
      setStep("form");
      setIsDemo(false);
      onClose();
    }, 2000);
  }, [onSuccess, onClose]);

  const handlePay = useCallback(async () => {
    const isTestKey = RAZORPAY_KEY === "rzp_test_demo" || !RAZORPAY_KEY;
    if (isTestKey) {
      // Demo mode
      setIsDemo(true);
      setStep("processing");
      setTimeout(() => handleSuccess(), 2000);
      return;
    }

    setStep("processing");

    // Load Razorpay script if not already loaded
    if (!window.Razorpay) {
      await new Promise<void>((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve();
        script.onerror = () => reject(new Error("Razorpay failed to load"));
        document.head.appendChild(script);
      });
    }

    const options: RazorpayOptions = {
      key: RAZORPAY_KEY,
      amount: plan.amountPaise,
      currency: "INR",
      name: "Soundwave",
      description: `${plan.name} Plan - ${plan.period}`,
      handler: () => handleSuccess(),
      theme: { color: "#1DB954" },
      modal: {
        ondismiss: () => setStep("form"),
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  }, [plan, handleSuccess]);

  const features = PLAN_FEATURES[plan.name] ?? [
    "No ads",
    "Unlimited skips",
    "All devices",
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          data-ocid="payment.modal"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(16px)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 24, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "linear-gradient(145deg, #141420, #0e0e1a)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 20,
              padding: "32px 28px",
              width: "100%",
              maxWidth: 420,
              position: "relative",
            }}
          >
            {step !== "success" && (
              <button
                data-ocid="payment.close_button"
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
            )}

            {step === "form" && (
              <>
                <div style={{ marginBottom: 20 }}>
                  <div
                    style={{
                      color: plan.color,
                      fontWeight: 800,
                      fontSize: 13,
                      letterSpacing: "0.08em",
                      marginBottom: 4,
                    }}
                  >
                    UPGRADE TO {plan.name.toUpperCase()}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "baseline",
                      gap: 6,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 36,
                        fontWeight: 900,
                        color: "#fff",
                        letterSpacing: "-0.02em",
                      }}
                    >
                      {plan.price}
                    </span>
                    <span style={{ color: "#6a6a6a", fontSize: 14 }}>
                      /{plan.period}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 12,
                    padding: "14px 16px",
                    marginBottom: 20,
                  }}
                >
                  {features.map((f) => (
                    <div
                      key={f}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        marginBottom: 8,
                        fontSize: 13,
                      }}
                    >
                      <span style={{ color: plan.color }}>✓</span>
                      <span style={{ color: "#b3b3b3" }}>{f}</span>
                    </div>
                  ))}
                </div>

                <div
                  style={{
                    background: "rgba(29,185,84,0.08)",
                    border: "1px solid rgba(29,185,84,0.2)",
                    borderRadius: 10,
                    padding: "10px 14px",
                    display: "flex",
                    justifyContent: "space-between",
                    marginBottom: 16,
                    fontSize: 13,
                  }}
                >
                  <span style={{ color: "#b3b3b3" }}>Total today</span>
                  <span style={{ color: "#1DB954", fontWeight: 800 }}>
                    {plan.price}
                  </span>
                </div>

                <button
                  data-ocid="payment.submit_button"
                  type="button"
                  onClick={handlePay}
                  style={{
                    width: "100%",
                    background: "linear-gradient(135deg, #1DB954, #00B8FF)",
                    border: "none",
                    borderRadius: 12,
                    padding: "13px",
                    color: "#000",
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: "pointer",
                    letterSpacing: "0.02em",
                  }}
                >
                  🔒 Pay Securely
                </button>
                <div
                  style={{
                    color: "#4a4a4a",
                    fontSize: 11,
                    textAlign: "center",
                    marginTop: 10,
                  }}
                >
                  256-bit SSL encryption · Cancel anytime
                </div>
              </>
            )}

            {step === "processing" && (
              <div
                data-ocid="payment.loading_state"
                style={{ textAlign: "center", padding: "24px 0" }}
              >
                <div
                  style={{
                    width: 56,
                    height: 56,
                    border: "3px solid rgba(29,185,84,0.2)",
                    borderTopColor: "#1DB954",
                    borderRadius: "50%",
                    margin: "0 auto 20px",
                    animation: "spin 0.8s linear infinite",
                  }}
                />
                <div style={{ color: "#fff", fontWeight: 700, fontSize: 16 }}>
                  {isDemo ? "Demo Payment" : "Processing..."}
                </div>
                <div style={{ color: "#6a6a6a", fontSize: 13, marginTop: 6 }}>
                  {isDemo
                    ? "Simulating payment flow..."
                    : "Please don't close this window"}
                </div>
              </div>
            )}

            {step === "success" && (
              <motion.div
                data-ocid="payment.success_state"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ textAlign: "center", padding: "24px 0" }}
              >
                <div style={{ fontSize: 60, marginBottom: 16 }}>✅</div>
                <div
                  style={{
                    color: "#1DB954",
                    fontSize: 22,
                    fontWeight: 800,
                    marginBottom: 8,
                  }}
                >
                  Welcome to Premium!
                </div>
                <div style={{ color: "#b3b3b3", fontSize: 14 }}>
                  {plan.name} plan activated. Enjoy unlimited music! 🎵
                </div>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
