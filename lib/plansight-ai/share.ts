import type { Plan } from "./types";
import { summarizePlan } from "./analysis";

export type SharePayload = {
  shareId: string;
  shareUrl: string;
  isPublic: boolean;
  title: string;
  summary: string;
};

/**
 * Generate an unguessable share ID. The URL is the credential for
 * stakeholder access, so this must not be derivable from plan content.
 *
 * Server-side use is authoritative; clients receive the share ID back
 * from the share API after persisting.
 */
export function generateShareId() {
  return crypto.randomUUID();
}

/**
 * Format a share payload for display given a plan and an existing share ID.
 * Does not generate IDs — pass an ID returned by the share API or read from
 * the URL on stakeholder views.
 */
export function createSharePayload(plan: Plan, shareId: string): SharePayload {
  const metrics = summarizePlan(plan);

  return {
    shareId,
    shareUrl: `/share/${shareId}`,
    isPublic: true,
    title: plan.title,
    summary: `${metrics.totalTasks} tasks, ${metrics.completedTasks} completed, ${metrics.milestoneTasks} milestones`
  };
}
