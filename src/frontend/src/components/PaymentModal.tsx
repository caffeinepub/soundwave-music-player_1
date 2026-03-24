import { AnimatePresence, motion } from "motion/react";
import { useCallback, useState } from "react";
import { usePremium } from "../hooks/usePremium";

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

interface RazorpayPaymentResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  image?: string;
  handler: (response: RazorpayPaymentResponse) => void;
  prefill?: { name?: string; email?: string; contact?: string };
  config?: {
    display?: {
      blocks?: Record<
        string,
        { name: string; instruments: { method: string; flows?: string[] }[] }
      >;
      sequence?: string[];
      preferences?: { show_default_blocks: boolean };
    };
  };
  theme?: { color?: string; hide_topbar?: boolean };
  modal?: { ondismiss?: () => void; animation?: boolean };
}

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY_ID || "";

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

type Step = "form" | "processing" | "success" | "failed";
type PaymentMethod = "razorpay" | "upi";

async function loadRazorpay(): Promise<void> {
  if (window.Razorpay) return;
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Razorpay failed to load"));
    document.head.appendChild(script);
  });
}

export default function PaymentModal({
  isOpen,
  plan,
  onClose,
  onSuccess,
}: PaymentModalProps) {
  const [step, setStep] = useState<Step>("form");
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("razorpay");
  const { activatePremium } = usePremium();

  const handleClose = useCallback(() => {
    if (step === "processing") return;
    setStep("form");
    setPaymentId(null);
    setErrorMsg("");
    onClose();
  }, [onClose, step]);

  const handleSuccess = useCallback(
    (pid: string) => {
      setPaymentId(pid);
      activatePremium();
      localStorage.setItem("sw_premium", "true");
      setStep("success");
      setTimeout(() => {
        onSuccess();
        setStep("form");
        setPaymentId(null);
        onClose();
      }, 3000);
    },
    [onSuccess, onClose, activatePremium],
  );

  const handleFailure = useCallback((msg?: string) => {
    setErrorMsg(msg || "Payment was not completed. Please try again.");
    setStep("failed");
  }, []);

  const handleRazorpay = useCallback(async () => {
    const isDemoKey = !RAZORPAY_KEY || RAZORPAY_KEY === "rzp_test_XXXX";
    if (isDemoKey) {
      setStep("processing");
      setTimeout(() => handleSuccess(`demo_pay_${Date.now()}`), 2000);
      return;
    }
    setStep("processing");
    try {
      await loadRazorpay();
    } catch {
      handleFailure("Could not load Razorpay. Check your connection.");
      return;
    }
    const options: RazorpayOptions = {
      key: RAZORPAY_KEY,
      amount: plan.amountPaise,
      currency: "INR",
      name: "Soundwave",
      description: `${plan.name} Plan - ${plan.period}`,
      config: {
        display: {
          blocks: {
            upi_block: {
              name: "Pay via UPI",
              instruments: [{ method: "upi", flows: ["collect", "intent"] }],
            },
            card_block: {
              name: "Pay via Card",
              instruments: [{ method: "card" }],
            },
            nb_block: {
              name: "Net Banking",
              instruments: [{ method: "netbanking" }],
            },
          },
          sequence: ["block.upi_block", "block.card_block", "block.nb_block"],
          preferences: { show_default_blocks: false },
        },
      },
      handler: (response: RazorpayPaymentResponse) => {
        handleSuccess(response.razorpay_payment_id);
      },
      theme: { color: "#1DB954", hide_topbar: false },
      modal: {
        animation: true,
        ondismiss: () => setStep("form"),
      },
    };
    try {
      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch {
      handleFailure("Failed to open payment window. Please try again.");
    }
  }, [plan, handleSuccess, handleFailure]);

  const handleUpiPaid = useCallback(() => {
    setStep("processing");
    setTimeout(() => handleSuccess(`upi_sim_${Date.now()}`), 2000);
  }, [handleSuccess]);

  const features = PLAN_FEATURES[plan.name] ?? [
    "No ads",
    "Unlimited skips",
    "All devices",
  ];
  const UPI_QR = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=soundwave@ybl%26pn=Soundwave%26am=${plan.amountPaise / 100}%26cu=INR`;

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
              maxWidth: 440,
              position: "relative",
            }}
          >
            {/* Close button */}
            {step !== "processing" && step !== "success" && (
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

            {/* ── FORM STEP ── */}
            {step === "form" && (
              <>
                {/* Plan header */}
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
                    style={{ display: "flex", alignItems: "baseline", gap: 6 }}
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

                {/* Features */}
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

                {/* Payment method tabs */}
                <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
                  {[
                    { id: "razorpay" as PaymentMethod, label: "💳 Razorpay" },
                    { id: "upi" as PaymentMethod, label: "📱 UPI Direct" },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      data-ocid={`payment.${tab.id}.tab`}
                      onClick={() => setPaymentMethod(tab.id)}
                      style={{
                        flex: 1,
                        padding: "10px",
                        borderRadius: 10,
                        border:
                          paymentMethod === tab.id
                            ? `1px solid ${plan.color}`
                            : "1px solid rgba(255,255,255,0.1)",
                        background:
                          paymentMethod === tab.id
                            ? `${plan.color}18`
                            : "rgba(255,255,255,0.04)",
                        color:
                          paymentMethod === tab.id ? plan.color : "#b3b3b3",
                        fontWeight: 700,
                        fontSize: 13,
                        cursor: "pointer",
                        backdropFilter: "blur(8px)",
                        transition: "all 0.15s",
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Razorpay panel */}
                {paymentMethod === "razorpay" && (
                  <>
                    <div
                      style={{
                        display: "flex",
                        gap: 8,
                        marginBottom: 16,
                        flexWrap: "wrap",
                      }}
                    >
                      {[
                        { label: "PhonePe", color: "#5f259f" },
                        { label: "Google Pay", color: "#1a73e8" },
                        { label: "Any UPI App", color: "#1DB954" },
                        { label: "Card", color: "#f59e0b" },
                      ].map((m) => (
                        <span
                          key={m.label}
                          style={{
                            background: `${m.color}18`,
                            border: `1px solid ${m.color}44`,
                            borderRadius: 6,
                            padding: "3px 10px",
                            fontSize: 11,
                            color: m.color,
                            fontWeight: 600,
                          }}
                        >
                          {m.label}
                        </span>
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
                      onClick={handleRazorpay}
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
                      🔒 Pay Securely via Razorpay
                    </button>
                    <div
                      style={{
                        color: "#4a4a4a",
                        fontSize: 11,
                        textAlign: "center",
                        marginTop: 10,
                      }}
                    >
                      Powered by Razorpay · 256-bit SSL · Cancel anytime
                    </div>
                  </>
                )}

                {/* UPI Direct panel */}
                {paymentMethod === "upi" && (
                  <div style={{ textAlign: "center" }}>
                    <div
                      style={{
                        color: "#b3b3b3",
                        fontSize: 13,
                        marginBottom: 16,
                      }}
                    >
                      Scan QR or pay to UPI ID using PhonePe, Google Pay, or any
                      UPI app
                    </div>
                    <div
                      style={{
                        display: "inline-block",
                        padding: 12,
                        background: "#fff",
                        borderRadius: 12,
                        marginBottom: 16,
                      }}
                    >
                      <img
                        src={UPI_QR}
                        alt="UPI QR Code"
                        width={180}
                        height={180}
                        style={{ display: "block" }}
                      />
                    </div>
                    <div
                      style={{
                        background: "rgba(255,255,255,0.05)",
                        borderRadius: 10,
                        padding: "12px 16px",
                        marginBottom: 16,
                      }}
                    >
                      <div
                        style={{
                          color: "#6a6a6a",
                          fontSize: 11,
                          marginBottom: 4,
                        }}
                      >
                        UPI ID
                      </div>
                      <div
                        style={{
                          color: "#fff",
                          fontWeight: 800,
                          fontSize: 16,
                          letterSpacing: "0.02em",
                        }}
                      >
                        soundwave@ybl
                      </div>
                      <div
                        style={{ color: "#6a6a6a", fontSize: 12, marginTop: 4 }}
                      >
                        Pay ₹{plan.amountPaise / 100} using any UPI app
                      </div>
                    </div>
                    <button
                      data-ocid="payment.upi_paid.button"
                      type="button"
                      onClick={handleUpiPaid}
                      style={{
                        width: "100%",
                        background: "linear-gradient(135deg, #5f259f, #1DB954)",
                        border: "none",
                        borderRadius: 12,
                        padding: "13px",
                        color: "#fff",
                        fontWeight: 800,
                        fontSize: 14,
                        cursor: "pointer",
                        letterSpacing: "0.02em",
                      }}
                    >
                      ✅ I've Paid via UPI
                    </button>
                    <div
                      style={{
                        color: "#4a4a4a",
                        fontSize: 11,
                        textAlign: "center",
                        marginTop: 10,
                      }}
                    >
                      PhonePe · Google Pay · Paytm · Any UPI App
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ── PROCESSING ── */}
            {step === "processing" && (
              <div
                data-ocid="payment.loading_state"
                style={{ textAlign: "center", padding: "32px 0" }}
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
                  Processing Payment...
                </div>
                <div style={{ color: "#6a6a6a", fontSize: 13, marginTop: 6 }}>
                  Please wait a moment
                </div>
              </div>
            )}

            {/* ── SUCCESS ── */}
            {step === "success" && (
              <motion.div
                data-ocid="payment.success_state"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ textAlign: "center", padding: "24px 0" }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.3, 1] }}
                  transition={{ duration: 0.5, times: [0, 0.6, 1] }}
                  style={{ fontSize: 64, marginBottom: 16 }}
                >
                  ✅
                </motion.div>
                <div
                  style={{
                    color: "#1DB954",
                    fontSize: 22,
                    fontWeight: 800,
                    marginBottom: 8,
                  }}
                >
                  Payment Successful!
                </div>
                <div
                  style={{ color: "#b3b3b3", fontSize: 14, marginBottom: 8 }}
                >
                  {plan.name} plan activated. Enjoy unlimited music!
                </div>
                {paymentId && (
                  <div
                    style={{
                      background: "rgba(29,185,84,0.08)",
                      border: "1px solid rgba(29,185,84,0.2)",
                      borderRadius: 8,
                      padding: "6px 12px",
                      display: "inline-block",
                      fontSize: 11,
                      color: "#4a9a6a",
                      marginBottom: 8,
                      wordBreak: "break-all",
                    }}
                  >
                    Payment ID: {paymentId}
                  </div>
                )}
                <div style={{ color: "#6a6a6a", fontSize: 12 }}>
                  Valid for 30 days · Renews automatically
                </div>
              </motion.div>
            )}

            {/* ── FAILED ── */}
            {step === "failed" && (
              <motion.div
                data-ocid="payment.failed_state"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{ textAlign: "center", padding: "24px 0" }}
              >
                <div style={{ fontSize: 60, marginBottom: 16 }}>❌</div>
                <div
                  style={{
                    color: "#ff4d4d",
                    fontSize: 20,
                    fontWeight: 800,
                    marginBottom: 8,
                  }}
                >
                  Payment Failed
                </div>
                <div
                  style={{
                    color: "#b3b3b3",
                    fontSize: 13,
                    marginBottom: 24,
                    lineHeight: 1.5,
                  }}
                >
                  {errorMsg}
                </div>
                <button
                  type="button"
                  onClick={() => setStep("form")}
                  style={{
                    background: "linear-gradient(135deg, #1DB954, #00B8FF)",
                    border: "none",
                    borderRadius: 10,
                    padding: "11px 28px",
                    color: "#000",
                    fontWeight: 800,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  Try Again
                </button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
