"use client";

import { Check, Minus, X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { track } from "@/lib/analytics/gtag";

type TierKey = "anonymous" | "free" | "pro";

type FeatureRow = {
  kind: "feature";
  key: string;
  label: string;
  cells: Record<TierKey, ReactNode>;
  muted?: boolean;
  detail: {
    eyebrow: string;
    lede: string;
    perTier: Record<TierKey, string>;
  };
};

type DividerRow = {
  kind: "divider";
  key: string;
  label: string;
  proLabel: string;
};

type RowItem = FeatureRow | DividerRow;

const TIER_LABELS: Record<TierKey, string> = {
  anonymous: "No signup",
  free: "Free",
  pro: "Pro"
};

const ROWS: RowItem[] = [
  {
    kind: "feature",
    key: "upload",
    label: "Upload plan file",
    cells: { anonymous: <Tick />, free: <Tick />, pro: <Tick /> },
    detail: {
      eyebrow: "Input",
      lede: "PlanSight accepts MS Project .mpp files and MS Project XML exports (File → Save As → XML Format). Both are parsed into a structured plan you can view, analyse, and share. Drag-and-drop or click to upload.",
      perTier: {
        anonymous: "Upload without signing in. Plan and share link persist for 24 hours.",
        free: "Upload after signing in. Your most recent plan stays in your account.",
        pro: "Upload as many plans as you need. Every plan is kept."
      }
    }
  },
  {
    kind: "feature",
    key: "insights-engine",
    label: "Insights engine",
    cells: { anonymous: <Tick />, free: <Tick />, pro: <Tick /> },
    detail: {
      eyebrow: "Analysis",
      lede: "Critical path, late tasks, tasks at risk, lagging tasks, per-task status, and summary counts — all computed per PMBOK conventions. No AI involved.",
      perTier: {
        anonymous: "Full insights on every upload, no sign-in required.",
        free: "Same engine. Available on your saved plan.",
        pro: "Same engine. Available across every plan in the My Plans dashboard."
      }
    }
  },
  {
    kind: "feature",
    key: "excel-export",
    label: "Export as Excel",
    cells: { anonymous: <Tick />, free: <Tick />, pro: <Tick /> },
    detail: {
      eyebrow: "Export",
      lede: "Download the imported task list as an .xlsx workbook with the columns stakeholders expect: ID, task, dates, % complete, resource, notes.",
      perTier: {
        anonymous: "Export the current plan.",
        free: "Export your saved plan any time.",
        pro: "Export any plan from the dashboard."
      }
    }
  },
  {
    kind: "feature",
    key: "ai-analysis",
    label: "AI analysis",
    cells: {
      anonymous: "First analysis free",
      free: "First analysis free",
      pro: <span className="font-semibold text-cyan-700">Included</span>
    },
    detail: {
      eyebrow: "Analysis",
      lede: "Claude reads your plan and writes a plain-language narrative plus prescriptive next-step recommendations tied to specific task IDs.",
      perTier: {
        anonymous: "One generation per plan, cached. Re-uploading the same plan reuses the cached run.",
        free: "Same one generation, kept in your account so you don't burn a new run after sign-in.",
        pro: "Regenerate any time the plan changes. Keeps the AI summary in sync as the schedule moves."
      }
    }
  },
  {
    kind: "feature",
    key: "share-link",
    label: "Public share link",
    cells: {
      anonymous: "24 hours",
      free: "Never expires",
      pro: <span className="font-semibold text-cyan-700">Never expires</span>
    },
    detail: {
      eyebrow: "Communication",
      lede: "A read-only URL that lets a stakeholder view the plan, insights, and AI analysis without an account or MS Project install.",
      perTier: {
        anonymous: "Link works for 24 hours. After that, the plan and the link both disappear — the workspace shows a reminder so you can sign up to keep them before they expire.",
        free: "Link never expires. Send it once and it keeps working — even months later.",
        pro: "Never-expiring links across all your saved plans."
      }
    }
  },
  {
    kind: "feature",
    key: "revoke-share",
    label: "Revoke share link",
    cells: { anonymous: <Dash />, free: <Tick />, pro: <Tick /> },
    detail: {
      eyebrow: "Communication",
      lede: "Turn off a shared link without deleting the plan. Anyone opening the link sees a generic “no longer available” page. Restore later to re-enable.",
      perTier: {
        anonymous: "Not available — anonymous links auto-expire after 24 hours.",
        free: "Revoke and restore the share link on your saved plan.",
        pro: "Revoke and restore on every plan in the dashboard."
      }
    }
  },
  {
    kind: "feature",
    key: "plans-saved",
    label: "Plans saved",
    cells: {
      anonymous: <span className="text-slate-500">Auto-delete after 24 hours</span>,
      free: (
        <span>
          <span className="font-semibold text-slate-900">1</span> plan
        </span>
      ),
      pro: <span className="font-semibold text-cyan-700">Unlimited</span>
    },
    detail: {
      eyebrow: "Storage",
      lede: "How many plans your account holds. This is the main reason most PMs sign up for Free, and the main reason they upgrade to Pro.",
      perTier: {
        anonymous: "Nothing saved to an account. The plan exists for 24 hours alongside its share link, then both are deleted.",
        free: "One saved plan. Uploading a new file replaces it.",
        pro: "Every plan you upload stays. Switch between them freely from the My Plans dashboard."
      }
    }
  },
  {
    kind: "divider",
    key: "div-ai",
    label: "PRO · AI ON DEMAND",
    proLabel: "INCLUDED"
  },
  {
    kind: "feature",
    key: "regenerate-ai",
    label: "Regenerate AI analysis",
    cells: { anonymous: <Dash />, free: <Dash />, pro: <Tick /> },
    detail: {
      eyebrow: "Analysis",
      lede: "Re-run the Claude analysis on demand whenever the plan changes. Free tiers see only the cached first generation.",
      perTier: {
        anonymous: "Not available — only the first analysis is included.",
        free: "Not available — only the first analysis is included.",
        pro: "Regenerate any time. Each regen produces an updated narrative, risks, and recommendations."
      }
    }
  },
  {
    kind: "feature",
    key: "weekly-report",
    label: "Weekly status report",
    cells: { anonymous: <Dash />, free: <Dash />, pro: <Tick /> },
    detail: {
      eyebrow: "Communication",
      lede: "One click generates a one-page PDF covering the last completed week: RAG, what slipped, what's at risk, milestones hit, milestones coming.",
      perTier: {
        anonymous: "Not available.",
        free: "Not available.",
        pro: "One click on any saved plan. Configurable week-start day (Mon/Sun)."
      }
    }
  },
  {
    kind: "feature",
    key: "explain-task",
    label: "Explain this task",
    cells: { anonymous: <Dash />, free: <Dash />, pro: <Tick /> },
    detail: {
      eyebrow: "Analysis",
      lede: "Click any task in the workspace and Claude explains it in plain language using its dependency neighbourhood — why it matters, what depends on it, where the risk sits.",
      perTier: {
        anonymous: "Not available.",
        free: "Not available.",
        pro: "Available on every task. Cached per (plan, task) so re-clicks are free."
      }
    }
  },
  {
    kind: "divider",
    key: "div-workflow",
    label: "PRO · WORKFLOW",
    proLabel: "INCLUDED"
  },
  {
    kind: "feature",
    key: "my-plans",
    label: "My Plans dashboard",
    cells: { anonymous: <Dash />, free: <Dash />, pro: <Tick /> },
    detail: {
      eyebrow: "Workspace",
      lede: "A single home screen that lists every plan you've uploaded, with quick links into the workspace, insights, and AI analysis for each.",
      perTier: {
        anonymous: "Not available — no account to attach plans to.",
        free: "Not available — Free only keeps your most recent plan, auto-loaded in the workspace.",
        pro: "Full multi-plan dashboard. Rename, archive, and switch between any of your plans from one place."
      }
    }
  },
  {
    kind: "feature",
    key: "pdf-export",
    label: "Export as PDF",
    cells: { anonymous: <Dash />, free: <Dash />, pro: <Tick /> },
    detail: {
      eyebrow: "Export",
      lede: "Landscape PDF of the workspace view — outline-indented like MS Project. Stakeholders forward PDFs; they don't forward links.",
      perTier: {
        anonymous: "Not available.",
        free: "Not available.",
        pro: "Available on every saved plan. Landscape A4 with task ID, name, dates, % complete, resource, notes."
      }
    }
  },
  {
    kind: "feature",
    key: "share-password",
    label: "Password-protected share links",
    cells: { anonymous: <Dash />, free: <Dash />, pro: <Tick /> },
    detail: {
      eyebrow: "Security",
      lede: "Set a password on a share link so only stakeholders you give it to can open the plan. Change or clear the password at any time — sessions invalidate automatically on every change.",
      perTier: {
        anonymous: "Not available.",
        free: "Not available.",
        pro: "Set, change, or clear a password per plan. Failed attempts are rate-limited per visitor IP."
      }
    }
  },
  {
    kind: "feature",
    key: "file-size",
    label: "File size limit",
    muted: true,
    cells: { anonymous: "5 MB", free: "5 MB", pro: "25 MB" },
    detail: {
      eyebrow: "Limits",
      lede: "How large an MS Project file PlanSight will parse and render. Most plans are well under 5 MB; the 25 MB Pro cap covers enterprise programs and consolidated portfolios.",
      perTier: {
        anonymous: "5 MB per file, ~5,000 tasks.",
        free: "5 MB per file, ~5,000 tasks.",
        pro: "25 MB per file, up to 25,000 tasks."
      }
    }
  }
];

export function PlanSightPricingSection() {
  const [openFeatureKey, setOpenFeatureKey] = useState<string | null>(null);
  const [mobileOpenTier, setMobileOpenTier] = useState<TierKey>("pro");

  const openFeature =
    ROWS.find(
      (r): r is FeatureRow => r.kind === "feature" && r.key === openFeatureKey
    ) ?? null;

  useEffect(() => {
    if (!openFeature) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenFeatureKey(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openFeature]);

  const onTryFreeClick = useCallback((event: React.MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    const target = document.getElementById("plansight-workspace");
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "start" });
    const focusable = target.querySelector<HTMLElement>(
      "input,button,[tabindex]:not([tabindex='-1'])"
    );
    focusable?.focus({ preventScroll: true });
  }, []);

  return (
    <section className="px-6 py-20">
      <div className="mx-auto max-w-[1200px]">
        <header className="mb-10 max-w-3xl">
          <p className="text-micro uppercase tracking-wider text-cyan-700">
            ANALYSIS
          </p>
          <h2 className="mt-3 text-h1 text-ink">
            Free for the first AI analysis. Pro for daily use.
          </h2>
          <p className="mt-4 text-body-lg text-slate-700">
            Upload any MS Project .mpp file or XML export (File → Save As → XML
            Format in MS Project) and PlanSight computes critical path, late
            tasks, at-risk tasks, and overall project health — free, no signup.
            Every plan you upload gets one free Claude-generated analysis.
          </p>
        </header>

        <p className="mb-6 flex items-center gap-2 text-body font-semibold text-cyan-700">
          <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-cyan-600" />
          Pro is live today — re-run AI whenever the plan changes, generate
          weekly status reports, and get inline &ldquo;Explain this
          task&rdquo; AI on any task.
        </p>

        <DesktopTable
          onRowClick={setOpenFeatureKey}
          onTryFree={onTryFreeClick}
        />

        <MobileAccordion
          onRowClick={setOpenFeatureKey}
          openTier={mobileOpenTier}
          onOpenTierChange={setMobileOpenTier}
          onTryFree={onTryFreeClick}
        />

        <p className="mt-6 text-body text-slate-500">
          Free fits one project. Pro fits your portfolio.
        </p>
      </div>

      {openFeature ? (
        <FeatureDialog
          feature={openFeature}
          onClose={() => setOpenFeatureKey(null)}
        />
      ) : null}
    </section>
  );
}

