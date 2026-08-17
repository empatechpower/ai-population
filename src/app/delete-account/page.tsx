"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { onAuthStateChanged } from "firebase/auth";
import { logIn, signInWithGoogle, completeGoogleRedirect, logOut } from "@/lib/auth";
import { auth } from "@/lib/firebase";

const BG = "#F5F2EC";
const CARD = "#FFFFFF";
const TEXT_PRIMARY = "#0B0B0D";
const TEXT_SECONDARY = "#5E5E63";
const TEXT_MUTED = "#9A9AA0";
const GOLD = "#D4B06A";
const BORDER = "rgba(0,0,0,0.08)";
const DANGER = "#E57373";

export default function DeleteAccountPage() {
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [done, setDone] = useState(false);

  useEffect(() => {
    completeGoogleRedirect().catch((e: any) => setLoginError(e?.message || "Sign-in failed."));
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserEmail(user?.email ?? null);
      setUserId(user?.uid ?? null);
      setCheckingAuth(false);
    });
    return () => unsubscribe();
  }, []);

  async function handleLogIn() {
    setLoggingIn(true);
    setLoginError("");
    try {
      await logIn(email.trim(), password);
    } catch (e: any) {
      setLoginError(e?.message || "Login failed.");
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleGoogleLogIn() {
    setLoggingIn(true);
    setLoginError("");
    try {
      await signInWithGoogle();
    } catch (e: any) {
      setLoginError(e?.message || "Google sign-in failed.");
      setLoggingIn(false);
    }
  }

  async function handleDelete() {
    if (!userId) return;
    setDeleting(true);
    setDeleteError("");
    try {
      const idToken = await auth.currentUser?.getIdToken();
      const res = await fetch("/api/delete-account", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({ userId }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not delete account");
      setDone(true);
    } catch (e: any) {
      setDeleteError(e?.message || "Something went wrong. Please try again.");
    } finally {
      setDeleting(false);
    }
  }

  const cardStyle: React.CSSProperties = {
    background: CARD,
    border: `1px solid ${BORDER}`,
    borderRadius: 16,
    padding: 24,
  };

  return (
    <div style={{ minHeight: "100vh", background: BG, padding: "0 24px 60px" }}>
      <div style={{ maxWidth: 480, margin: "0 auto" }}>
        <div style={{ paddingTop: 40, paddingBottom: 16 }}>
          <Link href="/" style={{ fontSize: 13, color: TEXT_MUTED, textDecoration: "none" }}>
            ← Back to Bloom
          </Link>
        </div>

        <h1
          style={{
            fontSize: 28,
            fontWeight: 500,
            color: TEXT_PRIMARY,
            letterSpacing: "-0.02em",
            marginBottom: 8,
            fontFamily: 'Georgia,"Palatino Linotype",serif',
          }}
        >
          Delete your account
        </h1>
        <p style={{ fontSize: 14, color: TEXT_SECONDARY, lineHeight: 1.6, marginBottom: 28 }}>
          Sign in below to permanently delete your Bloom account and data. You don't need the app
          installed to do this.
        </p>

        {checkingAuth ? (
          <p style={{ fontSize: 14, color: TEXT_MUTED }}>Checking sign-in status...</p>
        ) : done ? (
          <div style={cardStyle}>
            <p style={{ fontSize: 15, color: TEXT_PRIMARY, lineHeight: 1.6 }}>
              Your account and associated data have been deleted.
            </p>
          </div>
        ) : !userEmail ? (
          <div style={cardStyle}>
            <label style={{ fontSize: 12, color: TEXT_MUTED, display: "block", marginBottom: 6 }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              style={{
                width: "100%",
                border: `1px solid ${BORDER}`,
                borderRadius: 10,
                padding: "12px 14px",
                fontSize: 14,
                marginBottom: 14,
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
            <label style={{ fontSize: 12, color: TEXT_MUTED, display: "block", marginBottom: 6 }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                width: "100%",
                border: `1px solid ${BORDER}`,
                borderRadius: 10,
                padding: "12px 14px",
                fontSize: 14,
                marginBottom: 16,
                boxSizing: "border-box",
                fontFamily: "inherit",
              }}
            />
            {loginError && (
              <p style={{ fontSize: 13, color: DANGER, marginBottom: 12 }}>{loginError}</p>
            )}
            <button
              onClick={handleLogIn}
              disabled={loggingIn || !email || !password}
              style={{
                width: "100%",
                background: GOLD,
                color: "#fff",
                border: "none",
                borderRadius: 10,
                padding: "12px",
                fontSize: 14,
                fontWeight: 600,
                cursor: loggingIn ? "not-allowed" : "pointer",
                marginBottom: 12,
              }}
            >
              {loggingIn ? "Signing in..." : "Sign In"}
            </button>
            <button
              onClick={handleGoogleLogIn}
              disabled={loggingIn}
              style={{
                width: "100%",
                background: "#fff",
                border: `1px solid ${BORDER}`,
                borderRadius: 10,
                padding: "12px",
                fontSize: 14,
                fontWeight: 500,
                color: TEXT_PRIMARY,
                cursor: loggingIn ? "not-allowed" : "pointer",
              }}
            >
              Continue with Google
            </button>
          </div>
        ) : (
          <div style={cardStyle}>
            <p style={{ fontSize: 13, color: TEXT_MUTED, marginBottom: 16 }}>
              Signed in as <strong style={{ color: TEXT_PRIMARY }}>{userEmail}</strong>
            </p>

            {!confirming ? (
              <>
                <p style={{ fontSize: 14, color: TEXT_SECONDARY, lineHeight: 1.6, marginBottom: 16 }}>
                  This permanently deletes your profile, protocol, meals, movement plans, journey
                  data, and community posts. This can't be undone.
                </p>
                <button
                  onClick={() => setConfirming(true)}
                  style={{
                    width: "100%",
                    background: DANGER,
                    color: "#fff",
                    border: "none",
                    borderRadius: 10,
                    padding: "12px",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                    marginBottom: 10,
                  }}
                >
                  Delete my account
                </button>
                <button
                  onClick={() => logOut()}
                  style={{
                    width: "100%",
                    background: "transparent",
                    border: "none",
                    fontSize: 13,
                    color: TEXT_MUTED,
                    cursor: "pointer",
                    padding: "8px",
                  }}
                >
                  Sign out instead
                </button>
              </>
            ) : (
              <>
                <p style={{ fontSize: 14, color: TEXT_PRIMARY, lineHeight: 1.6, marginBottom: 16 }}>
                  Are you sure? This is permanent.
                </p>
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    onClick={() => setConfirming(false)}
                    disabled={deleting}
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: `1px solid ${BORDER}`,
                      borderRadius: 10,
                      padding: "12px",
                      fontSize: 14,
                      fontWeight: 600,
                      color: TEXT_PRIMARY,
                      cursor: deleting ? "not-allowed" : "pointer",
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    style={{
                      flex: 1,
                      background: DANGER,
                      border: "none",
                      borderRadius: 10,
                      padding: "12px",
                      fontSize: 14,
                      fontWeight: 600,
                      color: "#fff",
                      cursor: deleting ? "not-allowed" : "pointer",
                    }}
                  >
                    {deleting ? "Deleting..." : "Yes, delete"}
                  </button>
                </div>
                {deleteError && (
                  <p style={{ fontSize: 13, color: DANGER, marginTop: 12 }}>{deleteError}</p>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
