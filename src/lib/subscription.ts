// Single source of truth for "does this user have access" — checked by both
// the web gate (useProfile) and, via the same Firestore fields, mobile.
// subscription_status/trial_ends_at/etc. are written server-side only
// (Stripe webhook for web, RevenueCat webhook for mobile) — see
// firestore rules, which block client writes to these fields.
export function hasActiveAccess(profile: any): boolean {
  if (!profile) return false;
  if (profile.subscription_status === "active") return true;
  if (profile.subscription_status === "trialing") {
    return typeof profile.trial_ends_at === "number" && profile.trial_ends_at > Date.now();
  }
  return false;
}