"use client";
import { useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useAppStore } from "@/store/app";
import { getProfile } from "@/lib/data";
import { hasActiveAccess } from "@/lib/subscription";
import { useRouter } from "next/navigation";

// requireSubscription gates the page behind an active trial/subscription.
// Leave it false only for pages that must stay reachable without one (the
// profile/billing page itself, so a lapsed user can still manage/resubscribe).
//
// Waits on onAuthStateChanged rather than the synchronous isLoggedIn()/
// isEmailVerified() reads — on a cold full-page load (a refresh, a shared
// link, a PWA cold start) Firebase Auth hasn't finished restoring its
// persisted session yet when this effect first runs, so a synchronous read
// can see a genuinely verified user as unverified and bounce them through
// /verify-email. onAuthStateChanged's first callback always reflects the
// real, fully-restored state.
export function useProfile(redirectIfLoggedOut = true, requireSubscription = true) {
  const { profile, setProfile } = useAppStore();
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        if (redirectIfLoggedOut) router.push("/");
        return;
      }
      if (!user.emailVerified) {
        router.push("/verify-email");
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
    });
    return () => unsubscribe();
  }, []);

  return { profile };
}
