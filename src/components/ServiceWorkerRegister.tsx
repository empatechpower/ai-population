"use client";
import { useEffect } from "react";

// Registers the service worker for every visitor (offline caching + push),
// not just users who enable notifications. Skipped in dev so cached assets
// don't mask code changes.
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production" || !("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  }, []);
  return null;
}
