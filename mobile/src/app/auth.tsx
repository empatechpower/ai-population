import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { router } from "expo-router";
import * as AppleAuthentication from "expo-apple-authentication";
import { logIn, signUp, signInWithGoogle, signInWithApple, isEmailVerified } from "@/lib/auth";

function GoogleLogo() {
  return (
    <Svg width={18} height={18} viewBox="0 0 48 48">
      <Path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12 c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24 c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <Path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039 l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <Path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36 c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <Path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571 c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </Svg>
  );
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 6;

type Mode = "landing" | "login" | "signup";

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>("landing");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const isEmailValid = EMAIL_RE.test(email.trim());
  const isPasswordValid = password.length >= MIN_PASSWORD_LENGTH;

  function switchMode(next: Mode) {
    setMode(next);
    setError("");
  }

  async function handleSignUp() {
    if (!isEmailValid) return setError("Please enter a valid email address.");
    if (!isPasswordValid)
      return setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    setLoading(true);
    setError("");
    try {
      await signUp(email.trim(), password);
      router.replace("/verify-email");
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
      router.replace(isEmailVerified() ? "/(tabs)" : "/verify-email");
    } catch (e: any) {
      setError(e?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogleSignIn() {
    setLoading(true);
    setError("");
    try {
      const { isNewUser } = await signInWithGoogle();
      if (!isEmailVerified()) {
        router.replace("/verify-email");
        return;
      }
      router.replace(isNewUser ? "/onboarding" : "/(tabs)");
    } catch (e: any) {
      setError(e?.message || "Google sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAppleSignIn() {
    if (loading) return;
    setLoading(true);
    setError("");
    try {
      const { isNewUser } = await signInWithApple();
      if (!isEmailVerified()) {
        router.replace("/verify-email");
        return;
      }
      router.replace(isNewUser ? "/onboarding" : "/(tabs)");
    } catch (e: any) {
      setError(e?.message || "Apple sign-in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (mode === "landing") {
    return (
      <View className="flex-1 bg-bg justify-center items-center px-6">
        <Text className="font-serif text-4xl text-charcoal text-center mb-3">Bloom</Text>
        <Text className="text-secondary text-center text-base mb-12 leading-6">
          Your personalized fertility and pregnancy protocol.
        </Text>
        <Pressable
          onPress={() => switchMode("signup")}
          className="bg-gold rounded-2xl py-4 px-10 w-full items-center mb-3"
        >
          <Text className="text-white font-semibold text-base">Get started</Text>
        </Pressable>
        <Pressable onPress={() => switchMode("login")} className="py-3">
          <Text className="text-secondary text-sm">Already have an account? Log in</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView contentContainerClassName="flex-grow justify-center px-6 py-10">
        <Pressable onPress={() => switchMode("landing")} className="mb-8">
          <Text className="text-secondary text-sm">← Back</Text>
        </Pressable>

        <Text className="font-serif text-3xl text-charcoal mb-8">
          {mode === "signup" ? "Create your account" : "Welcome back"}
        </Text>

        <Text className="text-2xs text-muted uppercase tracking-widest font-medium mb-2">
          Email
        </Text>
        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="you@example.com"
          className="bg-elevated border border-border rounded-2xl px-4 py-4 text-base text-charcoal mb-5"
        />

        <Text className="text-2xs text-muted uppercase tracking-widest font-medium mb-2">
          Password
        </Text>
        <TextInput
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          className="bg-elevated border border-border rounded-2xl px-4 py-4 text-base text-charcoal mb-5"
        />

        {error ? <Text className="text-warning text-sm mb-4 text-center">{error}</Text> : null}

        <Pressable
          onPress={mode === "signup" ? handleSignUp : handleLogIn}
          disabled={loading}
          className="bg-gold rounded-2xl py-4 items-center"
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">
              {mode === "signup" ? "Create account" : "Log in"}
            </Text>
          )}
        </Pressable>

        <View className="flex-row items-center gap-3 my-5">
          <View className="flex-1 h-px bg-border" />
          <Text className="text-muted text-xs">or</Text>
          <View className="flex-1 h-px bg-border" />
        </View>

        {Platform.OS === "ios" && (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={16}
            style={{ width: "100%", height: 52, marginBottom: 12, opacity: loading ? 0.6 : 1 }}
            onPress={handleAppleSignIn}
          />
        )}

        <Pressable
          onPress={handleGoogleSignIn}
          disabled={loading}
          className="bg-elevated border border-border rounded-2xl py-4 flex-row items-center justify-center gap-2.5"
          style={{ opacity: loading ? 0.6 : 1 }}
        >
          <GoogleLogo />
          <Text className="text-charcoal font-semibold text-base">Continue with Google</Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
