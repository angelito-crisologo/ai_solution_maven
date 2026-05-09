"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  BarChart3,
  Check,
  KeyRound,
  Loader2,
  List,
  Sparkles,
  Upload
} from "lucide-react";
import { buildInsightsReport, summarizePlan } from "@/lib/plansight-ai/analysis";
import { createSharePayload } from "@/lib/plansight-ai/share";
import type { Plan } from "@/lib/plansight-ai/types";
import { PlanSightWorkspace } from "./PlanSightWorkspace";
import { PlanSightProjectInsightsPanel } from "./PlanSightProjectInsightsPanel";
import { PlanSightAIAnalysisPanel } from "./PlanSightAIAnalysisPanel";

type Props = {
  /** True when a Supabase auth session exists. Drives the sign-in CTA vs the
   * Pro upsell banner on plan replacement. */
  signedIn: boolean;
  /** Tier from the public.users row. null when anonymous. */
  userTier: "free" | "pro" | null;
};

export function PlanSightProductShell({ signedIn, userTier }: Props) {
  const isAnonymous = !signedIn;
  const isFreeSignedIn = signedIn && userTier !== "pro";
  const [plan, setPlan] = useState<Plan | null>(null);
  const [shareId, setShareId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("Ready to import an MPP plan.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<"plan" | "project-insights" | "ai-analysis">("plan");
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  // Tracks the title of the previous plan when a Free signed-in user replaces
  // their slot. Triggers the Pro-upsell banner. Anonymous users don't keep
  // any plan across imports, so this never fires for them.
  const [replacedPlanTitle, setReplacedPlanTitle] = useState<string | null>(null);
  const importedPlanTabsRef = useRef<HTMLElement | null>(null);

  const metrics = useMemo(() => (plan ? summarizePlan(plan) : null), [plan]);
  const analysis = useMemo(() => (plan ? buildInsightsReport(plan) : null), [plan]);
  const share = useMemo(
    () => (plan && shareId ? createSharePayload(plan, shareId) : null),
    [plan, shareId]
  );

  // Auto-scroll to the tabs the moment a plan is loaded so the user
  // immediately sees the workspace + view switcher. Runs after render
  // so the section ref is guaranteed to be set.
  useEffect(() => {
    if (plan && shareId && importedPlanTabsRef.current) {
      importedPlanTabsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [plan, shareId]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedFile) {
      setStatus("Choose an .mpp file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedFile);

    setIsSubmitting(true);
    setStatus(`Importing ${selectedFile.name}...`);

    try {
      const response = await fetch("/api/plansight/import-mpp", {
        method: "POST",
        body: formData
      });

      const payload = (await response.json()) as { plan: Plan } | { error?: string };

      if (!response.ok || !("plan" in payload)) {
        throw new Error("error" in payload && payload.error ? payload.error : "Failed to import the MPP file.");
      }

      const saveResponse = await fetch("/api/plansight/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          plan: payload.plan
        })
      });

      const savePayload = (await saveResponse.json().catch(() => ({}))) as {
        shareId?: string;
        error?: string;
      };

      if (!saveResponse.ok || !savePayload.shareId) {
        throw new Error(savePayload.error || "Imported the plan, but failed to persist it to the database.");
      }

      const newShareId = savePayload.shareId;

      try {
        window.localStorage.setItem(
          `plansight-share:${newShareId}`,
          JSON.stringify({ plan: payload.plan })
        );
      } catch {
        // Ignore storage failures and fall back to the database.
      }

      // Free signed-in users have a single-plan slot. When they import a new
      // plan, the previous one is hard-deleted server-side and we surface a
      // Pro upsell banner. Anonymous users had no persistent plan to begin
      // with; Pro users keep all plans, so the banner doesn't fire for them.
      if (isFreeSignedIn && plan && plan.title !== payload.plan.title) {
        setReplacedPlanTitle(plan.title);
      } else {
        setReplacedPlanTitle(null);
      }

      setPlan(payload.plan);
      setShareId(newShareId);
      setSelectedTaskIds(new Set());
      setStatus(`Imported ${selectedFile.name} and saved it.`);
      setActiveTab("plan");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to import the MPP file.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <section className="px-6 py-10">
        <div className="mx-auto max-w-[1200px] rounded-2xl border border-slate-200 bg-white p-6 shadow-soft">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                Import MPP
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-dark">
                Upload a Microsoft Project file
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-600">
                This version supports `.mpp` files only. The file is parsed into the PlanSight
                schema, then rendered as an analyzed plan with a stakeholder share view.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 lg:min-w-[420px]">
              <input
                type="file"
                accept=".mpp"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                className="block w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 file:mr-4 file:rounded-lg file:border-0 file:bg-dark file:px-4 file:py-2 file:text-sm file:font-medium file:text-white"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isSubmitting ? "Importing..." : "Import MPP"}
              </button>
            </form>
          </div>

          <p className="mt-4 text-sm text-slate-500">{status}</p>
          <div className="mt-4 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-600">
            Need to report an issue or request a feature?{" "}
            <Link
              href={{
                pathname: "/feedback",
                query: {
                  product: "PlanSight AI",
                  source: "imported-plan",
                  pagePath: "/products/plansight-ai",
                  planTitle: plan?.title ?? ""
                }
              }}
              className="font-semibold text-primary transition hover:text-secondary"
            >
              Send feedback
            </Link>
            .
          </div>
        </div>
      </section>

      {plan && metrics && share && analysis ? (
        <>
          <section
            ref={importedPlanTabsRef}
            className="scroll-mt-6 px-6 pb-2 pt-4"
            aria-label="Plan view switcher"
          >
            <div className="mx-auto flex max-w-[1200px] flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-sm">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="font-semibold text-dark">Plan loaded</span>
                <span className="text-slate-500">— pick a view</span>
              </div>

              <div
                role="tablist"
                aria-label="Plan views"
                className="inline-flex flex-wrap items-center gap-1 rounded-2xl border border-slate-200 bg-slate-50 p-1.5 shadow-soft"
              >
                <TabButton
                  active={activeTab === "plan"}
                  onClick={() => setActiveTab("plan")}
                  icon={<List className="h-4 w-4" />}
                  label="Imported plan"
                />
                <TabButton
                  active={activeTab === "project-insights"}
                  onClick={() => setActiveTab("project-insights")}
                  icon={<BarChart3 className="h-4 w-4" />}
                  label="Project Insights"
                />
                <TabButton
                  active={activeTab === "ai-analysis"}
                  onClick={() => setActiveTab("ai-analysis")}
                  icon={<Sparkles className="h-4 w-4" />}
                  label="AI Analysis"
                />
              </div>
            </div>

            {isAnonymous ? (
              <div className="mx-auto mt-3 flex max-w-[1200px] flex-col gap-3 rounded-2xl border border-primary/20 bg-primary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-dark">
                      Want this plan still here next time?
                    </p>
                    <p className="mt-0.5 text-sm leading-6 text-slate-600">
                      Sign in to keep your most recent plan, its insights, and AI analysis
                      ready when you return. Upgrade to Pro to keep every plan you upload.
                    </p>
                  </div>
                </div>
                <Link
                  href="/signin?redirectTo=/products/plansight-ai"
                  className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
                >
                  Sign in
                </Link>
              </div>
            ) : null}

            {isFreeSignedIn && replacedPlanTitle ? (
              <div className="mx-auto mt-3 flex max-w-[1200px] flex-col gap-3 rounded-2xl border border-secondary/30 bg-secondary/5 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-dark">
                      Replaced your previous plan: &ldquo;{replacedPlanTitle}&rdquo;
                    </p>
                    <p className="mt-0.5 text-sm leading-6 text-slate-600">
                      Free includes one plan slot, so the previous plan was deleted —
                      any share link you sent for it no longer works. Upgrade to Pro to
                      keep every plan you upload, with a full multi-plan dashboard.
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link
                    href="/upgrade"
                    className="inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-secondary/90"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Upgrade to Pro
                  </Link>
                  <button
                    type="button"
                    onClick={() => setReplacedPlanTitle(null)}
                    className="inline-flex items-center rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            ) : null}
          </section>

          {activeTab === "plan" ? (
          <PlanSightWorkspace
            plan={plan}
            metrics={metrics}
            insights={[]}
            analysis={analysis}
            share={share}
            highlightedTaskIds={selectedTaskIds}
          />
          ) : activeTab === "project-insights" ? (
            <PlanSightProjectInsightsPanel
              analysis={analysis}
              share={share}
              metrics={metrics}
              selectedTaskIds={selectedTaskIds}
              onSelectTask={(taskId) => {
                setSelectedTaskIds(new Set([taskId]));
                setActiveTab("plan");
              }}
            />
          ) : activeTab === "ai-analysis" ? (
            <PlanSightAIAnalysisPanel
              shareId={share.shareId}
              selectedTaskIds={selectedTaskIds}
              canRegenerate={userTier === "pro"}
              onSelectTasks={(taskIds) => {
                setSelectedTaskIds(new Set(taskIds));
                setActiveTab("plan");
              }}
            />
          ) : null}
        </>
      ) : (
        <section className="px-6 pb-16 pt-4">
          <div className="mx-auto max-w-[1200px] rounded-2xl border border-slate-200 bg-white p-8 shadow-soft">
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              Imported plan
            </p>
            <h2 className="mt-2 text-3xl font-semibold text-dark">
              Import a plan to continue
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              No project is loaded yet. Import an MPP plan to display the task table, Gantt chart,
              and project insights.
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Upload a Microsoft Project file
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Review the imported schedule
              </div>
              <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
                Share the plan with stakeholders
              </div>
            </div>
          </div>
        </section>
      )}
    </>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label
}: {
  active: boolean;
  onClick: () => void;
  icon: ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={
        active
          ? "inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/25"
          : "inline-flex items-center gap-2 rounded-xl bg-transparent px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-dark hover:shadow-sm"
      }
    >
      {icon}
      {label}
    </button>
  );
}
