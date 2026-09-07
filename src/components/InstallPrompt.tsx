"use client";
import { useEffect, useState } from "react";

// No browser allows a truly automatic (no-user-gesture) install — that's a
// deliberate anti-spam rule enforced by every implementation (legacy
// beforeinstallprompt, the newer navigator.install(), and iOS's manual-only
// "Add to Home Screen"). This shows an install banner the instant the page
// loads instead, so installing only takes one tap.
const DISMISSED_KEY = "bloom_install_prompt_dismissed";

type Kind = "web-install-api" | "before-install-prompt" | "ios-manual" | null;

export default function InstallPrompt() {
  const [kind, setKind] = useState<Kind>(null);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (localStorage.getItem(DISMISSED_KEY)) return;

    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;
    if (isStandalone) return;

    if (typeof (navigator as any).install === "function") {
      setKind("web-install-api");
      return;
    }

    const onBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setKind("before-install-prompt");
    };
    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);

    const isIOS = /iphone|ipad|ipod/.test(navigator.userAgent.toLowerCase());
    const isSafari = /safari/.test(navigator.userAgent.toLowerCase()) && !/crios|fxios/.test(navigator.userAgent.toLowerCase());
    if (isIOS && isSafari) setKind("ios-manual");

    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
  }, []);

  if (!kind) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISSED_KEY, "1");
    setKind(null);
  };

  const handleInstall = async () => {
    if (kind === "web-install-api") {
      try {
        await (navigator as any).install();
      } catch {
        // user cancelled or install failed — nothing to do
      }
      dismiss();
      return;
    }
    if (kind === "before-install-prompt" && deferredPrompt) {
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      dismiss();
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 flex justify-center px-4 pb-4 sm:pb-6">
      <div className="flex w-full max-w-md items-center gap-3 rounded-3xl bg-elevated px-4 py-3 shadow-gold border border-border">
        <div className="flex-1 min-w-0">
          <p className="font-sans text-sm font-semibold text-primary">Install Bloom</p>
          <p className="font-sans text-xs text-secondary truncate">
            {kind === "ios-manual"
              ? "Tap Share, then “Add to Home Screen”"
              : "Add Bloom to your home screen for quick access"}
          </p>
        </div>
        {kind !== "ios-manual" && (
          <button
            onClick={handleInstall}
            className="shrink-0 rounded-pill bg-gold px-4 py-2 font-sans text-sm font-semibold text-primary"
          >
            Install
          </button>
        )}
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="shrink-0 text-secondary text-lg leading-none px-1"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
