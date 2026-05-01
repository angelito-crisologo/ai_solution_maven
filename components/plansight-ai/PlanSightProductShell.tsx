"use client";

import type { FormEvent, ReactNode } from "react";
import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { BarChart3, Loader2, List, Upload } from "lucide-react";
import { buildInsightsReport, summarizePlan } from "@/lib/plansight-ai/analysis";
import { getOrCreateGuestId } from "@/lib/plansight-ai/guest";
import { createSharePayload } from "@/lib/plansight-ai/share";
import type { Plan } from "@/lib/plansight-ai/types";
import { PlanSightWorkspace } from "./PlanSightWorkspace";
import { PlanSightProjectInsightsPanel } from "./PlanSightProjectInsightsPanel";

export function PlanSightProductShell() {
  const [plan, setPlan] = useState<Plan | null>(null);
  const [status, setStatus] = useState<string>("Ready to import an MPP plan.");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<"plan" | "project-insights">("plan");
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  const importedPlanTabsRef = useRef<HTMLElement | null>(null);

  const metrics = useMemo(() => (plan ? summarizePlan(plan) : null), [plan]);
  const analysis = useMemo(() => (plan ? buildInsightsReport(plan) : null), [plan]);
  const share = useMemo(() => (plan ? createSharePayload(plan) : null), [plan]);

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

      const guestId = getOrCreateGuestId();
      const sharePayload = createSharePayload(payload.plan);
      const saveResponse = await fetch("/api/plansight/share", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          shareId: sharePayload.shareId,
          plan: payload.plan,
          guestId
        })
      });

      const savePayload = (await saveResponse.json().catch(() => ({}))) as { error?: string };

      if (!saveResponse.ok) {
        throw new Error(savePayload.error || "Imported the plan, but failed to persist it to the database.");
      }

      try {
        window.localStorage.setItem(`plansight-share:${sharePayload.shareId}`, JSON.stringify({ plan: payload.plan }));
      } catch {
        // Ignore storage failures and fall back to the database.
      }

      setPlan(payload.plan);
      setSelectedTaskIds(new Set());
      setStatus(`Imported ${selectedFile.name} and saved it.`);
      setActiveTab("plan");
      window.setTimeout(() => {
        importedPlanTabsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 0);
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
          <section ref={importedPlanTabsRef} className="px-6 pb-2">
            <div className="mx-auto flex max-w-[1200px] gap-2">
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
            </div>
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
      onClick={onClick}
      className={`inline-flex items-center gap-2 rounded-t-2xl border border-b-0 px-4 py-3 text-sm font-medium transition ${
        active
          ? "border-slate-200 bg-white text-dark shadow-soft"
          : "border-transparent bg-slate-100 text-slate-500 hover:bg-slate-200"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
