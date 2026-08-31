"use client";
import Cookies from "js-cookie";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  signOut,
  onAuthStateChanged,
  signInWithRedirect,
  getRedirectResult,
  GoogleAuthProvider,
  getAdditionalUserInfo,
} from "firebase/auth";
import { auth } from "./firebase";

const USER_ID_KEY = "firebase_uid";

// Keep a synchronous cookie mirror of Firebase's (async) auth state, since
// most pages call getUserId()/isLoggedIn() synchronously on mount.
onAuthStateChanged(auth, (user) => {
  if (user) {
    Cookies.set(USER_ID_KEY, user.uid, { expires: 30, sameSite: "Lax" });
  } else {
    Cookies.remove(USER_ID_KEY);
  }
});

function friendlyMessage(err: unknown, fallback: string): string {
  const code = (err as { code?: string })?.code;
  // Never swallow the real error silently — the switch below only covers
  // the common cases with nicer copy; anything else falls through to the
  // generic fallback text, so log the original for debugging.
  console.error("[auth]", code, err);
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
    case "auth/popup-closed-by-user":
      return "Sign-in was cancelled.";
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
// link is reflected, then returns the fresh emailVerified value. Also force-
// refreshes the ID token — reload() alone updates the cached user object's
// emailVerified flag but NOT the token itself, so every API call gated by
// verifyRequestUser()'s email_verified check would keep 401ing on the old,
// pre-verification token otherwise.
export async function checkEmailVerified(): Promise<boolean> {
  if (!auth.currentUser) return false;
  await reload(auth.currentUser);
  if (auth.currentUser.emailVerified) {
    await auth.currentUser.getIdToken(true);
  }
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
// Uses a full-page redirect rather than signInWithPopup — the popup variant
// hits a well-documented Firebase JS SDK bug ("Database is closing") where
// its IndexedDB persistence layer races with the popup window, especially
// when the main tab gets backgrounded during the OAuth flow. Redirect
// avoids the race entirely since there's no second window.
export async function signInWithGoogle() {
  await signInWithRedirect(auth, new GoogleAuthProvider());
  // Page navigates away here — the result is picked up by
  // completeGoogleRedirect() after the browser returns.
}

// getRedirectResult() consumes the pending result exactly once — cache the
// promise at module scope so React 18 Strict Mode's dev-mode double effect
// invocation (mount → cleanup → mount) can't call it twice and have the
// second call silently get null.
let redirectResultPromise: ReturnType<typeof getRedirectResult> | null = null;

// Call this once on app load (e.g. the landing page) to finish a Google
// sign-in that was started via signInWithGoogle(). Returns null if the user
// didn't just come back from a Google redirect.
export async function completeGoogleRedirect() {
  if (!redirectResultPromise) {
    redirectResultPromise = getRedirectResult(auth);
  }
  try {
    const cred = await redirectResultPromise;
    if (!cred) return null;
    const isNewUser = getAdditionalUserInfo(cred)?.isNewUser ?? false;
    return { userId: cred.user.uid, isNewUser };
  } catch (err) {
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
  Cookies.remove(USER_ID_KEY);
  window.location.href = "/";
}

// ── User helpers ─────────────────────────────────────────────
export function getUserId(): string | undefined {
  return Cookies.get(USER_ID_KEY);
}

export function isLoggedIn(): boolean {
  return !!Cookies.get(USER_ID_KEY);
}