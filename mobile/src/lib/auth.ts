import { router } from "expo-router";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  signOut,
  onAuthStateChanged,
  signInWithCredential,
  GoogleAuthProvider,
  getAdditionalUserInfo,
} from "firebase/auth";
import {
  GoogleSignin,
  isSuccessResponse,
  isErrorWithCode,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { auth } from "./firebase";

GoogleSignin.configure({
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

// Callers throughout the app (data.ts, workflows.ts, hooks) read the user id
// synchronously, mirroring the old cache-backed API. hydrateAuth() must run
// once at startup (see app/_layout.tsx) and resolves once Firebase Auth has
// finished restoring (or confirmed there's no) persisted session, so this
// cache is trustworthy before any of those synchronous reads happen.
let userIdCache: string | undefined;
let hydrated = false;
let resolveHydration: () => void;
const hydrationPromise = new Promise<void>((resolve) => {
  resolveHydration = resolve;
});

onAuthStateChanged(auth, (user) => {
  userIdCache = user?.uid;
  if (!hydrated) {
    hydrated = true;
    resolveHydration();
  }
});

export async function hydrateAuth() {
  await hydrationPromise;
}

function friendlyMessage(err: unknown, fallback: string): string {
  const code = (err as { code?: string })?.code;
  switch (code) {
    case "auth/email-already-in-use":
      return "An account with this email already exists.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/weak-password":
      return "Password must be at least 6 characters.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Invalid email or password.";
    case "auth/too-many-requests":
      return "Too many attempts. Please try again later.";
    case "auth/account-exists-with-different-credential":
      return "An account already exists with this email using a different sign-in method.";
    default:
      return fallback;
  }
}

// ── Sign up ───────────────────────────────────────────────────
export async function signUp(email: string, password: string) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    try {
      await sendEmailVerification(cred.user);
    } catch (err) {
      // Don't fail account creation over this — the verify-email screen's
      // resend button covers the case where the initial send fails.
      console.error("[auth] failed to send verification email", err);
    }
    return { userId: cred.user.uid };
  } catch (err) {
    throw new Error(friendlyMessage(err, "Could not create account"));
  }
}

// ── Email verification ──────────────────────────────────────────
export async function resendVerificationEmail() {
  if (!auth.currentUser) throw new Error("Not signed in");
  try {
    await sendEmailVerification(auth.currentUser);
  } catch (err) {
    throw new Error(friendlyMessage(err, "Could not send verification email"));
  }
}

// Reloads the current user from Firebase so a just-clicked verification
// link is reflected, then returns the fresh emailVerified value.
export async function checkEmailVerified(): Promise<boolean> {
  if (!auth.currentUser) return false;
  await reload(auth.currentUser);
  return auth.currentUser.emailVerified;
}

// Synchronous, cached read — safe to use for route-guard checks that can't
// await a network round trip.
export function isEmailVerified(): boolean {
  return auth.currentUser?.emailVerified ?? false;
}

// ── Log in ────────────────────────────────────────────────────
export async function logIn(email: string, password: string) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return { userId: cred.user.uid };
  } catch (err) {
    throw new Error(friendlyMessage(err, "Login failed"));
  }
}

// ── Google sign-in ───────────────────────────────────────────
// Works for both signup and login — Firebase creates the account on first
// use. isNewUser tells the caller whether to route to onboarding.
export async function signInWithGoogle() {
  try {
    await GoogleSignin.hasPlayServices();
    const response = await GoogleSignin.signIn();
    if (!isSuccessResponse(response)) {
      throw new Error("Sign-in was cancelled.");
    }
    const idToken = response.data.idToken;
    if (!idToken) throw new Error("Google sign-in failed");

    const cred = await signInWithCredential(auth, GoogleAuthProvider.credential(idToken));
    const isNewUser = getAdditionalUserInfo(cred)?.isNewUser ?? false;
    return { userId: cred.user.uid, isNewUser };
  } catch (err) {
    if (isErrorWithCode(err) && err.code === statusCodes.SIGN_IN_CANCELLED) {
      throw new Error("Sign-in was cancelled.");
    }
    throw new Error(friendlyMessage(err, "Google sign-in failed"));
  }
}

// ── Forgot password ───────────────────────────────────────────
export async function requestPasswordReset(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (err) {
    throw new Error(friendlyMessage(err, "Password reset failed"));
  }
}

// ── Log out ───────────────────────────────────────────────────
export async function logOut() {
  await signOut(auth);
  router.replace("/");
}

// ── User helpers ─────────────────────────────────────────────
export function getUserId(): string | undefined {
  return userIdCache;
}

export function isLoggedIn(): boolean {
  return !!userIdCache;
}