// Firebase config is read from environment variables.
// Fill in your values in src/frontend/.env and redeploy.
const apiKey = import.meta.env.VITE_FIREBASE_API_KEY as string | undefined;
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as
  | string
  | undefined;
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID as
  | string
  | undefined;
const appId = import.meta.env.VITE_FIREBASE_APP_ID as string | undefined;

export const FIREBASE_ENABLED =
  !!apiKey && apiKey.length > 0 && !!projectId && projectId.length > 0;

export const FIREBASE_CONFIG = {
  apiKey: apiKey ?? "",
  authDomain: authDomain ?? `${projectId ?? ""}.firebaseapp.com`,
  projectId: projectId ?? "",
  storageBucket: `${projectId ?? ""}.appspot.com`,
  messagingSenderId: "",
  appId: appId ?? "",
};
