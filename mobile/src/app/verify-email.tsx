import { useEffect, useRef, useState } from "react";
import { Text, View } from "react-native";
import { router } from "expo-router";
import { onAuthStateChanged } from "firebase/auth";
import { Mail } from "lucide-react-native";
import { auth } from "@/lib/firebase";
import { checkEmailVerified, resendVerificationEmail, logOut } from "@/lib/auth";
import { getProfile } from "@/lib/data";
import Button from "@/components/shared/Button";

const RESEND_COOLDOWN_SECONDS = 30;
const POLL_INTERVAL_MS = 4000;

export default function VerifyEmailScreen() {
  const [email, setEmail] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState("");
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");
  const [cooldown, setCooldown] = useState(0);
  const navigatingRef = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/auth");
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
      router.replace("/(tabs)");
    } catch {
      router.replace("/onboarding");
    }
    return true;
  }

  // Poll in the background so a user who verifies from another device gets
  // moved along automatically, without needing to tap back into the app.
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
    <View className="flex-1 bg-bg justify-center px-6">
      <View className="w-16 h-16 rounded-2xl items-center justify-center mb-6" style={{ backgroundColor: "rgba(212,176,106,0.15)" }}>
        <Mail size={26} color="#D4B06A" />
      </View>
      <Text className="font-serif text-2xl text-charcoal mb-3">Confirm your email</Text>
      <Text className="text-secondary text-sm leading-6 mb-7">
        We sent a verification link to{" "}
        <Text className="text-charcoal font-semibold">{email ?? "your email"}</Text>. Tap it to
        continue — this screen will move on automatically once it's confirmed.
      </Text>

      {error ? <Text className="text-warning text-sm mb-4">{error}</Text> : null}

      <View className="mb-3">
        <Button fullWidth loading={checking} onPress={handleCheckNow}>
          I've verified — continue
        </Button>
      </View>

      <View className="mb-6">
        <Button
          fullWidth
          variant="outline"
          disabled={resendState === "sending" || cooldown > 0}
          onPress={handleResend}
        >
          {cooldown > 0
            ? `Resend email (${cooldown}s)`
            : resendState === "sending"
              ? "Sending..."
              : resendState === "sent"
                ? "Sent — resend again"
                : "Resend verification email"}
        </Button>
      </View>

      <Text className="text-center text-muted text-sm">
        Wrong email?{" "}
        <Text className="text-gold font-semibold" onPress={() => logOut()}>
          Sign out
        </Text>
      </Text>
    </View>
  );
}
