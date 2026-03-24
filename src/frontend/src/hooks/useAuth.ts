import { useCallback, useEffect, useState } from "react";
import { FIREBASE_CONFIG, FIREBASE_ENABLED } from "../firebaseConfig";

export interface AuthUser {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  provider: "google" | "email" | "apple" | "demo";
}

const LS_KEY = "sw_auth_user";

// ── Module-level singleton ──────────────────────────────────────────────────
// All useAuth() instances share this single source of truth.
// When it changes, every subscribed component re-renders.

let _user: AuthUser | null = (() => {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch {
    return null;
  }
})();

let _loading = FIREBASE_ENABLED; // true only while Firebase resolves the initial session
let _authInitialized = false;

type Listener = (user: AuthUser | null, loading: boolean) => void;
const _listeners = new Set<Listener>();

function _notify() {
  for (const l of _listeners) l(_user, _loading);
}

function _setUser(user: AuthUser | null) {
  _user = user;
  if (user) {
    localStorage.setItem(LS_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(LS_KEY);
  }
  _notify();
}

function _setLoading(v: boolean) {
  _loading = v;
  _notify();
}

// ── Firebase lazy loader (runs once) ────────────────────────────────────────
// Uses new Function() to bypass TypeScript module resolution for optional deps.

let _cachedApp: unknown = null;
let _cachedAuth: unknown = null;

async function fbImport(mod: string): Promise<any> {
  return new Function("m", "return import(m)")(mod);
}

async function getFirebaseAuth(): Promise<unknown | null> {
  if (!FIREBASE_ENABLED) return null;
  try {
    const app = await fbImport("firebase/app");
    if (!_cachedApp) {
      _cachedApp =
        app.getApps().length > 0
          ? app.getApps()[0]
          : app.initializeApp(FIREBASE_CONFIG);
    }
    const authMod = await fbImport("firebase/auth");
    if (!_cachedAuth) {
      _cachedAuth = authMod.getAuth(_cachedApp);
    }
    return _cachedAuth;
  } catch (err) {
    console.error("[useAuth] Firebase load error:", err);
    return null;
  }
}

// ── Start onAuthStateChanged listener exactly once ──────────────────────────

async function _initFirebaseAuth() {
  if (_authInitialized || !FIREBASE_ENABLED) {
    if (!FIREBASE_ENABLED) _setLoading(false);
    return;
  }
  _authInitialized = true;

  try {
    const auth = await getFirebaseAuth();
    if (!auth) {
      _setLoading(false);
      return;
    }
    const authMod = await fbImport("firebase/auth");

    // Handle redirect result first (for mobile browsers where popup is blocked)
    try {
      const result = await authMod.getRedirectResult(auth);
      if (result?.user) {
        const fbUser = result.user;
        _setUser({
          uid: fbUser.uid,
          name: fbUser.displayName ?? fbUser.email?.split("@")[0] ?? "User",
          email: fbUser.email ?? "",
          photoURL: fbUser.photoURL ?? undefined,
          provider: "google",
        });
      }
    } catch {
      // redirect result errors are non-fatal
    }

    authMod.onAuthStateChanged(auth, (fbUser: any) => {
      if (fbUser) {
        _setUser({
          uid: fbUser.uid,
          name: fbUser.displayName ?? fbUser.email?.split("@")[0] ?? "User",
          email: fbUser.email ?? "",
          photoURL: fbUser.photoURL ?? undefined,
          provider:
            fbUser.providerData[0]?.providerId === "google.com"
              ? "google"
              : "email",
        });
      } else {
        _setUser(null);
      }
      _setLoading(false);
    });
  } catch (err) {
    console.error("[useAuth] Firebase init error:", err);
    _setLoading(false);
  }
}

// Kick off Firebase auth initialization immediately when module loads
_initFirebaseAuth();

// ── Hook ────────────────────────────────────────────────────────────────────

export function useAuth() {
  const [state, setState] = useState<{
    user: AuthUser | null;
    loading: boolean;
  }>(() => ({ user: _user, loading: _loading }));

  useEffect(() => {
    // Subscribe to singleton updates
    const listener: Listener = (user, loading) => {
      setState({ user, loading });
    };
    _listeners.add(listener);
    // Sync immediately in case state changed between render and effect
    setState({ user: _user, loading: _loading });
    return () => {
      _listeners.delete(listener);
    };
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthUser> => {
    if (!FIREBASE_ENABLED) {
      const u: AuthUser = {
        uid: `demo-google-${Date.now()}`,
        name: "Demo User",
        email: "demo@soundwave.app",
        photoURL: undefined,
        provider: "demo",
      };
      _setUser(u);
      return u;
    }

    const auth = await getFirebaseAuth();
    if (!auth) throw new Error("Firebase not available");
    const authMod = await fbImport("firebase/auth");
    const provider = new authMod.GoogleAuthProvider();
    provider.addScope("profile");
    provider.addScope("email");

    try {
      const cred = await authMod.signInWithPopup(auth, provider);
      const fbUser = cred.user;
      const u: AuthUser = {
        uid: fbUser.uid,
        name: fbUser.displayName ?? "User",
        email: fbUser.email ?? "",
        photoURL: fbUser.photoURL ?? undefined,
        provider: "google",
      };
      _setUser(u);
      return u;
    } catch (err: unknown) {
      const code = (err as { code?: string }).code;
      // Popup blocked — fall back to redirect (mobile browsers)
      if (
        code === "auth/popup-blocked" ||
        code === "auth/popup-closed-by-user" ||
        code === "auth/cancelled-popup-request"
      ) {
        await authMod.signInWithRedirect(auth, provider);
        // Page will reload — result handled by getRedirectResult above
        throw new Error("Redirecting to Google sign-in\u2026");
      }
      throw err;
    }
  }, []);

  const signInWithEmail = useCallback(
    async (
      email: string,
      pass: string,
      isSignUp: boolean,
    ): Promise<AuthUser> => {
      if (!email.includes("@") || !email.includes(".")) {
        throw new Error("Invalid email address");
      }
      if (pass.length < 6) {
        throw new Error("Password must be at least 6 characters");
      }

      if (!FIREBASE_ENABLED) {
        const u: AuthUser = {
          uid: `demo-email-${Date.now()}`,
          name: email.split("@")[0],
          email,
          provider: "demo",
        };
        _setUser(u);
        return u;
      }

      const auth = await getFirebaseAuth();
      if (!auth) throw new Error("Firebase not available");
      const authMod = await fbImport("firebase/auth");

      let fbUser: any;
      if (isSignUp) {
        const cred = await authMod.createUserWithEmailAndPassword(
          auth,
          email,
          pass,
        );
        fbUser = cred.user;
      } else {
        try {
          const cred = await authMod.signInWithEmailAndPassword(
            auth,
            email,
            pass,
          );
          fbUser = cred.user;
        } catch (err: unknown) {
          const code = (err as { code?: string }).code;
          if (code === "auth/user-not-found") {
            const cred = await authMod.createUserWithEmailAndPassword(
              auth,
              email,
              pass,
            );
            fbUser = cred.user;
          } else {
            throw err;
          }
        }
      }

      if (fbUser && !fbUser.displayName) {
        await authMod.updateProfile(fbUser, {
          displayName: email.split("@")[0],
        });
      }

      const u: AuthUser = {
        uid: fbUser.uid,
        name: fbUser.displayName ?? email.split("@")[0],
        email: fbUser.email ?? email,
        provider: "email",
      };
      _setUser(u);
      return u;
    },
    [],
  );

  const signOut = useCallback(async () => {
    if (FIREBASE_ENABLED) {
      try {
        const auth = await getFirebaseAuth();
        if (auth) {
          const authMod = await fbImport("firebase/auth");
          await authMod.signOut(auth);
        }
      } catch {
        // ignore
      }
    }
    _setUser(null);
  }, []);

  return {
    user: state.user,
    loading: state.loading,
    signInWithGoogle,
    signInWithEmail,
    signOut,
  };
}
