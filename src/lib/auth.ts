"use client";
import Cookies from "js-cookie";
import { bubblePost } from "./bubble";

const TOKEN_KEY = "bubble_token";
const USER_ID_KEY = "bubble_user_id";

// ── Sign up ───────────────────────────────────────────────────
// Calls Bubble's built-in signup workflow:
// POST /api/1.1/wf/signup  { email, password }
// Returns a user token that scopes all subsequent Data API calls.
export async function signUp(email: string, password: string) {
  const res = await bubblePost("/wf/signup", { email, password });
  const token = res.response?.token;
  const userId = res.response?.user_id;
  if (token) {
    Cookies.set(TOKEN_KEY, token, { expires: 30, sameSite: "Lax" });
    Cookies.set(USER_ID_KEY, userId, { expires: 30, sameSite: "Lax" });
  }
  return { token, userId };
}

// ── Log in ────────────────────────────────────────────────────
// Calls Bubble's built-in login workflow:
// POST /api/1.1/wf/login  { email, password }
export async function logIn(email: string, password: string) {
  const res = await bubblePost("/wf/login", { email, password });

  // 🔴 Bubble error handling
  if (!res?.response || res.statusCode >= 400) {
    const message = res?.message || res?.response?.message || "Login failed";

    throw new Error(message);
  }

  const token = res.response?.token;
  const userId = res.response?.user_id;

  if (token) {
    Cookies.set(TOKEN_KEY, token, {
      expires: 30,
      sameSite: "Lax",
    });

    Cookies.set(USER_ID_KEY, userId, {
      expires: 30,
      sameSite: "Lax",
    });
  }

  return { token, userId };
}

// ── Log out ───────────────────────────────────────────────────
export function logOut() {
  Cookies.remove(TOKEN_KEY);
  Cookies.remove(USER_ID_KEY);
  window.location.href = "/";
}

// ── Token helpers ─────────────────────────────────────────────
export function getToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

export function getUserId(): string | undefined {
  return Cookies.get(USER_ID_KEY);
}

export function isLoggedIn(): boolean {
  return !!Cookies.get(TOKEN_KEY);
}
