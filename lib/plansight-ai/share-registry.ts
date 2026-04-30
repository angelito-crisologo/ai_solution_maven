import type { Plan } from "./types";
import { demoPlan } from "./demo";
import { createSharePayload } from "./share";

export type SharedPlanRecord = {
  shareId: string;
  plan: Plan;
  storedAt: string;
};

type SharedPlanRegistry = {
  plansightSharedPlans?: Map<string, SharedPlanRecord>;
};

const registry = globalThis as typeof globalThis & SharedPlanRegistry;

const sharedPlans = registry.plansightSharedPlans ?? new Map<string, SharedPlanRecord>();

registry.plansightSharedPlans = sharedPlans;

export function storeSharedPlan(shareId: string, plan: Plan) {
  const record: SharedPlanRecord = {
    shareId,
    plan,
    storedAt: new Date().toISOString()
  };

  sharedPlans.set(shareId, record);
  return record;
}

export function getSharedPlan(shareId: string) {
  return sharedPlans.get(shareId)?.plan ?? null;
}

export function getSharedPlanRecord(shareId: string) {
  return sharedPlans.get(shareId) ?? null;
}

storeSharedPlan(createSharePayload(demoPlan).shareId, demoPlan);
