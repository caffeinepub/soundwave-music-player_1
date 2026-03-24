import { useCallback, useEffect, useState } from "react";

export interface AuthUser {
  uid: string;
  name: string;
  email: string;
  photoURL?: string;
  provider: "google" | "email" | "apple" | "demo";
}

const LS_KEY = "sw_auth_user";

const FIREBASE_API_KEY = import.meta.env.VITE_FIREBASE_API_KEY as
  | string
  | undefined;
const FIREBASE_AUTH_DOMAIN = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as
  | string
  | undefined;
const FIREBASE_PROJECT_ID = import.meta.env.VITE_FIREBASE_PROJECT_ID as
  | string
  | undefined;

const isFirebaseConfigured =
  !!FIREBASE_API_KEY && !!FIREBASE_AUTH_DOMAIN && !!FIREBASE_PROJECT_ID;

const FIREBASE_CONFIG = {
  apiKey: FIREBASE_API_KEY,
  authDomain: FIREBASE_AUTH_DOMAIN,
  projectId: FIREBASE_PROJECT_ID,
};

let cachedApp: unknown = null;

async function getFirebaseAuth(): Promise<unknown> {
  if (!isFirebaseConfigured) return null;
  // Dynamic imports — Firebase may not be installed; this is caught at runtime
  // biome-ignore lint/suspicious/noExplicitAny: dynamic firebase import
  const app = await new Function("m", "return import(m)")("firebase/app");
  if (!cachedApp) {
    cachedApp =
      app.getApps().length > 0
        ? app.getApps()[0]
        : app.initializeApp(FIREBASE_CONFIG);
  }
  // biome-ignore lint/suspicious/noExplicitAny: dynamic firebase import
  const authMod = await new Function("m", "return import(m)")("firebase/auth");
  return authMod.getAuth(cachedApp);
}

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(() => {
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as AuthUser) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) return;
    let unsub: (() => void) | undefined;
    (async () => {
      try {
        const auth = await getFirebaseAuth();
        if (!auth) return;
        // biome-ignore lint/suspicious/noExplicitAny: dynamic firebase import
        const authMod = await new Function("m", "return import(m)")(
          "firebase/auth",
        );
        unsub = authMod.onAuthStateChanged(auth, (fbUser: any) => {
          if (fbUser) {
            const u: AuthUser = {
              uid: fbUser.uid,
              name: fbUser.displayName ?? fbUser.email?.split("@")[0] ?? "User",
              email: fbUser.email ?? "",
              photoURL: fbUser.photoURL ?? undefined,
              provider:
                fbUser.providerData[0]?.providerId === "google.com"
                  ? "google"
                  : "email",
            };
            setUser(u);
            localStorage.setItem(LS_KEY, JSON.stringify(u));
          } else {
            setUser(null);
            localStorage.removeItem(LS_KEY);
          }
          setLoading(false);
        });
      } catch {
        setLoading(false);
      }
    })();
    return () => unsub?.();
  }, []);

  const signInWithGoogle = useCallback(async (): Promise<AuthUser> => {
    if (!isFirebaseConfigured) {
      // Demo mode
      const u: AuthUser = {
        uid: `demo-google-${Date.now()}`,
        name: "Demo User",
        email: "demo@soundwave.app",
        photoURL: undefined,
        provider: "demo",
      };
      setUser(u);
      localStorage.setItem(LS_KEY, JSON.stringify(u));
      return u;
    }
    const auth = await getFirebaseAuth();
    if (!auth) throw new Error("Firebase not available");
    // biome-ignore lint/suspicious/noExplicitAny: dynamic firebase import
    const authMod = await new Function("m", "return import(m)")(
      "firebase/auth",
    );
    const provider = new authMod.GoogleAuthProvider();
    const cred = await authMod.signInWithPopup(auth, provider);
    const fbUser = cred.user;
    const u: AuthUser = {
      uid: fbUser.uid,
      name: fbUser.displayName ?? "User",
      email: fbUser.email ?? "",
      photoURL: fbUser.photoURL ?? undefined,
      provider: "google",
    };
    setUser(u);
    localStorage.setItem(LS_KEY, JSON.stringify(u));
    return u;
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

      if (!isFirebaseConfigured) {
        // Demo mode
        const u: AuthUser = {
          uid: `demo-email-${Date.now()}`,
          name: email.split("@")[0],
          email,
          provider: "demo",
        };
        setUser(u);
        localStorage.setItem(LS_KEY, JSON.stringify(u));
        return u;
      }

      const auth = await getFirebaseAuth();
      if (!auth) throw new Error("Firebase not available");
      // biome-ignore lint/suspicious/noExplicitAny: dynamic firebase import
      const authMod = await new Function("m", "return import(m)")(
        "firebase/auth",
      );

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
      setUser(u);
      localStorage.setItem(LS_KEY, JSON.stringify(u));
      return u;
    },
    [],
  );

  const signOut = useCallback(async () => {
    if (isFirebaseConfigured) {
      try {
        const auth = await getFirebaseAuth();
        if (auth) {
          // biome-ignore lint/suspicious/noExplicitAny: dynamic firebase import
          const authMod = await new Function("m", "return import(m)")(
            "firebase/auth",
          );
          await authMod.signOut(auth);
        }
      } catch {
        // ignore
      }
    }
    setUser(null);
    localStorage.removeItem(LS_KEY);
  }, []);

  return { user, loading, signInWithGoogle, signInWithEmail, signOut };
}
