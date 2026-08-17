import { useEffect } from "react";
import { router } from "expo-router";
import { useAppStore } from "@/store/app";
import { getProfile } from "@/lib/data";
import { isLoggedIn, isEmailVerified } from "@/lib/auth";

export function useProfile(redirectIfLoggedOut = true) {
  const { profile, setProfile } = useAppStore();

  useEffect(() => {
    if (!isLoggedIn()) {
      if (redirectIfLoggedOut) router.replace("/auth");
      return;
    }
    if (!isEmailVerified()) {
      router.replace("/verify-email");
      return;
    }
    if (profile) return;
    getProfile()
      .then(setProfile)
      .catch(() => {
        if (redirectIfLoggedOut) router.replace("/auth");
      });
  }, []);

  return { profile };
}
