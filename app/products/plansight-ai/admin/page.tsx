import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquareText } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import {
  getAiCostByFeature,
  getAiCostStats,
  getDailyCost,
  getDailyShareViews,
  getDailyUploads,
  getEngagementStats,
  getFailureBreakdown,
  getFunnelCounts,
  getParseTimeScatter,
  getPipelineHealth,
  getTopSpenders,
  getTopViewedShares,
  WINDOW_DAYS_HEALTH,
  WINDOW_DAYS_TRENDS
} from "./queries";
import { SectionCard } from "./components/SectionCard";
import {
  StatRow,
  formatBytes,
  formatInt,
  formatMs,
  formatPct,
  formatUsd
} from "./components/StatRow";
import {
  CategoryBarChart,
  DailyLineChart,
  FileSizeScatter
} from "./components/AdminCharts";
import { ADMIN_CHART_COLORS } from "./chart-constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Admin",
  description: "PlanSight operational metrics.",
  robots: { index: false, follow: false }
};

export default async function AdminPage() {
  const user = await getCurrentUser();
  const adminId = process.env.ADMIN_USER_ID;

  // Single gate. No 403 / no acknowledgment — the page acts like it
  // doesn't exist for anyone else. ADMIN_USER_ID must be set in the
  // server env; without it, the page bounces everyone (including the
  // intended admin), which is the safer default.
  if (!user || !adminId || user.id !== adminId) {
    redirect("/");
  }

  // Run all section queries in parallel — they're all read-only, none
  // depend on each other. Total round-trip is bounded by the slowest.
  const [
    pipelineHealth,
    failureBreakdown,
    parseScatter,
    dailyUploads,
    aiCostStats,
    aiCostByFeature,
    dailyCost,
    topSpenders,
    funnelCounts,
    engagementStats,
    dailyShareViews,
    topViewedShares
  ] = await Promise.all([
    getPipelineHealth(),
    getFailureBreakdown(),
    getParseTimeScatter(),
    getDailyUploads(),
    getAiCostStats(),
    getAiCostByFeature(),
    getDailyCost(),
    getTopSpenders(),
    getFunnelCounts(),
    getEngagementStats(),
    getDailyShareViews(),
    getTopViewedShares()
  ]);

  return (
    <main className="min-h-screen bg-light px-6 py-10">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-6">
        <header className="rounded-xl border border-slate-200 bg-white p-6">
          <p className="text-micro text-cyan-700">PlanSight AI · Operations</p>
          <h1 className="mt-2 text-h1 text-ink">Admin</h1>
          <p className="mt-2 text-body text-slate-600">
            Signed in as <span className="font-semibold">{user.email}</span>.
            All queries run server-side with the service-role key; no data
            reaches the client beyond what these charts render.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              href="/products/plansight-ai/admin/feedback"
              className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-caption font-semibold text-slate-700 transition hover:border-cyan-300 hover:text-cyan-700"
            >
              <MessageSquareText className="h-3.5 w-3.5" />
              Feedback
            </Link>
          </div>
        </header>

        {/* ============ Section 1 — Pipeline health ============ */}
        <SectionCard
          title="Pipeline health"
          description="Is the .mpp parser stable? Where do uploads fail?"
          window={`Last ${WINDOW_DAYS_HEALTH} days`}
        >
          <StatRow
            stats={[
              {
                label: "Uploads",
                value: formatInt(pipelineHealth.totalUploads)
              },
              {
                label: "Success rate",
                value: formatPct(pipelineHealth.successPct, 1)
              },
              {
                label: "P95 parse",
                value: formatMs(pipelineHealth.p95ParseMs),
                hint: `P50 ${formatMs(pipelineHealth.p50ParseMs)}`
              },
              {
                label: "Likely cold starts",
                value: formatPct(pipelineHealth.coldStartPct, 1),
                hint: ">8s parser duration"
              }
            ]}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-caption font-medium uppercase tracking-wider text-slate-500">
                Failures by stage
              </p>
              {failureBreakdown.length === 0 ? (
                <EmptyState message="No failures in this window." />
              ) : (
                <CategoryBarChart
                  data={failureBreakdown.map((b) => ({ stage: b.stage, count: b.count }))}
                  xKey="stage"
                  yKey="count"
                  color={ADMIN_CHART_COLORS.danger}
                  ariaLabel="Failures by stage"
                />
              )}
            </div>
            <div>
              <p className="mb-2 text-caption font-medium uppercase tracking-wider text-slate-500">
                Daily uploads (last {WINDOW_DAYS_TRENDS} days)
              </p>
              {dailyUploads.every((d) => d.successes === 0 && d.failures === 0) ? (
                <EmptyState message="No uploads yet." />
              ) : (
                <DailyLineChart
                  data={dailyUploads}
                  series={[
                    {
                      dataKey: "successes",
                      label: "Successes",
                      color: ADMIN_CHART_COLORS.primary
                    },
                    {
                      dataKey: "failures",
                      label: "Failures",
                      color: ADMIN_CHART_COLORS.danger
                    }
                  ]}
                  ariaLabel="Daily uploads"
                />
              )}
            </div>
          </div>

          <div>
            <p className="mb-2 text-caption font-medium uppercase tracking-wider text-slate-500">
              Parse time vs file size
            </p>
            {parseScatter.length === 0 ? (
              <EmptyState message="No successful uploads in this window." />
            ) : (
              <FileSizeScatter
                data={parseScatter.map((p) => ({
                  x: p.fileSizeBytes,
                  y: p.parserDurationMs
                }))}
                xLabel="File size"
                yLabel="Parser duration"
                ariaLabel="Parse time versus file size"
              />
            )}
          </div>
        </SectionCard>

        {/* ============ Section 2 — Cost & economics ============ */}
        <SectionCard
          title="Cost & economics"
          description="Where the AI budget is going. Watch for outliers and cache decay."
          window={`Last ${WINDOW_DAYS_TRENDS} days`}
        >
          <StatRow
            stats={[
              {
                label: "Total AI cost",
                value: formatUsd(aiCostStats.totalCostUsd)
              },
              { label: "AI calls", value: formatInt(aiCostStats.totalCalls) },
              {
                label: "Cache hit rate",
                value: formatPct(aiCostStats.cacheHitPct, 1),
                hint: `${formatInt(aiCostStats.cacheHits)} cached`
              },
              {
                label: "Cost / active Pro",
                value:
                  engagementStats.totalProUsers > 0
                    ? formatUsd(
                        aiCostStats.totalCostUsd / engagementStats.totalProUsers
                      )
                    : "—",
                hint: `${formatInt(engagementStats.totalProUsers)} Pro users`
              }
            ]}
          />

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-caption font-medium uppercase tracking-wider text-slate-500">
                Daily AI cost
              </p>
              {dailyCost.every((d) => d.costUsd === 0) ? (
                <EmptyState message="No AI cost in this window." />
              ) : (
                <DailyLineChart
                  data={dailyCost.map((d) => ({
                    date: d.date,
                    costUsd: Number(d.costUsd.toFixed(4))
                  }))}
                  series={[
                    {
                      dataKey: "costUsd",
                      label: "USD",
                      color: ADMIN_CHART_COLORS.primary
                    }
                  ]}
                  valueFormat="usd"
                  ariaLabel="Daily AI cost"
                />
              )}
            </div>
            <div>
              <p className="mb-2 text-caption font-medium uppercase tracking-wider text-slate-500">
                Cost by feature
              </p>
              <CostByFeatureTable rows={aiCostByFeature} />
            </div>
          </div>

          <div>
            <p className="mb-2 text-caption font-medium uppercase tracking-wider text-slate-500">
              Top spenders
            </p>
            <TopSpendersTable rows={topSpenders} />
          </div>
        </SectionCard>

        {/* ============ Section 3 — Funnel ============ */}
        <SectionCard
          title="Funnel"
          description="Sign-up, activation, and Pro-conversion volumes."
        >
          <StatRow
            stats={[
              {
                label: "Total users",
                value: formatInt(funnelCounts.totalUsers),
                hint: `+${funnelCounts.newUsers7d} last 7d`
              },
              {
                label: "Activations",
                value: formatInt(funnelCounts.totalActivations),
                hint: `+${funnelCounts.newActivations30d} last 30d`
              },
              {
                label: "Active Pro subs",
                value: formatInt(funnelCounts.activeProSubs)
              },
              {
                label: "Free → Pro conversion",
                value: formatPct(funnelCounts.freeToProConversionPct, 1),
                hint: "Activated 30+ days ago, now Pro"
              }
            ]}
          />
          <StatRow
            stats={[
              { label: "New users 7d", value: formatInt(funnelCounts.newUsers7d) },
              { label: "New users 30d", value: formatInt(funnelCounts.newUsers30d) },
              { label: "Free activations", value: formatInt(funnelCounts.freeActivations) },
              { label: "Pro activations", value: formatInt(funnelCounts.proActivations) }
            ]}
          />
        </SectionCard>

        {/* ============ Section 4 — Engagement ============ */}
        <SectionCard
          title="Engagement"
          description="Are users coming back? Are stakeholders opening the shares? Are Pro users using AI?"
          window={`Last ${WINDOW_DAYS_TRENDS} days`}
        >
          <StatRow
            stats={[
              {
                label: "Share-view rate",
                value: formatPct(engagementStats.shareViewRatePct, 1),
                hint: `${engagementStats.sharedPlansWithExternalView30d}/${engagementStats.totalSharedPlans30d} shared plans got external views`
              },
              {
                label: "Repeat uploaders",
                value: formatPct(engagementStats.repeatUploadPct, 1),
                hint: `${engagementStats.repeatUploadingUsers30d}/${engagementStats.uploadingUsers30d} uploaders`
              },
              {
                label: "Pro using AI",
                value: formatPct(engagementStats.proUsageActivationPct, 1),
                hint: `${engagementStats.proUsersUsingAi7d}/${engagementStats.totalProUsers} Pro users, last 7d`
              },
              {
                label: "Pro users",
                value: formatInt(engagementStats.totalProUsers)
              }
            ]}
          />

          <div>
            <p className="mb-2 text-caption font-medium uppercase tracking-wider text-slate-500">
              Daily share views
            </p>
            {dailyShareViews.every(
              (d) => d.externalViews === 0 && d.ownerViews === 0
            ) ? (
              <EmptyState message="No share views yet." />
            ) : (
              <DailyLineChart
                data={dailyShareViews}
                series={[
                  {
                    dataKey: "externalViews",
                    label: "External (stakeholder)",
                    color: ADMIN_CHART_COLORS.primary
                  },
                  {
                    dataKey: "ownerViews",
                    label: "Owner (PM)",
                    color: ADMIN_CHART_COLORS.secondary
                  }
                ]}
                ariaLabel="Daily share views"
              />
            )}
          </div>

          <div>
            <p className="mb-2 text-caption font-medium uppercase tracking-wider text-slate-500">
              Top viewed shares
            </p>
            <TopViewedSharesTable rows={topViewedShares} />
          </div>
        </SectionCard>
      </div>
    </main>
  );
}

