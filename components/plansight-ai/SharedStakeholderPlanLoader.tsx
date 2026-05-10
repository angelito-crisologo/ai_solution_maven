"use client";

import { useEffect, useMemo, useState } from "react";
import { FileX2, Loader2 } from "lucide-react";
import { summarizePlan } from "@/lib/plansight-ai/analysis";
import { createSharePayload } from "@/lib/plansight-ai/share";
import type { Plan } from "@/lib/plansight-ai/types";
import { SharedStakeholderPlanView } from "./SharedStakeholderPlanView";

type Props = {
  shareId: string;
};

type LoadState =
  | { kind: "loading"; message: string }
  | { kind: "loaded"; plan: Plan }
  | { kind: "not-found" }
  | { kind: "error"; message: string };

function storageKey(shareId: string) {
  return `plansight-share:${shareId}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

type FetchResult =
  | { kind: "ok"; plan: Plan }
  | { kind: "not-found" }
  | { kind: "error" };

export function SharedStakeholderPlanLoader({ shareId }: Props) {
  const [state, setState] = useState<LoadState>({
    kind: "loading",
    message: "Loading shared plan..."
  });

  useEffect(() => {
    let cancelled = false;

    async function fetchSharedPlanWithRetry(): Promise<FetchResult> {
      const attempts = 4;
      let lastWas404 = false;

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
          return { kind: "ok", plan: payload.plan };
        }

        lastWas404 = response.status === 404;

        if (attempt < attempts) {
          await sleep(750 * attempt);
        }
      }

      return lastWas404 ? { kind: "not-found" } : { kind: "error" };
    }

    async function loadSharedPlan() {
      try {
        const urlPlan = new URLSearchParams(window.location.search).get("plan");
        if (urlPlan) {
          const parsed = JSON.parse(urlPlan) as Plan;
          if (parsed && Array.isArray(parsed.tasks)) {
            if (!cancelled) {
              setState({ kind: "loaded", plan: parsed });
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
              setState({ kind: "loaded", plan: parsed.plan });
            }
            return;
          }
        }

        const result = await fetchSharedPlanWithRetry();
        if (cancelled) return;

        if (result.kind === "ok") {
          setState({ kind: "loaded", plan: result.plan });
          window.localStorage.setItem(storageKey(shareId), JSON.stringify({ plan: result.plan }));
          return;
        }

        if (result.kind === "not-found") {
          // The plan was deleted (Free single-plan slot replacement, expired
          // guest plan, or the PM removed it). Tell stakeholders explicitly
          // instead of leaving them on a generic loading state.
          window.localStorage.removeItem(storageKey(shareId));
          setState({ kind: "not-found" });
          return;
        }

        setState({
          kind: "error",
          message: "This shared plan is not available right now. Please try again in a moment."
        });
      } catch (error) {
        if (!cancelled) {
          setState({
            kind: "error",
            message:
              error instanceof Error && error.message
                ? error.message
                : "This shared plan is not available right now."
          });
        }
      }
    }

    void loadSharedPlan();

    return () => {
      cancelled = true;
    };
  }, [shareId]);

  const metrics = useMemo(
    () => (state.kind === "loaded" ? summarizePlan(state.plan) : null),
    [state]
  );
  const share = useMemo(
    () => (state.kind === "loaded" ? createSharePayload(state.plan, shareId) : null),
    [state, shareId]
  );

  if (state.kind === "not-found") {
    return (
      <section className="px-6 py-10">
        <div className="mx-auto w-full max-w-[1600px] rounded-xl border border-slate-200 bg-white p-10 text-center">
          <div className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-md bg-slate-100 text-slate-500">
            <FileX2 className="h-7 w-7" />
          </div>
          <p className="mt-5 text-micro text-cyan-700">Shared plan</p>
          <h2 className="mt-2 text-h1 text-ink">
            This plan is no longer available for viewing
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-body-lg text-slate-700">
            The project manager may have replaced this plan with a newer version or
            removed it. Reach out to them for an up-to-date share link.
          </p>
        </div>
      </section>
    );
  }

  if (state.kind === "loaded" && metrics && share) {
    return <SharedStakeholderPlanView plan={state.plan} metrics={metrics} share={share} />;
  }

  // loading or transient error
  const message =
    state.kind === "error" ? state.message : state.kind === "loading" ? state.message : "";

  return (
    <section className="px-6 py-10">
      <div className="mx-auto w-full max-w-[1600px] rounded-xl border border-slate-200 bg-white p-8">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-cyan-700" />
          <div>
            <p className="text-micro text-cyan-700">Shared plan</p>
            <h2 className="text-h2 text-ink">Loading stakeholder view</h2>
          </div>
        </div>
        <p className="mt-4 text-body text-slate-700">{message}</p>
        <p className="mt-2 text-body text-slate-500">
          If this was just published, wait a moment and refresh. Guest plans stay
          available for 30 days.
        </p>
      </div>
    </section>
  );
}
