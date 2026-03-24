import { useCallback, useEffect, useState } from "react";

const LS_PREMIUM = "sw_premium";
const LS_EXPIRY = "sw_premium_expiry";

function checkPremium(): { isPremium: boolean; daysLeft: number } {
  const flag = localStorage.getItem(LS_PREMIUM);
  if (flag !== "true") return { isPremium: false, daysLeft: 0 };
  const expiry = localStorage.getItem(LS_EXPIRY);
  if (!expiry) return { isPremium: true, daysLeft: 30 };
  const ms = Number.parseInt(expiry, 10) - Date.now();
  if (ms <= 0) {
    localStorage.removeItem(LS_PREMIUM);
    localStorage.removeItem(LS_EXPIRY);
    return { isPremium: false, daysLeft: 0 };
  }
  return { isPremium: true, daysLeft: Math.ceil(ms / 86400000) };
}

export function usePremium() {
  const [state, setState] = useState(checkPremium);

  useEffect(() => {
    setState(checkPremium());
  }, []);

  const activatePremium = useCallback(() => {
    const expiry = Date.now() + 30 * 24 * 60 * 60 * 1000;
    localStorage.setItem(LS_PREMIUM, "true");
    localStorage.setItem(LS_EXPIRY, String(expiry));
    setState({ isPremium: true, daysLeft: 30 });
  }, []);

  const clearPremium = useCallback(() => {
    localStorage.removeItem(LS_PREMIUM);
    localStorage.removeItem(LS_EXPIRY);
    setState({ isPremium: false, daysLeft: 0 });
  }, []);

  const expiryDate = state.isPremium
    ? (() => {
        const exp = localStorage.getItem(LS_EXPIRY);
        if (!exp) return null;
        return new Date(Number.parseInt(exp, 10));
      })()
    : null;

  return { ...state, activatePremium, clearPremium, expiryDate };
}
