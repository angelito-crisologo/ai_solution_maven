import { z } from "zod";

// Absolute ceilings used by the Zod schema and by raw-body content-length
// checks. Tier-aware caps (Free vs Pro) live in lib/plansight-ai/limits.ts
// and are applied in the route handlers after we know who the user is.
export const MAX_PLAN_TASKS = 25_000;
export const MAX_PLAN_BODY_BYTES = 25 * 1024 * 1024; // 25 MB

export const planDependencySchema = z.object({
  predecessorTaskId: z.number().int().nullable(),
  type: z.string().nullable(),
  lag: z.string().nullable()
});

export const planTaskSchema = z.object({
  id: z.number().int(),
  uniqueId: z.number().int().nullable(),
  parentId: z.number().int().nullable(),
  name: z.string(),
  outlineLevel: z.number().int(),
  outlineNumber: z.string().nullable(),
  wbs: z.string().nullable(),
  start: z.string().nullable(),
  finish: z.string().nullable(),
  duration: z.string().nullable(),
  percentComplete: z.number().nullable(),
  summary: z.boolean(),
  milestone: z.boolean(),
  predecessors: z.array(planDependencySchema),
  resourceNames: z.array(z.string()),
  notes: z.string().nullable()
});

export const planSchema = z.object({
  id: z.string(),
  title: z.string().min(1).max(500),
  sourceFormat: z.enum(["mpp", "xlsx", "smartsheet", "other"]),
  importedAt: z.string(),
  startDate: z.string().nullable(),
  finishDate: z.string().nullable(),
  tasks: z
    .array(planTaskSchema)
    .max(MAX_PLAN_TASKS, `Plan exceeds maximum of ${MAX_PLAN_TASKS} tasks.`)
});

export type ValidatedPlan = z.infer<typeof planSchema>;