// ---------------------------------------------------------------------------
// Inline small server components (kept in this file to avoid clutter)
// ---------------------------------------------------------------------------

function EmptyState({ message }: { message: string }) {
  return (
    <div className="grid h-32 place-items-center rounded-md border border-dashed border-slate-200 bg-slate-50 text-caption text-slate-500">
      {message}
    </div>
  );
}

function CostByFeatureTable({
  rows
}: {
  rows: Awaited<ReturnType<typeof getAiCostByFeature>>;
}) {
  if (rows.length === 0) return <EmptyState message="No AI calls in this window." />;
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full text-body">
        <thead className="bg-slate-50 text-caption uppercase tracking-wider text-slate-600">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">Feature</th>
            <th className="px-3 py-2 text-right font-semibold">Calls</th>
            <th className="px-3 py-2 text-right font-semibold">Cost</th>
            <th className="px-3 py-2 text-right font-semibold">Cache hit</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.feature} className="border-t border-slate-200">
              <td className="px-3 py-2 font-mono text-caption">{r.feature}</td>
              <td className="px-3 py-2 text-right">{formatInt(r.calls)}</td>
              <td className="px-3 py-2 text-right">{formatUsd(r.totalCostUsd)}</td>
              <td className="px-3 py-2 text-right">{formatPct(r.cacheHitPct, 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopSpendersTable({
  rows
}: {
  rows: Awaited<ReturnType<typeof getTopSpenders>>;
}) {
  if (rows.length === 0) return <EmptyState message="No user-attributed AI spend yet." />;
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full text-body">
        <thead className="bg-slate-50 text-caption uppercase tracking-wider text-slate-600">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">User</th>
            <th className="px-3 py-2 text-right font-semibold">Calls</th>
            <th className="px-3 py-2 text-right font-semibold">Cost</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.userId} className="border-t border-slate-200">
              <td className="px-3 py-2 text-caption">
                {r.email ?? <span className="font-mono">{r.userId.slice(0, 8)}…</span>}
              </td>
              <td className="px-3 py-2 text-right">{formatInt(r.calls)}</td>
              <td className="px-3 py-2 text-right">{formatUsd(r.totalCostUsd)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TopViewedSharesTable({
  rows
}: {
  rows: Awaited<ReturnType<typeof getTopViewedShares>>;
}) {
  if (rows.length === 0) return <EmptyState message="No external views yet." />;
  return (
    <div className="overflow-x-auto rounded-md border border-slate-200">
      <table className="w-full text-body">
        <thead className="bg-slate-50 text-caption uppercase tracking-wider text-slate-600">
          <tr>
            <th className="px-3 py-2 text-left font-semibold">Share ID</th>
            <th className="px-3 py-2 text-right font-semibold">External views</th>
            <th className="px-3 py-2 text-right font-semibold">Last viewed</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.shareId} className="border-t border-slate-200">
              <td className="px-3 py-2 font-mono text-caption">{r.shareId.slice(0, 12)}…</td>
              <td className="px-3 py-2 text-right">{formatInt(r.externalViews)}</td>
              <td className="px-3 py-2 text-right text-caption text-slate-600">
                {new Date(r.lastViewed).toISOString().slice(0, 16).replace("T", " ")}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Suppress unused-import warning on formatBytes (kept in StatRow exports but
// not currently referenced from the page).
void formatBytes;
