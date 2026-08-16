import { initializeApp, getApps, getApp } from "firebase/app";
import { initializeAuth, getAuth, type Persistence } from "firebase/auth";
import * as FirebaseAuthRN from "@firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// @firebase/auth's package.json "exports" map has a top-level "types" key
// that shadows its "react-native" condition's types when tsc resolves this
// module, so getReactNativePersistence isn't visible to TypeScript — even
// though Metro resolves the real React Native build (which does have it)
// correctly at runtime. Pull it off the module dynamically to sidestep the
// bad type declaration, with an explicit type instead of a blind `any`.
const getReactNativePersistence = (
  FirebaseAuthRN as unknown as {
    getReactNativePersistence: (storage: typeof AsyncStorage) => Persistence;
  }
).getReactNativePersistence;

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// initializeAuth throws if called twice (e.g. on Fast Refresh) — fall back
// to the already-initialized instance in that case.
let authInstance;
try {
  authInstance = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  authInstance = getAuth(app);
}

export const auth = authInstance;
export const db = getFirestore(app);