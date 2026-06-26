"use client";
import { useEffect, useState } from "react";
import { useAppStore } from "@/store/app";
import { getProfile, getProtocol, getTodayProtocol } from "@/lib/data";
import { triggerGenerateProtocol } from "@/lib/workflows";
import { getUserId } from "@/lib/auth";

export function useProtocol() {
  const { profile, setProfile, setProtocol, protocol } = useAppStore();
  const [loading, setLoading] = useState(!protocol);
  console.log("useProtocol - initial profile:");

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    let cancelled = false;

    // ✅ Helper: compare dates safely (no timezone issues)
    function isSameDay(ts: number) {
      const d1 = new Date(ts);
      const d2 = new Date();

      return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
      );
    }

    async function load() {
      try {
        // 1️⃣ If protocol already in state, verify it's today's
        if (protocol && protocol["Created Date"]) {
          if (isSameDay(protocol["Created Date"])) {
            setLoading(false);
            return;
          }
        }

        // 2️⃣ Load profile (only if not already available)
        const p = profile ?? (await getProfile());
        if (cancelled) return;
        setProfile(p);

        const userId = getUserId() ?? p._id;

        // 3️⃣ Check if today's protocol already exists
        const existing = await getTodayProtocol();
        console.log("Existing protocol for today:", existing);

        if (
          existing &&
          existing["Created Date"] &&
          isSameDay(existing["Created Date"])
        ) {
          if (!cancelled) {
            setProtocol(existing);
            setLoading(false);
          }
          return;
        }

        // 4️⃣ Trigger generation ONLY if none exists
        await triggerGenerateProtocol(userId);

        // 5️⃣ Poll for result (max 30s)
        let attempts = 0;

        interval = setInterval(async () => {
          if (cancelled) {
            if (interval) clearInterval(interval);
            return;
          }

          attempts++;

          // ⛔ stop polling after ~30 seconds
          if (attempts > 10) {
            if (interval) clearInterval(interval);
            setLoading(false);
            console.warn("Protocol polling timed out");
            return;
          }

          try {
            const proto = await getTodayProtocol();

            if (
              proto &&
              proto["Created Date"] &&
              isSameDay(proto["Created Date"])
            ) {
              const updatedProfile = await getProfile();

              if (!cancelled) {
                setProfile(updatedProfile);
                setProtocol(proto);
                setLoading(false);
              }

              if (interval) clearInterval(interval);
            }
          } catch (err) {
            console.error("Polling error:", err);
          }
        }, 3000);
      } catch (err) {
        console.error("Protocol load error:", err);
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, []);

  return { loading };
}
