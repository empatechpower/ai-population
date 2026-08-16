"use client";
import { useEffect } from "react";
import { useAppStore } from "@/store/app";
import { getProfile } from "@/lib/data";
import { isLoggedIn } from "@/lib/auth";
import { hasActiveAccess } from "@/lib/subscription";
import { useRouter } from "next/navigation";

// requireSubscription gates the page behind an active trial/subscription.
// Leave it false only for pages that must stay reachable without one (the
// profile/billing page itself, so a lapsed user can still manage/resubscribe).
export function useProfile(redirectIfLoggedOut = true, requireSubscription = true) {
  const { profile, setProfile } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoggedIn()) {
      if (redirectIfLoggedOut) router.push("/");
      return;
    }
    if (profile) {
      if (requireSubscription && !hasActiveAccess(profile)) router.push("/subscribe");
      return;
    }
    getProfile()
      .then((p) => {
        setProfile(p);
        if (requireSubscription && !hasActiveAccess(p)) router.push("/subscribe");
      })
      .catch(() => {
        if (redirectIfLoggedOut) router.push("/");
      });
  }, []);

  return { profile };
}
