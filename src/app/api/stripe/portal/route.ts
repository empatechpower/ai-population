import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
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

  const profileSnap = await adminDb.collection("users").doc(userId).get();
  const customerId = profileSnap.data()?.stripe_customer_id;
  if (!customerId) {
    return NextResponse.json({ error: "No subscription on file" }, { status: 404 });
  }

  const origin = req.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL;
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: `${origin}/profile`,
  });

  return NextResponse.json({ url: session.url });
}