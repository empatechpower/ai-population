import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { verifyRequestUser } from "@/lib/apiAuth";
import { stripe } from "@/lib/stripe";

export async function POST(req: NextRequest) {
  const { userId } = await req.json();
  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }
  if (!(await verifyRequestUser(req, userId))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userRef = adminDb.collection("users").doc(userId);
  const profileSnap = await userRef.get();
  const profile = profileSnap.data() ?? {};

  // Reuse an existing Stripe customer if this user already has one
  // (e.g. a previous canceled subscription), otherwise create one.
  let customerId = profile.stripe_customer_id as string | undefined;
  if (!customerId) {
    const authUser = await adminAuth.getUser(userId);
    const customer = await stripe.customers.create({
      email: authUser.email,
      metadata: { firebase_uid: userId },
    });
    customerId = customer.id;
    await userRef.set({ stripe_customer_id: customerId }, { merge: true });
  }

  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL;

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    client_reference_id: userId,
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    subscription_data: {
      trial_period_days: 7,
      metadata: { firebase_uid: userId },
    },
    success_url: `${origin}/dashboard?subscribed=1`,
    cancel_url: `${origin}/subscribe`,
  });

  return NextResponse.json({ url: session.url });
}