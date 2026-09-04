import { Platform } from "react-native";
import * as Notifications from "expo-notifications";

const CHANNEL_ID = "daily-reminders";

const REMINDERS = [
  { id: "breakfast", hour: 8, minute: 0, title: "🌅 Breakfast", body: "Don't forget your important nutrition for this morning." },
  { id: "lunch", hour: 12, minute: 30, title: "☀️ Lunch", body: "Don't forget your important nutrition for lunch." },
  { id: "dinner", hour: 18, minute: 30, title: "🌙 Dinner", body: "Don't forget your important nutrition for dinner." },
] as const;

// Android 13+ won't show the permission prompt at all until a channel
// exists, so this must run before requestPermissionsAsync().
async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: "Daily reminders",
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

export async function requestNotificationPermission(): Promise<boolean> {
  await ensureAndroidChannel();
  const { status } = await Notifications.requestPermissionsAsync({
    ios: { allowAlert: true, allowBadge: true, allowSound: true },
  });
  return status === "granted";
}

// Idempotent — cancels anything previously scheduled first, so calling
// this again (e.g. on every app open) never produces duplicate reminders.
export async function scheduleDailyReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const r of REMINDERS) {
    await Notifications.scheduleNotificationAsync({
      content: { title: r.title, body: r.body, sound: true },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: r.hour,
        minute: r.minute,
        ...(Platform.OS === "android" ? { channelId: CHANNEL_ID } : {}),
      },
    });
  }
}

// Call once after onboarding (and harmlessly again on later app opens —
// requestNotificationPermission() is a no-op if already granted/denied,
// and scheduling is idempotent).
export async function setupDailyReminders() {
  const granted = await requestNotificationPermission();
  if (granted) await scheduleDailyReminders();
  return granted;
}
