import webpush from "web-push";
import { adminDb } from "./firebaseAdmin";

webpush.setVapidDetails(
  "mailto:support@ai-population.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

interface SubscribedUser {
  uid: string;
  subscription: webpush.PushSubscription;
  city?: string;
}

async function getSubscribedUsers(): Promise<SubscribedUser[]> {
  const snap = await adminDb
    .collection("users")
    .where("web_push_subscription", "!=", null)
    .get();
  return snap.docs
    .map((d) => ({
      uid: d.id,
      subscription: d.data().web_push_subscription,
      city: d.data().city,
    }))
    .filter((u) => u.subscription?.endpoint);
}

// Sends to every subscribed user; a dead/expired subscription (410/404)
// clears the field so we stop retrying it, rather than erroring the whole
// run. Returns how many sends actually went out.
export async function sendToAllSubscribed(payload: { title: string; body: string }): Promise<number> {
  const users = await getSubscribedUsers();
  let sent = 0;
  await Promise.all(
    users.map(async (u) => {
      try {
        await webpush.sendNotification(u.subscription, JSON.stringify(payload));
        sent++;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await adminDb.collection("users").doc(u.uid).update({ web_push_subscription: null });
        } else {
          console.error(`[webPush] failed for ${u.uid}`, err?.message || err);
        }
      }
    }),
  );
  return sent;
}

// Same as sendToAllSubscribed, but only to users for whom `shouldSend`
// (given their city) resolves true — used for the weather-conditional
// sunshine reminder.
export async function sendToSubscribedWhere(
  payload: { title: string; body: string },
  shouldSend: (city: string) => Promise<boolean>,
): Promise<number> {
  const users = await getSubscribedUsers();
  let sent = 0;
  await Promise.all(
    users.map(async (u) => {
      if (!u.city) return;
      let send = false;
      try {
        send = await shouldSend(u.city);
      } catch (err) {
        console.error(`[webPush] shouldSend check failed for ${u.uid}`, err);
        return;
      }
      if (!send) return;
      try {
        await webpush.sendNotification(u.subscription, JSON.stringify(payload));
        sent++;
      } catch (err: any) {
        if (err?.statusCode === 404 || err?.statusCode === 410) {
          await adminDb.collection("users").doc(u.uid).update({ web_push_subscription: null });
        } else {
          console.error(`[webPush] failed for ${u.uid}`, err?.message || err);
        }
      }
    }),
  );
  return sent;
}
