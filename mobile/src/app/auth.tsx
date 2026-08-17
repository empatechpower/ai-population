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
import { router } from "expo-router";
import { GoogleSigninButton } from "@react-native-google-signin/google-signin";
import { logIn, signUp, signInWithGoogle } from "@/lib/auth";

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
      router.replace("/onboarding");
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
      router.replace("/(tabs)");
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
      router.replace(isNewUser ? "/onboarding" : "/(tabs)");
    } catch (e: any) {
      setError(e?.message || "Google sign-in failed. Please try again.");
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

        <GoogleSigninButton
          size={GoogleSigninButton.Size.Wide}
          color={GoogleSigninButton.Color.Light}
          onPress={handleGoogleSignIn}
          disabled={loading}
          style={{ width: "100%", height: 48 }}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
