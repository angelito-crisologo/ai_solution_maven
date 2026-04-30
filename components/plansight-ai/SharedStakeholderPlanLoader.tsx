"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { summarizePlan } from "@/lib/plansight-ai/analysis";
import { createSharePayload } from "@/lib/plansight-ai/share";
import type { Plan } from "@/lib/plansight-ai/types";
import { SharedStakeholderPlanView } from "./SharedStakeholderPlanView";

type Props = {
  shareId: string;
};

function storageKey(shareId: string) {
  return `plansight-share:${shareId}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

export function SharedStakeholderPlanLoader({ shareId }: Props) {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [status, setStatus] = useState("Loading shared plan...");

  useEffect(() => {
    let cancelled = false;

    async function fetchSharedPlanWithRetry() {
      const attempts = 4;

      for (let attempt = 1; attempt <= attempts; attempt += 1) {
        const response = await fetch(
          `/api/plansight/share?shareId=${encodeURIComponent(shareId)}&debug=1`
        );
        const payload = (await response.json().catch(() => ({}))) as {
          plan?: Plan;
          debug?: unknown;
          error?: string;
        };

        if (payload.debug) {
          console.debug("PlanSight share debug", payload.debug);
        }

        if (response.ok && payload.plan) {
          return payload.plan;
        }

        if (attempt < attempts) {
          await sleep(750 * attempt);
        }
      }

      return null;
    }

    async function loadSharedPlan() {
      try {
        const urlPlan = new URLSearchParams(window.location.search).get("plan");
        if (urlPlan) {
          const parsed = JSON.parse(urlPlan) as Plan;
          if (parsed && Array.isArray(parsed.tasks)) {
            if (!cancelled) {
              setPlan(parsed);
              setStatus("Shared plan loaded.");
              window.localStorage.setItem(storageKey(shareId), JSON.stringify({ plan: parsed }));
            }
            return;
          }
        }

        const cached = window.localStorage.getItem(storageKey(shareId));
        if (cached) {
          const parsed = JSON.parse(cached) as { plan?: Plan };
          if (parsed.plan) {
            if (!cancelled) {
              setPlan(parsed.plan);
              setStatus("Shared plan loaded.");
            }
            return;
          }
        }

        const fetchedPlan = await fetchSharedPlanWithRetry();
        if (!fetchedPlan) {
          throw new Error("Shared plan not available yet.");
        }

        if (!cancelled) {
          setPlan(fetchedPlan);
          setStatus("Shared plan loaded.");
          window.localStorage.setItem(storageKey(shareId), JSON.stringify({ plan: fetchedPlan }));
        }
      } catch (error) {
        if (!cancelled) {
          setPlan(null);
          setStatus(error instanceof Error && error.message ? error.message : "This shared plan is not available yet.");
        }
      }
    }

    void loadSharedPlan();

    return () => {
      cancelled = true;
    };
  }, [shareId]);

  const metrics = useMemo(() => (plan ? summarizePlan(plan) : null), [plan]);
  const share = useMemo(() => (plan ? createSharePayload(plan) : null), [plan]);

  if (!plan || !metrics || !share) {
    return (
      <section className="px-6 py-10">
        <div className="mx-auto w-full max-w-[1600px] rounded-2xl border border-slate-200 bg-white p-8 shadow-soft">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                Shared plan
              </p>
              <h2 className="text-2xl font-semibold text-dark">Loading stakeholder view</h2>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-slate-600">{status}</p>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            If this was just published, wait a moment and refresh. Guest plans stay available for
            30 days.
          </p>
        </div>
      </section>
    );
  }

  return <SharedStakeholderPlanView plan={plan} metrics={metrics} share={share} />;
}
