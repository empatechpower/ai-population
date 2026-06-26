"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { logIn, signUp } from "@/lib/auth";
import { ArrowRight, ChevronLeft, Leaf } from "lucide-react";
import Input from "@/components/shared/Input";

const BG = "#F5F2EC";
const CARD = "#FFFFFF";
const TEXT_PRIMARY = "#0B0B0D";
const TEXT_SECONDARY = "#5E5E63";
const TEXT_MUTED = "#9A9AA0";
const GOLD = "#D4B06A";
const BORDER = "rgba(0,0,0,0.08)";

export default function LandingPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"landing" | "login" | "signup">("landing");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSignUp() {
    setLoading(true);
    setError("");
    try {
      await signUp(email, password);
      router.push("/onboarding");
    } catch (e: any) {
      setError(e?.message || "Could not create account. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLogIn() {
    setLoading(true);
    setError("");
    try {
      await logIn(email, password);
      router.push("/dashboard");
    } catch (e: any) {
      setError(e?.message || "Invalid email or password.");
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
          onClick={() => setMode("landing")}
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
            disabled={loading}
            label={loading ? "Signing in..." : "Sign In"}
          />
          <p
            style={{
              textAlign: "center",
              fontSize: 13,
              color: TEXT_MUTED,
              marginTop: 20,
            }}
          >
            No account?{" "}
            <button
              onClick={() => setMode("signup")}
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
          onClick={() => setMode("landing")}
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
          </div>
          {error && (
            <p style={{ fontSize: 13, color: "#E57373", marginBottom: 16 }}>
              {error}
            </p>
          )}
          <PrimaryBtn
            onClick={handleSignUp}
            disabled={loading}
            label={loading ? "Creating account..." : "Get Started"}
          />
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
              onClick={() => setMode("login")}
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
        <div
          className="fade-up"
          style={{
            width: 52,
            height: 52,
            borderRadius: 16,
            background: "rgba(212,176,106,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <Leaf size={24} color={GOLD} />
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
          onClick={() => setMode("signup")}
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
          onClick={() => setMode("login")}
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
        <p style={{ textAlign: "center", fontSize: 12, color: TEXT_MUTED }}>
          Takes only 4 minutes · Nothing to buy
        </p>
      </div>
    </div>
  );
}
