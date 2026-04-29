import type { Plan } from "./types";
import { summarizePlan } from "./analysis";

export type SharePayload = {
  shareId: string;
  shareUrl: string;
  isPublic: boolean;
  title: string;
  summary: string;
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function createSharePayload(plan: Plan): SharePayload {
  const metrics = summarizePlan(plan);
  const shareId = `${slugify(plan.title || "plan")}-${plan.id}`;

  return {
    shareId,
    shareUrl: `/share/${shareId}`,
    isPublic: true,
    title: plan.title,
    summary: `${metrics.totalTasks} tasks, ${metrics.completedTasks} completed, ${metrics.milestoneTasks} milestones`
  };
}