function Tick() {
  return (
    <span aria-label="Included" className="inline-flex">
      <Check className="h-4 w-4 text-cyan-700" strokeWidth={2.5} />
    </span>
  );
}

function Dash() {
  return (
    <span aria-label="Not available" className="inline-flex text-slate-300">
      —
    </span>
  );
}

/* ---------------- Desktop ---------------- */

function DesktopTable({
  onRowClick,
  onTryFree
}: {
  onRowClick: (key: string) => void;
  onTryFree: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  // 4-column grid: feature label · anonymous · free · pro
  const gridCols = "grid grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)_minmax(0,1fr)_minmax(0,1.2fr)]";

  return (
    <div className="hidden md:block">
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        {/* Header */}
        <div className={`${gridCols}`}>
          <div className="border-b border-slate-200 px-6 pb-6 pt-7" />
          <TierHeaderCell tier="anonymous" />
          <TierHeaderCell tier="free" />
          <ProHeaderCell />
        </div>

        {/* Rows */}
        <ul>
          {ROWS.map((row) =>
            row.kind === "feature" ? (
              <FeatureRowDesktop
                key={row.key}
                row={row}
                gridCols={gridCols}
                onRowClick={onRowClick}
              />
            ) : (
              <DividerRowDesktop
                key={row.key}
                row={row}
                gridCols={gridCols}
              />
            )
          )}
        </ul>

        {/* Footer */}
        <div className={`${gridCols} border-t border-slate-200`}>
          <div className="flex items-center px-6 py-5 text-caption text-slate-500">
            Click any row for details.
          </div>
          <div className="flex items-center justify-center px-4 py-5">
            <a
              href="#plansight-workspace"
              onClick={onTryFree}
              className="inline-flex h-10 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-4 text-caption font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
            >
              Try free →
            </a>
          </div>
          <div className="flex items-center justify-center px-4 py-5">
            <Link
              href="/signup?redirectTo=/products/plansight-ai"
              className="inline-flex h-10 items-center justify-center gap-1 rounded-md border border-slate-200 bg-white px-4 text-caption font-semibold text-slate-700 transition-colors hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
            >
              Sign up free →
            </Link>
          </div>
          <div className="flex items-center justify-center bg-cyan-50/70 px-4 py-5">
            <Link
              href="/upgrade"
              onClick={() => track("upgrade_clicked", { source: "pricing_table_desktop" })}
              className="inline-flex h-10 items-center justify-center gap-1 rounded-md bg-cyan-700 px-4 text-caption font-semibold text-white transition-colors hover:bg-cyan-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
            >
              Upgrade · $19/mo
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

function TierHeaderCell({ tier }: { tier: "anonymous" | "free" }) {
  const sub = tier === "anonymous" ? "try it" : "with signup";
  return (
    <div className="border-b border-slate-200 px-4 pb-6 pt-7 text-center">
      <p className="text-micro uppercase tracking-wider text-slate-500">
        {TIER_LABELS[tier].toUpperCase()}
      </p>
      <p className="mt-1 text-caption text-slate-500">{sub}</p>
      <p className="mt-3 text-h3 font-semibold text-ink">Free</p>
    </div>
  );
}

function ProHeaderCell() {
  return (
    <div className="border-b border-cyan-200 bg-cyan-50/70 px-4 pb-6 pt-7 text-center">
      <p className="text-micro uppercase tracking-wider text-cyan-700">PRO</p>
      <p className="mt-1 text-caption text-cyan-700/80">AI on demand</p>
      <p className="mt-3 text-ink">
        <span className="text-h2 font-semibold">$19</span>
        <span className="text-caption text-slate-500">/mo</span>
      </p>
      <p className="mt-1 text-caption text-slate-500">
        or $190/yr · <span className="text-cyan-700">save 17%</span>
      </p>
    </div>
  );
}

function FeatureRowDesktop({
  row,
  gridCols,
  onRowClick
}: {
  row: FeatureRow;
  gridCols: string;
  onRowClick: (key: string) => void;
}) {
  // We render each cell separately so the Pro column can keep its cyan-50
  // background even when the row hover state is on the other three cells.
  // The whole row is wrapped in a single <button> so a click anywhere fires.
  const labelText = row.muted ? "text-slate-500" : "text-slate-900";
  const valueText = row.muted ? "text-slate-500" : "text-slate-800";

  return (
    <li>
      <button
        type="button"
        onClick={() => onRowClick(row.key)}
        className={`${gridCols} group w-full border-t border-slate-100 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400`}
        aria-label={`${row.label} — open detail`}
      >
        <span
          className={`flex items-center gap-2 px-6 py-4 text-body font-medium ${labelText} group-hover:bg-slate-50/80`}
        >
          <span className="truncate">{row.label}</span>
          <span
            aria-hidden
            className="text-caption text-slate-300 opacity-0 transition-opacity group-hover:opacity-100"
          >
            →
          </span>
        </span>
        <span
          className={`flex items-center justify-center px-4 py-4 text-body ${valueText} group-hover:bg-slate-50/80`}
        >
          {row.cells.anonymous}
        </span>
        <span
          className={`flex items-center justify-center px-4 py-4 text-body ${valueText} group-hover:bg-slate-50/80`}
        >
          {row.cells.free}
        </span>
        <span
          className={`flex items-center justify-center bg-cyan-50/70 px-4 py-4 text-body ${
            row.muted ? "text-slate-500" : "text-slate-900"
          } group-hover:bg-cyan-50`}
        >
          {row.cells.pro}
        </span>
      </button>
    </li>
  );
}

function DividerRowDesktop({
  row,
  gridCols
}: {
  row: DividerRow;
  gridCols: string;
}) {
  return (
    <li
      className={`${gridCols} border-t border-slate-200`}
      aria-hidden={false}
    >
      <div className="col-span-3 bg-slate-50 px-6 py-2.5">
        <p className="text-micro uppercase tracking-wider text-slate-600">
          {row.label}
        </p>
      </div>
      <div className="bg-cyan-100/60 px-4 py-2.5 text-center">
        <p className="text-micro uppercase tracking-wider text-cyan-700">
          {row.proLabel}
        </p>
      </div>
    </li>
  );
}

/* ---------------- Mobile accordion ---------------- */

function MobileAccordion({
  onRowClick,
  openTier,
  onOpenTierChange,
  onTryFree
}: {
  onRowClick: (key: string) => void;
  openTier: TierKey;
  onOpenTierChange: (t: TierKey) => void;
  onTryFree: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const tiers: TierKey[] = ["anonymous", "free", "pro"];
  return (
    <div className="md:hidden space-y-3">
      {tiers.map((tier) => (
        <TierAccordionCard
          key={tier}
          tier={tier}
          open={openTier === tier}
          onOpenChange={() => onOpenTierChange(tier)}
          onRowClick={onRowClick}
          onTryFree={onTryFree}
        />
      ))}
    </div>
  );
}

function TierAccordionCard({
  tier,
  open,
  onOpenChange,
  onRowClick,
  onTryFree
}: {
  tier: TierKey;
  open: boolean;
  onOpenChange: () => void;
  onRowClick: (key: string) => void;
  onTryFree: (e: React.MouseEvent<HTMLAnchorElement>) => void;
}) {
  const isPro = tier === "pro";
  const containerCls = isPro
    ? "rounded-xl border-2 border-cyan-600 bg-cyan-50/70 shadow-[0_2px_8px_rgba(8,145,178,0.10)]"
    : "rounded-xl border border-slate-200 bg-white";

  const summary =
    tier === "anonymous"
      ? "try it"
      : tier === "free"
      ? "with signup"
      : "AI on demand";

  return (
    <section className={containerCls}>
      <button
        type="button"
        onClick={onOpenChange}
        aria-expanded={open}
        className="flex w-full items-start justify-between gap-3 px-5 py-4 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-cyan-400"
      >
        <div>
          <p
            className={`text-micro uppercase tracking-wider ${
              isPro ? "text-cyan-700" : "text-slate-500"
            }`}
          >
            {TIER_LABELS[tier].toUpperCase()}
          </p>
          <p className="mt-1 text-caption text-slate-600">{summary}</p>
        </div>
        <div className="text-right">
          {isPro ? (
            <>
              <p className="text-ink">
                <span className="text-h3 font-semibold">$19</span>
                <span className="text-caption text-slate-500">/mo</span>
              </p>
              <p className="text-caption text-slate-500">
                or $190/yr · <span className="text-cyan-700">save 17%</span>
              </p>
            </>
          ) : (
            <p className="text-h3 font-semibold text-ink">Free</p>
          )}
        </div>
      </button>

      {open ? (
        <div className="border-t border-slate-200/70 px-5 py-4">
          <ul className="divide-y divide-slate-200/70">
            {ROWS.map((row) => {
              if (row.kind === "divider") {
                return (
                  <li
                    key={row.key}
                    className="flex items-center justify-between gap-3 py-2"
                  >
                    <p className="text-micro uppercase tracking-wider text-slate-600">
                      {row.label}
                    </p>
                    {tier === "pro" ? (
                      <p className="text-micro uppercase tracking-wider text-cyan-700">
                        {row.proLabel}
                      </p>
                    ) : null}
                  </li>
                );
              }
              const muted = row.muted ? "text-slate-500" : "text-slate-900";
              return (
                <li key={row.key}>
                  <button
                    type="button"
                    onClick={() => onRowClick(row.key)}
                    className="flex w-full items-center justify-between gap-3 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  >
                    <span className={`min-w-0 text-body ${muted}`}>
                      {row.label}
                    </span>
                    <span
                      className={`shrink-0 text-body font-medium ${
                        row.muted ? "text-slate-500" : "text-slate-700"
                      }`}
                    >
                      {row.cells[tier]}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-5">
            {tier === "anonymous" ? (
              <a
                href="#plansight-workspace"
                onClick={onTryFree}
                className="inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-body font-semibold text-slate-700 hover:border-slate-300"
              >
                Try free →
              </a>
            ) : tier === "free" ? (
              <Link
                href="/signup?redirectTo=/products/plansight-ai"
                className="inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-body font-semibold text-slate-700 hover:border-slate-300"
              >
                Sign up free →
              </Link>
            ) : (
              <Link
                href="/upgrade"
                onClick={() => track("upgrade_clicked", { source: "pricing_accordion_mobile" })}
                className="inline-flex h-10 w-full items-center justify-center gap-1 rounded-md bg-cyan-700 px-4 text-body font-semibold text-white hover:bg-cyan-800"
              >
                Upgrade · $19/mo
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </section>
  );
}

/* ---------------- Dialog ---------------- */

function FeatureDialog({
  feature,
  onClose
}: {
  feature: FeatureRow;
  onClose: () => void;
}) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={`feature-${feature.key}-title`}
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-navy/70 px-4 py-6 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="my-auto w-full max-w-xl rounded-xl border border-slate-200 bg-white p-6 text-slate-900 shadow-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-micro uppercase tracking-wider text-cyan-700">
              {feature.detail.eyebrow}
            </p>
            <h3
              id={`feature-${feature.key}-title`}
              className="mt-2 text-h2 text-ink"
            >
              {feature.label}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close detail"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-body text-slate-700">{feature.detail.lede}</p>

        <dl className="mt-6 space-y-4">
          <TierDetailRow
            label="No signup · try it"
            value={feature.detail.perTier.anonymous}
            accent={false}
          />
          <TierDetailRow
            label="Free · with signup"
            value={feature.detail.perTier.free}
            accent={false}
          />
          <TierDetailRow
            label="Pro · AI on demand"
            value={feature.detail.perTier.pro}
            accent
          />
        </dl>

        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 items-center justify-center rounded-md border border-slate-200 bg-white px-4 text-body font-semibold text-slate-700 hover:border-slate-300"
          >
            Close
          </button>
          <Link
            href="/upgrade"
            onClick={() => track("upgrade_clicked", { source: "feature_dialog" })}
            className="inline-flex h-10 items-center justify-center rounded-md bg-cyan-700 px-4 text-body font-semibold text-white hover:bg-cyan-800"
          >
            Upgrade to Pro
          </Link>
        </div>
      </div>
    </div>
  );
}

function TierDetailRow({
  label,
  value,
  accent
}: {
  label: string;
  value: string;
  accent: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "rounded-lg border-2 border-cyan-600 bg-cyan-50/60 p-4"
          : "rounded-lg border border-slate-200 p-4"
      }
    >
      <dt
        className={`text-micro uppercase tracking-wider ${
          accent ? "text-cyan-700" : "text-slate-500"
        }`}
      >
        {label}
      </dt>
      <dd className="mt-1 text-body text-slate-800">{value}</dd>
    </div>
  );
}
