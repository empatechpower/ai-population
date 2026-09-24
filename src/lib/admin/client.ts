"use client";
import { auth } from "@/lib/firebase";

export async function adminFetch(path: string, options: RequestInit = {}) {
  const idToken = await auth.currentUser?.getIdToken();
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${idToken}`,
      ...options.headers,
    },
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || "Request failed");
  return body;
}
