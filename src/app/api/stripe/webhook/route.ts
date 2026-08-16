import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { stripe } from "@/lib/stripe";
import type Stripe from "stripe";

// Stripe needs the raw request body to verify the signature.
export const runtime = "nodejs";

async function syncSubscription(subscription: Stripe.Subscription) {
  const uid =
    subscription.metadata?.firebase_uid ||
    (
      await adminDb
        .collection("users")
        .where("stripe_customer_id", "==", subscription.customer as string)
        .limit(1)
        .get()
    ).docs[0]?.id;
  if (!uid) return;

  // current_period_end lives on the subscription item, not the subscription
  // itself, as of this API version.
  const periodEnd = subscription.items.data[0]?.current_period_end;

  await adminDb
    .collection("users")
    .doc(uid)
    .set(
      {
        subscription_status: subscription.status,
        stripe_customer_id: subscription.customer as string,
        stripe_subscription_id: subscription.id,
        trial_ends_at: subscription.trial_end ? subscription.trial_end * 1000 : null,
        current_period_end: periodEnd ? periodEnd * 1000 : null,
        subscription_platform: "stripe",
      },
      { merge: true },
    );
}

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const rawBody = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig!, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err: any) {
    return NextResponse.json({ error: `Invalid signature: ${err.message}` }, { status: 400 });
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.subscription) {
        const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
        await syncSubscription(subscription);
      }
      break;
    }
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted": {
      await syncSubscription(event.data.object as Stripe.Subscription);
      break;
    }
  }

  return NextResponse.json({ received: true });
}