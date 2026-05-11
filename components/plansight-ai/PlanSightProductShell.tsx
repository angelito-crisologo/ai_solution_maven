"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
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
  /** True when a Supabase auth session exists. Used to distinguish "no
   * session" (sign-up CTA) from "signed in but not activated for PlanSight"
   * (one-click activate CTA). */
  signedIn: boolean;
  /** True when the user has activated PlanSight specifically. */
  plansightActivated: boolean;
  /** Tier on the activation row when activated. null otherwise. */
  plansightTier: "free" | "pro" | null;
  /** Pre-loaded plan from a /my-plans deep-link. When set, the shell starts
   * already showing the workspace + view tabs instead of the empty-state
   * import form. */
  initialPlan?: Plan | null;
  initialShareId?: string | null;
};

export function PlanSightProductShell({
  signedIn,
  plansightActivated,
  plansightTier,
  initialPlan = null,
  initialShareId = null
}: Props) {
  const isAnonymous = !signedIn;
  const isSignedInNotActivated = signedIn && !plansightActivated;
  const isFreeActivated = plansightActivated && plansightTier !== "pro";
  const [plan, setPlan] = useState<Plan | null>(initialPlan);
  const [shareId, setShareId] = useState<string | null>(initialShareId);
  const [status, setStatus] = useState<string>(
    initialPlan
      ? `Loaded ${initialPlan.title}.`
      : "Ready to import an MPP plan."
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [activeTab, setActiveTab] = useState<"plan" | "project-insights" | "ai-analysis">("plan");
  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<number>>(new Set());
  // Tracks the title of the previous plan when a Free signed-in user replaces
  // their slot. Triggers the Pro-upsell banner. Anonymous users don't keep
  // any plan across imports, so this never fires for them.
  const [replacedPlanTitle, setReplacedPlanTitle] = useState<string | null>(null);
  // Duplicate-title prompt state. Pro users hit a 409 from /api/plansight/share
  // when a plan with the same title already exists; we cache the parsed Plan
  // so the modal Confirm can re-POST without re-uploading the .mpp.
  const [pendingDuplicate, setPendingDuplicate] = useState<{
    plan: Plan;
    fileName: string;
    existingTitle: string;
    duplicateCount: number;
  } | null>(null);
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

  /**
   * POST the parsed Plan to /api/plansight/share. Returns the new shareId on
   * success, the 409 conflict body when a Pro user already owns a plan
   * with the same title, or throws on any other failure. The caller decides
   * whether to surface a duplicate-replace prompt or treat it as a success.
   */
  async function persistPlan(
    parsedPlan: Plan,
    fileName: string,
    options: { replaceExisting?: boolean } = {}
  ): Promise<
    | { kind: "saved"; shareId: string }
    | { kind: "duplicate"; existingTitle: string; duplicateCount: number }
  > {
    const saveResponse = await fetch("/api/plansight/share", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        plan: parsedPlan,
        replaceExisting: options.replaceExisting === true
      })
    });

    const savePayload = (await saveResponse.json().catch(() => ({}))) as {
      shareId?: string;
      error?: string;
      existingTitle?: string;
      duplicates?: { shareId: string; title: string; importedAt: string }[];
    };

    if (saveResponse.status === 409 && savePayload.error === "duplicate_title") {
      return {
        kind: "duplicate",
        existingTitle: savePayload.existingTitle ?? parsedPlan.title,
        duplicateCount: savePayload.duplicates?.length ?? 1
      };
    }

    if (!saveResponse.ok || !savePayload.shareId) {
      throw new Error(
        savePayload.error || "Imported the plan, but failed to persist it to the database."
      );
    }

    const newShareId = savePayload.shareId;

    try {
      window.localStorage.setItem(
        `plansight-share:${newShareId}`,
        JSON.stringify({ plan: parsedPlan })
      );
    } catch {
      // Ignore storage failures and fall back to the database.
    }

    // Free activated users have a single-plan slot. When they import a new
    // plan, the previous one is hard-deleted server-side and we surface a
    // Pro upsell banner. Anonymous and not-activated users had no
    // persistent plan to begin with; Pro users keep all plans, so the
    // banner doesn't fire for them.
    if (isFreeActivated && plan && plan.title !== parsedPlan.title) {
      setReplacedPlanTitle(plan.title);
    } else {
      setReplacedPlanTitle(null);
    }

    setPlan(parsedPlan);
    setShareId(newShareId);
    setSelectedTaskIds(new Set());
    setStatus(`Imported ${fileName} and saved it.`);
    setActiveTab("plan");

    return { kind: "saved", shareId: newShareId };
  }

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
        throw new Error(
          "error" in payload && payload.error
            ? payload.error
            : "Failed to import the MPP file."
        );
      }

      const result = await persistPlan(payload.plan, selectedFile.name);

      if (result.kind === "duplicate") {
        setPendingDuplicate({
          plan: payload.plan,
          fileName: selectedFile.name,
          existingTitle: result.existingTitle,
          duplicateCount: result.duplicateCount
        });
        setStatus(
          `A plan named "${result.existingTitle}" already exists on your account.`
        );
      }
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to import the MPP file.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function confirmReplaceDuplicate() {
    if (!pendingDuplicate) return;
    setIsSubmitting(true);
    setStatus(`Replacing "${pendingDuplicate.existingTitle}"...`);
    try {
      const result = await persistPlan(
        pendingDuplicate.plan,
        pendingDuplicate.fileName,
        { replaceExisting: true }
      );
      if (result.kind === "duplicate") {
        // Shouldn't happen — server should accept replaceExisting=true. If
        // it does, surface as an error rather than looping the modal.
        setStatus(
          "The server still reports a duplicate. Refresh the page and try again."
        );
        return;
      }
      setPendingDuplicate(null);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Failed to replace existing plan.");
    } finally {
      setIsSubmitting(false);
    }
  }

  function cancelDuplicate() {
    setPendingDuplicate(null);
    setStatus("Import cancelled. Rename the .mpp file or remove the existing plan first.");
  }

  return (
    <>
      {pendingDuplicate ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="duplicate-plan-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-navy/70 px-4"
        >
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-modal">
            <div className="flex items-start gap-3">
              <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-700">
                <AlertTriangle className="h-5 w-5" />
              </span>
              <div className="flex-1">
                <h3 id="duplicate-plan-title" className="text-h3 text-ink">
                  Plan with that name already exists
                </h3>
                <p className="mt-2 text-body text-slate-700">
                  You already have{" "}
                  {pendingDuplicate.duplicateCount > 1
                    ? `${pendingDuplicate.duplicateCount} plans`
                    : "a plan"}{" "}
                  named{" "}
                  <span className="font-mono text-body text-ink">
                    {pendingDuplicate.existingTitle}
                  </span>
                  . Importing will replace{" "}
                  {pendingDuplicate.duplicateCount > 1 ? "them all" : "it"} with this
                  new version.
                </p>
                <p className="mt-2 text-body text-amber-800">
                  Existing share links for the previous version will stop working —
                  stakeholders will see &ldquo;This plan is no longer available for
                  viewing.&rdquo;
                </p>
              </div>
            </div>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                disabled={isSubmitting}
                onClick={cancelDuplicate}
                className="inline-flex h-10 items-center rounded-md border border-slate-200 bg-white px-4 text-body font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancel import
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={confirmReplaceDuplicate}
                className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-4 text-body font-semibold text-white transition hover:bg-cyan-800 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                {isSubmitting ? "Replacing..." : "Replace existing plan"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="px-6 py-10">
        <div className="mx-auto max-w-[1200px] rounded-xl border border-slate-200 bg-white p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-micro text-cyan-700">Import plan</p>
              <h2 className="mt-2 text-h2 text-ink">
                Upload a Microsoft Project file
              </h2>
              <p className="mt-2 max-w-2xl text-body text-slate-700">
                <span className="font-mono text-body">.mpp</span> files only. The file is
                parsed into the PlanSight schema, then rendered as an analyzed plan with a
                stakeholder share view.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 lg:min-w-[420px]">
              <input
                type="file"
                accept=".mpp"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                className="block w-full rounded-md border border-slate-200 bg-slate-50 px-4 py-3 text-body text-slate-700 file:mr-4 file:rounded-md file:border-0 file:bg-navy file:px-4 file:py-2 file:text-body file:font-semibold file:text-slate-100"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 text-body font-semibold text-white transition hover:bg-cyan-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isSubmitting ? "Importing..." : "Import plan"}
              </button>
            </form>
          </div>

          <p className="mt-4 text-caption text-slate-500">{status}</p>
          <div className="mt-4 rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-body text-slate-700">
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
              className="font-semibold text-cyan-700 transition hover:text-cyan-800"
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
              <div className="flex items-center gap-2 text-body">
                <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-emerald-800">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="font-semibold text-ink">Plan loaded</span>
                <span className="text-slate-500">— pick a view</span>
              </div>

              <div
                role="tablist"
                aria-label="Plan views"
                className="inline-flex flex-wrap items-center gap-1 rounded-md border border-slate-200 bg-slate-50 p-1"
              >
                <TabButton
                  active={activeTab === "plan"}
                  onClick={() => setActiveTab("plan")}
                  icon={<List className="h-4 w-4" />}
                  label="Plan"
                />
                <TabButton
                  active={activeTab === "project-insights"}
                  onClick={() => setActiveTab("project-insights")}
                  icon={<BarChart3 className="h-4 w-4" />}
                  label="Insights"
                />
                <TabButton
                  active={activeTab === "ai-analysis"}
                  onClick={() => setActiveTab("ai-analysis")}
                  icon={<Sparkles className="h-4 w-4" />}
                  label="AI analysis"
                />
              </div>
            </div>

            {isAnonymous ? (
              <div className="mx-auto mt-3 flex max-w-[1200px] flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
                    <KeyRound className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-h3 text-ink">
                      Want this plan still here next time?
                    </p>
                    <p className="mt-1 text-body text-slate-700">
                      Sign up for PlanSight to keep your most recent plan, its insights,
                      and AI analysis ready when you return. Upgrade to Pro to keep every
                      plan you upload.
                    </p>
                  </div>
                </div>
                <Link
                  href="/signin?product=plansight-ai&redirectTo=/products/plansight-ai"
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md bg-cyan-700 px-4 text-body font-semibold text-white transition hover:bg-cyan-800"
                >
                  Sign up for PlanSight
                </Link>
              </div>
            ) : null}

            {isSignedInNotActivated ? (
              <div className="mx-auto mt-3 flex max-w-[1200px] flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-h3 text-ink">
                      You&apos;re already signed in. Activate PlanSight in one click.
                    </p>
                    <p className="mt-1 text-body text-slate-700">
                      Adds PlanSight to your account so this plan, its insights, and AI
                      analysis stay accessible when you return.
                    </p>
                  </div>
                </div>
                <ActivatePlanSightInlineButton />
              </div>
            ) : null}

            {isFreeActivated && replacedPlanTitle ? (
              <div className="mx-auto mt-3 flex max-w-[1200px] flex-col gap-3 rounded-md border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-h3 text-ink">
                      Replaced your previous plan: &ldquo;{replacedPlanTitle}&rdquo;
                    </p>
                    <p className="mt-1 text-body text-slate-700">
                      Free includes one plan slot, so the previous plan was deleted —
                      any share link you sent for it no longer works. Upgrade to Pro to
                      keep every plan you upload, with a full multi-plan dashboard.
                    </p>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Link
                    href="/upgrade"
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-4 text-body font-semibold text-white transition hover:bg-cyan-800"
                  >
                    Upgrade to Pro
                  </Link>
                  <button
                    type="button"
                    onClick={() => setReplacedPlanTitle(null)}
                    className="inline-flex h-10 items-center rounded-md border border-slate-200 bg-white px-3 text-body font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
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
            canExplainTask={plansightTier === "pro"}
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
              canRegenerate={plansightTier === "pro"}
              onSelectTasks={(taskIds) => {
                setSelectedTaskIds(new Set(taskIds));
                setActiveTab("plan");
              }}
            />
          ) : null}
        </>
      ) : (
        <section className="px-6 pb-16 pt-4">
          <div className="mx-auto max-w-[1200px] rounded-xl border border-slate-200 bg-white p-8">
            <p className="text-micro text-cyan-700">Imported plan</p>
            <h2 className="mt-2 text-h1 text-ink">
              Import a plan to continue
            </h2>
            <p className="mt-4 max-w-2xl text-body-lg text-slate-700">
              No project is loaded yet. Import an .mpp plan to display the task table,
              Gantt chart, and project insights.
            </p>
            <div className="mt-6 grid gap-3 md:grid-cols-3">
              <div className="rounded-md bg-slate-50 p-4 text-body text-slate-700">
                Upload a Microsoft Project file.
              </div>
              <div className="rounded-md bg-slate-50 p-4 text-body text-slate-700">
                Review the imported schedule.
              </div>
              <div className="rounded-md bg-slate-50 p-4 text-body text-slate-700">
                Share the plan with stakeholders.
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
          ? "inline-flex h-9 items-center gap-2 rounded-md bg-white px-3 text-body font-semibold text-ink shadow-card"
          : "inline-flex h-9 items-center gap-2 rounded-md bg-transparent px-3 text-body font-semibold text-slate-600 transition hover:text-ink"
      }
    >
      {icon}
      {label}
    </button>
  );
}

function ActivatePlanSightInlineButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/plansight/activate", { method: "POST" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Could not activate PlanSight.");
      }
      window.location.reload();
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Could not activate PlanSight.");
    }
  };

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-4 text-body font-semibold text-white transition hover:bg-cyan-800 disabled:opacity-60"
      >
        <Sparkles className="h-3.5 w-3.5" />
        {busy ? "Activating..." : "Activate PlanSight"}
      </button>
      {error ? <span className="text-caption text-red-700">{error}</span> : null}
    </div>
  );
}
