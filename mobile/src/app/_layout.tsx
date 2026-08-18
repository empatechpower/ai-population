import "../global.css";

import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { hydrateAuth } from "@/lib/auth";
import IntroVideo from "@/components/shared/IntroVideo";

SplashScreen.preventAutoHideAsync();

const INTRO_SEEN_KEY = "hasSeenIntro";

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  useEffect(() => {
    Promise.all([hydrateAuth(), AsyncStorage.getItem(INTRO_SEEN_KEY)]).then(([, seen]) => {
      setShowIntro(!seen);
      setReady(true);
      SplashScreen.hideAsync();
    });
  }, []);

  if (!ready) return null;

  // First-ever app open plays a one-time intro video ahead of the normal
  // auth/onboarding flow, gated by a local flag so it never shows again.
  if (showIntro) {
    return (
      <IntroVideo
        onFinish={() => {
          AsyncStorage.setItem(INTRO_SEEN_KEY, "1");
          setShowIntro(false);
        }}
      />
    );
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="verify-email" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="profile" options={{ headerShown: true, title: "Profile" }} />
    </Stack>
  );
}
