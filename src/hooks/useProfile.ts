"use client";
import { useEffect } from "react";
import { useAppStore } from "@/store/app";
import { getProfile } from "@/lib/data";
import { isLoggedIn } from "@/lib/auth";
import { useRouter } from "next/navigation";

export function useProfile(redirectIfLoggedOut = true) {
  const { profile, setProfile } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      if (redirectIfLoggedOut) router.push("/");
      return;
    }
    if (profile) return;
    getProfile()
      .then(setProfile)
      .catch(() => {
        if (redirectIfLoggedOut) router.push("/");
      });
  }, []);

  return { profile };
}
