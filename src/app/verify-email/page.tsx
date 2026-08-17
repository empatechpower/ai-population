"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { checkEmailVerified, resendVerificationEmail, logOut } from "@/lib/auth";
import { getProfile } from "@/lib/data";

const BG = "#F5F2EC";
const CARD = "#FFFFFF";
const TEXT_PRIMARY = "#0B0B0D";
const TEXT_SECONDARY = "#5E5E63";
const TEXT_MUTED = "#9A9AA0";
const GOLD = "#D4B06A";
const BORDER = "rgba(0,0,0,0.08)";
const RESEND_COOLDOWN_SECONDS = 30;
const POLL_INTERVAL_MS = 4000;

export default function VerifyEmailPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");
  const [cooldown, setCooldown] = useState(0);
  const navigatingRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.push("/");
        return;
      }
      setEmail(user.email);
    });
    return () => unsubscribe();
  }, []);

  async function proceedIfVerified() {
    if (navigatingRef.current) return false;
    const verified = await checkEmailVerified();
    if (!verified) return false;
    navigatingRef.current = true;
    try {
      await getProfile();
      router.push("/dashboard");
    } catch {
      router.push("/onboarding");
    }
    return true;
  }

  // Poll in the background so a user who verifies in another tab gets
  // moved along automatically, without needing to click back here first.
  useEffect(() => {
    const interval = setInterval(() => {
      proceedIfVerified().catch(() => {});
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function handleCheckNow() {
    setChecking(true);
    setError("");
    try {
      const ok = await proceedIfVerified();
      if (!ok) setError("Not verified yet — check your inbox (and spam folder) for the link.");
    } catch (e: any) {
      setError(e?.message || "Could not check verification status. Please try again.");
    } finally {
      setChecking(false);
    }
  }

  async function handleResend() {
    setResendState("sending");
    setError("");
    try {
      await resendVerificationEmail();
      setResendState("sent");
      setCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (e: any) {
      setError(e?.message || "Could not send verification email. Please try again.");
      setResendState("idle");
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        padding: "0 24px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", maxWidth: 420, margin: "0 auto", width: "100%" }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 20,
            background: "rgba(212,176,106,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2">
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path d="M3 7l9 6 9-6" />
          </svg>
        </div>
        <h1
          style={{
            fontSize: 26,
            fontWeight: 500,
            color: TEXT_PRIMARY,
            letterSpacing: "-0.02em",
            marginBottom: 10,
            fontFamily: 'Georgia,"Palatino Linotype",serif',
          }}
        >
          Confirm your email
        </h1>
        <p style={{ fontSize: 14, color: TEXT_SECONDARY, lineHeight: 1.6, marginBottom: 28 }}>
          We sent a verification link to{" "}
          <strong style={{ color: TEXT_PRIMARY }}>{email ?? "your email"}</strong>. Click it to
          continue — this page will move on automatically once it's confirmed.
        </p>

        {error && (
          <p style={{ fontSize: 13, color: "#E57373", marginBottom: 16, lineHeight: 1.5 }}>{error}</p>
        )}

        <button
          onClick={handleCheckNow}
          disabled={checking}
          style={{
            width: "100%",
            background: GOLD,
            color: "#fff",
            border: "none",
            borderRadius: 14,
            padding: "16px",
            fontSize: 15,
            fontWeight: 600,
            cursor: checking ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            marginBottom: 12,
            opacity: checking ? 0.7 : 1,
          }}
        >
          {checking ? "Checking..." : "I've verified — continue"}
        </button>

        <button
          onClick={handleResend}
          disabled={resendState === "sending" || cooldown > 0}
          style={{
            width: "100%",
            background: CARD,
            color: TEXT_PRIMARY,
            border: `1px solid ${BORDER}`,
            borderRadius: 14,
            padding: "14px",
            fontSize: 14,
            fontWeight: 500,
            cursor: resendState === "sending" || cooldown > 0 ? "not-allowed" : "pointer",
            fontFamily: "inherit",
            marginBottom: 20,
          }}
        >
          {cooldown > 0
            ? `Resend email (${cooldown}s)`
            : resendState === "sending"
              ? "Sending..."
              : resendState === "sent"
                ? "Sent — resend again"
                : "Resend verification email"}
        </button>

        <p style={{ textAlign: "center", fontSize: 13, color: TEXT_MUTED }}>
          Wrong email?{" "}
          <button
            onClick={() => logOut()}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: GOLD,
              fontWeight: 600,
              fontSize: 13,
              fontFamily: "inherit",
            }}
          >
            Sign out
          </button>
        </p>
      </div>
    </div>
  );
}
