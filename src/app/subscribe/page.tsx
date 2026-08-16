"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ArrowRight } from "lucide-react";
import { getUserId, isLoggedIn } from "@/lib/auth";
import { auth } from "@/lib/firebase";

const BG = "#F5F2EC";
const TEXT_PRIMARY = "#0B0B0D";
const TEXT_SECONDARY = "#5E5E63";
const TEXT_MUTED = "#9A9AA0";
const GOLD = "#D4B06A";
const BORDER = "rgba(0,0,0,0.08)";
const CARD = "#FFFFFF";

const FEATURES = [
  "AI-generated daily protocols",
  "Personalized nutrition & movement plans",
  "Full pregnancy/postpartum journey tracking",
  "Community access",
];

export default function SubscribePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleStartTrial() {
    const uid = getUserId();
    if (!uid || !isLoggedIn()) {
      router.push("/");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ userId: uid }),
      });
      const body = await res.json();
      if (!res.ok || !body.url) throw new Error(body.error || "Could not start checkout");
      window.location.href = body.url;
    } catch (e: any) {
      setError(e?.message || "Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: BG,
        display: "flex",
        flexDirection: "column",
        padding: "0 24px",
      }}
    >
      <div style={{ flex: 1, paddingTop: 60, maxWidth: 480, margin: "0 auto", width: "100%" }}>
        <p
          style={{
            fontSize: 12,
            color: GOLD,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          Start your journey
        </p>
        <h1
          style={{
            fontSize: 32,
            fontWeight: 500,
            color: TEXT_PRIMARY,
            letterSpacing: "-0.02em",
            lineHeight: 1.15,
            marginBottom: 12,
            fontFamily: 'Georgia,"Palatino Linotype",serif',
          }}
        >
          7 days free, then CHF 15/month
        </h1>
        <p style={{ fontSize: 15, color: TEXT_SECONDARY, lineHeight: 1.7, marginBottom: 32 }}>
          Cancel anytime during your trial and you won't be charged.
        </p>

        <div
          style={{
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 16,
            padding: 24,
            marginBottom: 24,
          }}
        >
          {FEATURES.map((f) => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <Check size={16} color={GOLD} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 14, color: TEXT_SECONDARY }}>{f}</span>
            </div>
          ))}
        </div>

        {error && (
          <p style={{ fontSize: 13, color: "#E57373", marginBottom: 16, textAlign: "center" }}>
            {error}
          </p>
        )}

        <button
          onClick={handleStartTrial}
          disabled={loading}
          style={{
            width: "100%",
            background: loading ? `${GOLD}90` : GOLD,
            color: "#fff",
            border: "none",
            borderRadius: 14,
            padding: "16px",
            fontSize: 16,
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontFamily: "inherit",
          }}
        >
          {loading ? "Redirecting..." : "Start free trial"} {!loading && <ArrowRight size={18} />}
        </button>
        <p style={{ textAlign: "center", fontSize: 12, color: TEXT_MUTED, marginTop: 16 }}>
          A card is required to start your trial. CHF 15/month after day 7.
        </p>
      </div>
    </div>
  );
}