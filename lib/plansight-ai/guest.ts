/**
 * ISO timestamp for when an anonymous (guest) plan should auto-expire.
 *
 * Phase 1: anonymous plans live for 30 days, then are cleaned up server-side
 * during the next save. Phase 4 (auth) will replace this with owner-based
 * retention for signed-in users.
 */
export function getGuestPlanExpiryIso(days = 30) {
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
}
