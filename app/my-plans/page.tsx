import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarRange, FileText, LayoutDashboard, Lock, Sparkles } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { getCurrentUser } from "@/lib/auth/session";
import { listPlansForUser } from "@/lib/plansight-ai/share-storage";

export const metadata: Metadata = {
  title: "My Plans",
  description: "Your imported PlanSight AI plans."
};

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

export default async function MyPlansPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/signin?redirectTo=/my-plans");
  }

  const plans = await listPlansForUser(user.id);
  const isPro = user.tier === "pro";
  const visiblePlans = plans;
  const hiddenCount = isPro ? 0 : Math.max(0, plans.length - 1);

  return (
    <main className="min-h-screen bg-light">
      <section className="bg-dark text-white">
        <Navbar />
        <div className="mx-auto max-w-[1200px] px-6 py-12">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 text-white">
              <LayoutDashboard className="h-6 w-6" />
            </span>
            <div>
              <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
                My Plans
              </p>
              <h1 className="mt-1 text-3xl font-bold leading-tight md:text-4xl">
                {isPro ? "Your plan workspace" : "Your most recent plan"}
              </h1>
            </div>
          </div>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-300">
            {isPro
              ? "Pro keeps every plan you import. Open one to view its insights, AI analysis, or share view."
              : "Free includes one plan slot. Importing a new plan replaces the previous one. Upgrade to Pro to keep every plan you upload."}
          </p>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-600">
              {plans.length === 0
                ? "No plans yet."
                : `${plans.length} plan${plans.length === 1 ? "" : "s"} on your account.`}
            </p>
            <Link
              href="/products/plansight-ai"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary/90"
            >
              <FileText className="h-4 w-4" />
              Import a plan
            </Link>
          </div>

          {plans.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-soft">
              <p className="text-base text-slate-600">
                You haven&apos;t imported any plans yet.
              </p>
              <Link
                href="/products/plansight-ai"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-primary to-secondary px-5 py-3 text-sm font-medium text-white shadow-lg shadow-primary/20"
              >
                Go to PlanSight AI
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {visiblePlans.map((plan, index) => {
                const lockedForFree = !isPro && index > 0;
                return (
                  <li
                    key={plan.share_id}
                    className={`rounded-2xl border bg-white p-5 shadow-soft ${
                      lockedForFree ? "border-slate-200 opacity-60" : "border-slate-200"
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        <p className="truncate text-base font-semibold text-dark">
                          {plan.title}
                        </p>
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <CalendarRange className="h-3.5 w-3.5" />
                            Imported {formatDate(plan.imported_at)}
                          </span>
                          {plan.start_date ? (
                            <span>Starts {formatDate(plan.start_date)}</span>
                          ) : null}
                          {plan.finish_date ? (
                            <span>Ends {formatDate(plan.finish_date)}</span>
                          ) : null}
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium uppercase tracking-wide text-slate-600">
                            {plan.source_format}
                          </span>
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {lockedForFree ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-secondary/30 bg-secondary/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-secondary">
                            <Lock className="h-3 w-3" />
                            Pro only
                          </span>
                        ) : (
                          <Link
                            href={`/share/${plan.share_id}`}
                            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                          >
                            Open share view
                          </Link>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {hiddenCount > 0 ? (
            <div className="mt-6 rounded-2xl border border-secondary/30 bg-secondary/5 p-5">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary/10 text-secondary">
                  <Sparkles className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-dark">
                    {hiddenCount} previous plan{hiddenCount === 1 ? "" : "s"} held until you upgrade
                  </p>
                  <p className="mt-1 text-sm leading-6 text-slate-600">
                    Free shows only your most recent plan. Upgrade to Pro to unlock the
                    full multi-plan dashboard with rename, archive, and delete.
                  </p>
                  <Link
                    href="/upgrade"
                    className="mt-3 inline-flex items-center gap-2 rounded-xl bg-secondary px-4 py-2 text-sm font-semibold text-white transition hover:bg-secondary/90"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Upgrade to Pro
                  </Link>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <Footer />
    </main>
  );
}
