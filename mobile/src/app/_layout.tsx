import "../global.css";

import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { hydrateAuth } from "@/lib/auth";

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    hydrateAuth().finally(() => {
      setReady(true);
      SplashScreen.hideAsync();
    });
  }, []);

  if (!ready) return null;

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
