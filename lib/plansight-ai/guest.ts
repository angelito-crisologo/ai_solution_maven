/**
 * ISO timestamp for when an anonymous (guest) plan should auto-expire.
 *
 * Anonymous plans live for 24 hours. The short TTL is the conversion
 * mechanic: the in-product banner tells the visitor their plan and share
 * link expire in 24h unless they sign up. Cleanup runs opportunistically
 * during the next saveSharedPlan() — no scheduled job.
 *
 * Signed-in user shares (owner_user_id IS NOT NULL) pass `expiresAt = null`
 * at the call site, so they never expire regardless of this function.
 */
export function getGuestPlanExpiryIso(hours = 24) {
  return new Date(Date.now() + hours * 60 * 60 * 1000).toISOString();
}
