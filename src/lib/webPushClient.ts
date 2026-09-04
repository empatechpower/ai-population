"use client";
import { updateProfile } from "./data";

// PushManager.subscribe() needs the VAPID public key as a Uint8Array, not
// the base64url string it's stored/shared as.
function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function isPushSupported(): boolean {
  return typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window;
}

// Registers the service worker, requests notification permission, subscribes
// to push, and saves the subscription to the user's profile. Throws with a
// message safe to show the user (e.g. "Permission denied") on failure.
export async function enablePushNotifications(): Promise<void> {
  if (!isPushSupported()) throw new Error("Push notifications aren't supported in this browser.");

  const permission = await Notification.requestPermission();
  if (permission !== "granted") throw new Error("Notification permission was denied.");

  const registration = await navigator.serviceWorker.register("/sw.js");
  await navigator.serviceWorker.ready;

  const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  if (!publicKey) throw new Error("Push notifications aren't configured yet.");

  const subscription = await registration.pushManager.subscribe({
    userVisibleOnly: true,
    // The DOM lib types applicationServerKey against ArrayBuffer
    // specifically, but Uint8Array's .buffer is typed ArrayBufferLike —
    // a real TypedArray works fine at runtime regardless.
    applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
  });

  await updateProfile({ web_push_subscription: subscription.toJSON() });
}

export async function disablePushNotifications(): Promise<void> {
  if (isPushSupported()) {
    const registration = await navigator.serviceWorker.getRegistration();
    const subscription = await registration?.pushManager.getSubscription();
    await subscription?.unsubscribe();
  }
  await updateProfile({ web_push_subscription: null });
}
