"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  logIn,
  signUp,
  requestPasswordReset,
  signInWithGoogle,
  completeGoogleRedirect,
  isEmailVerified,
} from "@/lib/auth";
import { getProfile } from "@/lib/data";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { ArrowRight, ChevronLeft } from "lucide-react";
import Input from "@/components/shared/Input";
import IntroVideo from "@/components/shared/IntroVideo";

const INTRO_SEEN_KEY = "hasSeenIntro";

const BG = "#F5F2EC";
const CARD = "#FFFFFF";
const TEXT_PRIMARY = "#0B0B0D";
const TEXT_SECONDARY = "#5E5E63";
const TEXT_MUTED = "#9A9AA0";
const GOLD = "#D4B06A";
const BORDER = "rgba(0,0,0,0.08)";
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

export default function LandingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"landing" | "login" | "signup" | "forgot">("landing");
  const [resetSent, setResetSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // First-ever visit plays a one-time intro video ahead of the landing page,
  // gated by a local flag so returning visitors never see it again. Starts
  // as null (unknown) so we don't flash the landing page before checking.
  const [showIntro, setShowIntro] = useState<boolean | null>(null);
  useEffect(() => {
    setShowIntro(!localStorage.getItem(INTRO_SEEN_KEY));
  }, []);
  function dismissIntro() {
    localStorage.setItem(INTRO_SEEN_KEY, "1");
    setShowIntro(false);
  }

  const isEmailValid = EMAIL_RE.test(email.trim());
  const isPasswordValid = password.length >= MIN_PASSWORD_LENGTH;

  // Picks up the result after signInWithGoogle()'s full-page redirect
  // brings the browser back here.
  useEffect(() => {
    let handled = false;

    completeGoogleRedirect()
      .then((result) => {
        if (result) {
          handled = true;
          if (!isEmailVerified()) {
            router.push("/verify-email");
            return;
          }
          router.push(result.isNewUser ? "/onboarding" : "/dashboard");
        }
      })
      .catch((e: any) => setError(e?.message || "Google sign-in failed. Please try again."));

    // Fallback: getRedirectResult() can miss a result in some browser
    // storage configurations even though the redirect sign-in itself
    // succeeded. onAuthStateChanged is a more reliable signal — if the user
    // is actually signed in, route them based on whether they've onboarded.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (handled || !user) return;
      handled = true;
      if (!user.emailVerified) {
        router.push("/verify-email");
        return;
      }
      try {
        await getProfile();
        router.push("/dashboard");
      } catch {
        router.push("/onboarding");
      }
    });

    return () => unsubscribe();
  }, []);

  function switchMode(next: "landing" | "login" | "signup" | "forgot") {
    setMode(next);
    setError("");
    setResetSent(false);
  }

  async function handleSignUp() {
    if (!isEmailValid) return setError("Please enter a valid email address.");
    if (!isPasswordValid) return setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    setLoading(true);
    setError("");
    try {
      await signUp(email.trim(), password);
      router.push("/verify-email");
    } catch (e: any) {
      setError(e?.message || "Could not create account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogIn() {
    if (!isEmailValid) return setError("Please enter a valid email address.");
    if (!password) return setError("Please enter your password.");
    setLoading(true);
    setError("");
    try {
      await logIn(email.trim(), password);
      router.push(isEmailVerified() ? "/dashboard" : "/verify-email");
    } catch (e: any) {
      setError(e?.message || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError("");
    try {
      // Navigates the page away to Google — result is handled by the
      // completeGoogleRedirect() effect above once the browser comes back.
      await signInWithGoogle();
    } catch (e: any) {
      setError(e?.message || "Google sign-in failed. Please try again.");
      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    if (!isEmailValid) return setError("Please enter a valid email address.");
    setLoading(true);
    setError("");
    try {
      await requestPasswordReset(email.trim());
      setResetSent(true);
    } catch (e: any) {
      setError(e?.message || "Could not send reset email. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function InputField({
    label,
    type = "text",
    value,
    onChange,
    placeholder = "",
  }: {
    label: string;
    type?: string;
    value: string;
    onChange: (v: string) => void;
    placeholder?: string;
  }) {
    return (
      <div style={{ marginBottom: 20 }}>
        <label
          style={{
            display: "block",
            fontSize: 12,
            letterSpacing: "0.08em",
            textTransform: "uppercase" as const,
            color: TEXT_MUTED,
            marginBottom: 8,
            fontWeight: 500,
          }}
        >
          {label}
        </label>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: "100%",
            background: CARD,
            border: `1px solid ${BORDER}`,
            borderRadius: 12,
            padding: "14px 16px",
            fontSize: 16,
            color: TEXT_PRIMARY,
            outline: "none",
            fontFamily: "inherit",
            boxSizing: "border-box" as const,
          }}
        />
      </div>
    );
  }

  const PrimaryBtn = ({
    onClick,
    disabled = false,
    label,
  }: {
    onClick: () => void;
    disabled?: boolean;
    label: string;
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        background: disabled ? `${GOLD}60` : GOLD,
        color: "#fff",
        border: "none",
        borderRadius: 14,
        padding: "16px",
        fontSize: 16,
        fontWeight: 600,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontFamily: "inherit",
        transition: "all 0.2s",
      }}
    >
      {label} {!disabled && <ArrowRight size={18} />}
    </button>
  );

  const GoogleButton = ({ disabled = false }: { disabled?: boolean }) => (
    <button
      onClick={handleGoogleSignIn}
      disabled={disabled}
      style={{
        width: "100%",
        background: CARD,
        color: TEXT_PRIMARY,
        border: `1px solid ${BORDER}`,
        borderRadius: 14,
        padding: "14px",
        fontSize: 15,
        fontWeight: 500,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        fontFamily: "inherit",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
        <path
          fill="#4285F4"
          d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.9c1.7-1.57 2.68-3.87 2.68-6.62z"
        />
        <path
          fill="#34A853"
          d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.9-2.26c-.8.54-1.84.86-3.06.86-2.35 0-4.34-1.59-5.05-3.72H.96v2.33A9 9 0 0 0 9 18z"
        />
        <path
          fill="#FBBC05"
          d="M3.95 10.7A5.4 5.4 0 0 1 3.67 9c0-.59.1-1.17.28-1.7V4.97H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.03l2.99-2.33z"
        />
        <path
          fill="#EA4335"
          d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.97l2.99 2.33C4.66 5.17 6.65 3.58 9 3.58z"
        />
      </svg>
      Continue with Google
    </button>
  );

  const Divider = () => (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
      <div style={{ flex: 1, height: 1, background: BORDER }} />
      <span style={{ fontSize: 12, color: TEXT_MUTED }}>or</span>
      <div style={{ flex: 1, height: 1, background: BORDER }} />
    </div>
  );

  if (showIntro === null) return <div style={{ minHeight: "100vh", background: BG }} />;
  if (showIntro) return <IntroVideo onFinish={dismissIntro} />;

  if (mode === "login")
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
        <button
          onClick={() => switchMode("landing")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "20px 0",
            color: TEXT_MUTED,
            fontFamily: "inherit",
            fontSize: 14,
          }}
        >
          <ChevronLeft size={18} /> Back
        </button>
        <div style={{ flex: 1, paddingTop: 20 }}>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: TEXT_PRIMARY,
              letterSpacing: "-0.02em",
              marginBottom: 8,
            }}
          >
            Welcome back
          </h2>
          <p style={{ fontSize: 15, color: TEXT_SECONDARY, marginBottom: 32 }}>
            Sign in to continue your journey
          </p>
          <div className="flex flex-col gap-4 mb-6">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>
          {error && (
            <p style={{ fontSize: 13, color: "#E57373", marginBottom: 16 }}>
              {error}
            </p>
          )}
          <PrimaryBtn
            onClick={handleLogIn}
            disabled={loading || !email || !password}
            label={loading ? "Signing in..." : "Sign In"}
          />
          <Divider />
          <GoogleButton disabled={loading} />
          <p style={{ textAlign: "center", marginTop: 16 }}>
            <button
              onClick={() => switchMode("forgot")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: TEXT_MUTED,
                fontSize: 13,
                fontFamily: "inherit",
              }}
            >
              Forgot password?
            </button>
          </p>
          <p
            style={{
              textAlign: "center",
              fontSize: 13,
              color: TEXT_MUTED,
              marginTop: 8,
            }}
          >
            No account?{" "}
            <button
              onClick={() => switchMode("signup")}
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
              Create one
            </button>
          </p>
        </div>
      </div>
    );

  if (mode === "signup")
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
        <button
          onClick={() => switchMode("landing")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "20px 0",
            color: TEXT_MUTED,
            fontFamily: "inherit",
            fontSize: 14,
          }}
        >
          <ChevronLeft size={18} /> Back
        </button>
        <div style={{ flex: 1, paddingTop: 20 }}>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: TEXT_PRIMARY,
              letterSpacing: "-0.02em",
              marginBottom: 8,
            }}
          >
            Create your account
          </h2>
          <p style={{ fontSize: 15, color: TEXT_SECONDARY, marginBottom: 32 }}>
            Start your personalized journey
          </p>
          <div className="flex flex-col gap-4 mb-6">
            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            <p style={{ fontSize: 12, color: TEXT_MUTED, marginTop: -12 }}>
              At least {MIN_PASSWORD_LENGTH} characters
            </p>
          </div>
          {error && (
            <p style={{ fontSize: 13, color: "#E57373", marginBottom: 16 }}>
              {error}
            </p>
          )}
          <PrimaryBtn
            onClick={handleSignUp}
            disabled={loading || !isEmailValid || !isPasswordValid}
            label={loading ? "Creating account..." : "Get Started"}
          />
          <Divider />
          <GoogleButton disabled={loading} />
          <p
            style={{
              textAlign: "center",
              fontSize: 13,
              color: TEXT_MUTED,
              marginTop: 20,
            }}
          >
            Have an account?{" "}
            <button
              onClick={() => switchMode("login")}
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
              Sign in
            </button>
          </p>
        </div>
      </div>
    );

  if (mode === "forgot")
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
        <button
          onClick={() => switchMode("login")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: "20px 0",
            color: TEXT_MUTED,
            fontFamily: "inherit",
            fontSize: 14,
          }}
        >
          <ChevronLeft size={18} /> Back
        </button>
        <div style={{ flex: 1, paddingTop: 20 }}>
          <h2
            style={{
              fontSize: 28,
              fontWeight: 500,
              color: TEXT_PRIMARY,
              letterSpacing: "-0.02em",
              marginBottom: 8,
            }}
          >
            Reset password
          </h2>
          <p style={{ fontSize: 15, color: TEXT_SECONDARY, marginBottom: 32 }}>
            Enter your email and we'll send you a reset link.
          </p>
          {resetSent ? (
            <div
              style={{
                background: "rgba(212,176,106,0.12)",
                border: `1px solid ${GOLD}40`,
                borderRadius: 12,
                padding: "16px 20px",
                fontSize: 14,
                color: TEXT_SECONDARY,
                lineHeight: 1.6,
              }}
            >
              Check your inbox — a reset link is on its way to <strong>{email}</strong>.
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4 mb-6">
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                />
              </div>
              {error && (
                <p style={{ fontSize: 13, color: "#E57373", marginBottom: 16 }}>
                  {error}
                </p>
              )}
              <PrimaryBtn
                onClick={handleForgotPassword}
                disabled={loading || !isEmailValid}
                label={loading ? "Sending..." : "Send Reset Link"}
              />
            </>
          )}
        </div>
      </div>
    );

  // Landing
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
      <div style={{ flex: 1, paddingTop: 60 }}>
        {/* Logo mark */}
        <div className="fade-up" style={{ marginBottom: 32 }}>
          <Image src="/logo.png" alt="Bloom" width={160} height={128} priority style={{ width: 160, height: "auto" }} />
        </div>
        <p
          className="fade-up-1"
          style={{
            fontSize: 12,
            color: GOLD,
            letterSpacing: "0.12em",
            textTransform: "uppercase" as const,
            fontWeight: 600,
            marginBottom: 10,
          }}
        >
          AI Optimization App
        </p>
        <h1
          className="fade-up-2"
          style={{
            fontSize: 36,
            fontWeight: 500,
            color: TEXT_PRIMARY,
            letterSpacing: "-0.025em",
            lineHeight: 1.15,
            marginBottom: 16,
            fontFamily: 'Georgia,"Palatino Linotype",serif',
          }}
        >
          Optimize Your Path
          <br />
          to Parenthood
        </h1>
        <p
          className="fade-up-3"
          style={{
            fontSize: 15,
            color: TEXT_SECONDARY,
            lineHeight: 1.7,
            marginBottom: 36,
          }}
        >
          We personalize everything to your biology, lifestyle, and environment.
          This is precision with heart.
        </p>
        <div
          className="fade-up-4"
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
            marginBottom: 36,
          }}
        >
          {[
            "Biological & cycle intelligence",
            "AI-generated daily protocols",
            "Partner fertility integration",
            "Environmental adaptation",
          ].map((f) => (
            <div
              key={f}
              style={{ display: "flex", alignItems: "center", gap: 12 }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: GOLD,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 14, color: TEXT_SECONDARY }}>{f}</span>
            </div>
          ))}
        </div>
      </div>
      <div
        className="fade-up-5"
        style={{
          paddingBottom: 40,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <button
          onClick={() => switchMode("signup")}
          style={{
            width: "100%",
            background: GOLD,
            color: "#fff",
            border: "none",
            borderRadius: 14,
            padding: "16px",
            fontSize: 16,
            fontWeight: 600,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            fontFamily: "inherit",
          }}
        >
          Begin your journey <ArrowRight size={18} />
        </button>
        <button
          onClick={() => switchMode("login")}
          style={{
            width: "100%",
            background: "transparent",
            color: TEXT_SECONDARY,
            border: `1.5px solid ${BORDER}`,
            borderRadius: 14,
            padding: "16px",
            fontSize: 16,
            fontWeight: 500,
            cursor: "pointer",
            fontFamily: "inherit",
          }}
        >
          Sign In
        </button>
        {error && (
          <p style={{ fontSize: 13, color: "#E57373", textAlign: "center" }}>
            {error}
          </p>
        )}
        <p style={{ textAlign: "center", fontSize: 12, color: TEXT_MUTED }}>
          Takes only 4 minutes · Nothing to buy
        </p>
      </div>
    </div>
  );
}
