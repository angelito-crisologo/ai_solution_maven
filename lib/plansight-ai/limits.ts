/**
 * Tier-aware upload limits.
 *
 * Free (and anonymous, and signed-in-but-not-activated) gets the original
 * 5 MB / 5000-task caps. Pro raises both to support enterprise plans
 * (25 MB / 25000 tasks).
 *
 * The MPP parser service has its own 25 MB ceiling, so file caps above
 * that don't help. JSON-body and task-count caps are independent of file
 * size — a 4 MB MPP can parse into a 12 MB JSON for very task-heavy
 * plans.
 */

export type Tier = "free" | "pro";

export type PlanLimits = {
  /** Max raw .mpp file size accepted by /api/plansight/import-mpp. */
  maxFileBytes: number;
  /** Max JSON body bytes for POST /api/plansight/share. */
  maxBodyBytes: number;
  /** Max task count after parsing — enforced in the share route. */
  maxTasks: number;
};

const LIMITS: Record<Tier, PlanLimits> = {
  free: {
    maxFileBytes: 5 * 1024 * 1024,
    maxBodyBytes: 5 * 1024 * 1024,
    maxTasks: 5000
  },
  pro: {
    maxFileBytes: 25 * 1024 * 1024,
    maxBodyBytes: 25 * 1024 * 1024,
    maxTasks: 25000
  }
};

export function getLimitsForTier(tier: Tier | null | undefined): PlanLimits {
  return tier === "pro" ? LIMITS.pro : LIMITS.free;
}

export function formatBytesMb(bytes: number): string {
  return `${Math.round(bytes / (1024 * 1024))} MB`;
}
