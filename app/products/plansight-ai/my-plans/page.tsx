import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  CalendarRange,
  CheckCircle2,
  CircleAlert,
  CreditCard,
  ExternalLink,
  FileText,
  LayoutDashboard,
  Lock,
  ShieldOff
} from "lucide-react";
import { ClaimGuestPlanOnMount } from "@/components/plansight-ai/ClaimGuestPlanOnMount";
import { CopyShareLinkButton } from "@/components/plansight-ai/CopyShareLinkButton";
import { DeletePlanButton } from "@/components/plansight-ai/DeletePlanButton";
import { ManageShareButton } from "@/components/plansight-ai/ManageShareButton";
import { PlanSightFooter } from "@/components/plansight-ai/PlanSightFooter";
import { PlanSightNavbar } from "@/components/plansight-ai/PlanSightNavbar";
import { WeekStartDayToggle } from "@/components/plansight-ai/WeekStartDayToggle";
import { getProductActivation, PRODUCTS } from "@/lib/auth/activations";
import { getUserPreferences } from "@/lib/auth/preferences";
import { getCurrentUser } from "@/lib/auth/session";
import { getUserBilling } from "@/lib/billing/stripe";
import { listPlansForUser } from "@/lib/plansight-ai/share-storage";

export const metadata: Metadata = {
  title: "My plans",
  description: "Your imported PlanSight AI plans.",
  icons: {
    icon: [
      { url: "/products/plansight-ai/favicon.ico", sizes: "any" },
      { url: "/products/plansight-ai/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/products/plansight-ai/favicon-16.png", type: "image/png", sizes: "16x16" }
    ],
    apple: { url: "/products/plansight-ai/favicon-180.png", sizes: "180x180" }
  },
  manifest: "/products/plansight-ai/site.webmanifest"
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

type MyPlansSearchParams = {
  checkout?: string;
};

export default async function MyPlansPage({
  searchParams
}: {
  searchParams?: MyPlansSearchParams;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/signin?redirectTo=/products/plansight-ai/my-plans");
  }

  const activation = await getProductActivation(user.id, PRODUCTS.PLANSIGHT);
  if (!activation) {
    // Signed in but never activated PlanSight (e.g. signed up via another
    // product). Send them to the product page where the Activate button
    // lives.
    redirect("/products/plansight-ai");
  }

  const plans = await listPlansForUser(user.id);
  const isPro = activation.tier === "pro";
  const visiblePlans = plans;
  const hiddenCount = isPro ? 0 : Math.max(0, plans.length - 1);
  const checkoutSuccess = searchParams?.checkout === "success";

  // Pull billing only for Pro users — that's the only state where the
  // cancellation-pending banner is meaningful.
  const billing = isPro ? await getUserBilling(user.id) : null;
  const preferences = await getUserPreferences(user.id);
  const cancelPending =
    !!billing?.cancelAtPeriodEnd && !!billing.currentPeriodEnd;
  const cancelDate = cancelPending
    ? new Date(billing!.currentPeriodEnd!).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <ClaimGuestPlanOnMount />
      <PlanSightNavbar
        signedIn
        activated
        tier={activation.tier}
      />

      <section className="bg-navy text-slate-100">
        <div className="mx-auto max-w-[1200px] px-6 py-12">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-slate-800 bg-navy-800 text-cyan-400">
                <LayoutDashboard className="h-5 w-5" />
              </span>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-micro text-cyan-400">My plans</p>
                  <span
                    className={
                      isPro
                        ? "rounded border border-cyan-700 bg-cyan-900/30 px-2 py-0.5 text-micro text-cyan-300"
                        : "rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-micro text-slate-300"
                    }
                  >
                    {isPro
                      ? billing?.billingInterval === "year"
                        ? "Pro · Annual"
                        : billing?.billingInterval === "month"
                          ? "Pro · Monthly"
                          : "Pro plan"
                      : "Free plan"}
                  </span>
                </div>
                <h1 className="mt-1 text-h1 text-slate-100">
                  {isPro ? "Your plan workspace" : "Your most recent plan"}
                </h1>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4">
              <WeekStartDayToggle initial={preferences.weekStartDay} />
              {isPro ? (
                <form action="/api/billing/portal" method="post">
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-slate-700 bg-navy-800 px-3 text-caption font-semibold text-slate-100 transition hover:border-cyan-400 hover:text-cyan-300"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Manage billing
                  </button>
                </form>
              ) : null}
            </div>
          </div>
          {isPro ? (
            <p className="mt-3 max-w-2xl text-body-lg text-slate-300">
              Pro keeps every plan you import. Open one to view its insights, AI
              analysis, or share view.
            </p>
          ) : (
            <div className="mt-3 max-w-2xl space-y-2 text-body-lg text-slate-300">
              <p>
                Free includes one plan slot. Importing a new plan replaces the
                previous one — and{" "}
                <span className="font-semibold text-slate-100">
                  invalidates any share links you sent for the previous plan
                </span>
                . Stakeholders opening an old link will see &ldquo;This plan is
                no longer available for viewing.&rdquo;
              </p>
              <p>
                Upgrade to Pro to keep every plan you upload, with stable share
                links that don&apos;t expire on import.
              </p>
            </div>
          )}
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-[1200px]">
          {checkoutSuccess ? (
            <div className="mb-6 flex items-start gap-3 rounded-md border border-emerald-200 bg-emerald-50 p-4 text-body text-emerald-900">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-emerald-600" />
              <div>
                <p className="font-semibold">Welcome to PlanSight Pro.</p>
                <p className="mt-0.5 text-emerald-800">
                  Your subscription is active. Multi-plan retention, regenerate,
                  and the rest of Pro are unlocked. Manage billing any time from
                  the button above.
                </p>
              </div>
            </div>
          ) : null}

          {cancelPending ? (
            <div className="mb-6 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-4 text-body text-amber-900">
              <CircleAlert className="mt-0.5 h-5 w-5 text-amber-600" />
              <div className="flex-1">
                <p className="font-semibold">Cancellation scheduled.</p>
                <p className="mt-0.5 text-amber-800">
                  Pro is active until{" "}
                  <span className="font-mono">{cancelDate}</span>. After that,
                  this account drops to Free and only your most recent plan
                  stays accessible. Changed your mind? See our{" "}
                  <Link
                    href="/products/plansight-ai/legal/refunds"
                    className="font-semibold text-amber-900 underline-offset-2 transition hover:underline"
                  >
                    Refund Policy
                  </Link>{" "}
                  for what cancellation does and doesn&apos;t refund.
                </p>
                <form action="/api/billing/portal" method="post" className="mt-3">
                  <button
                    type="submit"
                    className="inline-flex h-9 items-center gap-2 rounded-md border border-amber-300 bg-white px-3 text-caption font-semibold text-amber-900 transition hover:border-amber-400 hover:bg-amber-100"
                  >
                    <CreditCard className="h-3.5 w-3.5" />
                    Reactivate subscription
                  </button>
                </form>
              </div>
            </div>
          ) : null}

          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <p className="text-body text-slate-600">
              {plans.length === 0
                ? "No plans yet."
                : `${plans.length} plan${plans.length === 1 ? "" : "s"} on your account.`}
            </p>
            <Link
              href="/products/plansight-ai"
              className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-4 text-body font-semibold text-white transition hover:bg-cyan-800"
            >
              <FileText className="h-4 w-4" />
              Import a plan
            </Link>
          </div>

          {plans.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
              <p className="text-body text-slate-600">
                No plans yet. Upload an .mpp file to start.
              </p>
              <Link
                href="/products/plansight-ai"
                className="mt-5 inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-4 text-body font-semibold text-white transition hover:bg-cyan-800"
              >
                Go to PlanSight AI
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {visiblePlans.map((plan, index) => {
                const lockedForFree = !isPro && index > 0;
                const workspaceHref = `/products/plansight-ai?shareId=${plan.share_id}`;
                const sharePath = `/share/${plan.share_id}`;
                const shareRevoked = !!plan.share_revoked_at;
                const sharePasswordSet = plan.share_has_password;
                return (
                  <li
                    key={plan.share_id}
                    className={`rounded-xl border border-slate-200 bg-white p-5 ${
                      lockedForFree ? "opacity-60" : ""
                    }`}
                  >
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                      <div className="min-w-0">
                        {lockedForFree ? (
                          <p className="truncate text-h3 text-ink">
                            {plan.title}
                          </p>
                        ) : (
                          <Link
                            href={workspaceHref}
                            className="block truncate text-h3 text-ink transition hover:text-cyan-700"
                          >
                            {plan.title}
                          </Link>
                        )}
                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-caption text-slate-500">
                          <span className="inline-flex items-center gap-1">
                            <CalendarRange className="h-3.5 w-3.5" />
                            Imported{" "}
                            <span className="font-mono text-caption">
                              {formatDate(plan.imported_at)}
                            </span>
                          </span>
                          {plan.start_date ? (
                            <span>
                              Starts{" "}
                              <span className="font-mono text-caption">
                                {formatDate(plan.start_date)}
                              </span>
                            </span>
                          ) : null}
                          {plan.finish_date ? (
                            <span>
                              Ends{" "}
                              <span className="font-mono text-caption">
                                {formatDate(plan.finish_date)}
                              </span>
                            </span>
                          ) : null}
                          <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-caption text-slate-600">
                            {plan.source_format}
                          </span>
                          {shareRevoked ? (
                            <span className="inline-flex items-center gap-1 rounded bg-amber-100 px-2 py-0.5 text-caption font-semibold text-amber-800">
                              <ShieldOff className="h-3 w-3" />
                              Share revoked
                            </span>
                          ) : null}
                          {sharePasswordSet && !shareRevoked ? (
                            <span
                              className="inline-flex items-center gap-1 rounded bg-cyan-50 px-2 py-0.5 text-caption text-cyan-700"
                              title="Share link is password-protected"
                            >
                              <Lock className="h-3 w-3" />
                              Password
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {lockedForFree ? (
                          <span className="inline-flex items-center gap-1 rounded bg-cyan-50 px-2 py-1 text-micro text-cyan-700">
                            <Lock className="h-3 w-3" />
                            Pro only
                          </span>
                        ) : (
                          <>
                            <Link
                              href={workspaceHref}
                              className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-4 text-body font-semibold text-white transition hover:bg-cyan-800"
                            >
                              Open
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                            <CopyShareLinkButton sharePath={sharePath} />
                            <Link
                              href={sharePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-3 text-body font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                              title="Open the read-only stakeholder view in a new tab"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Stakeholder view
                            </Link>
                            <ManageShareButton
                              shareId={plan.share_id}
                              title={plan.title}
                              isPro={isPro}
                              revoked={shareRevoked}
                              hasPassword={sharePasswordSet}
                              passwordSetAt={plan.share_password_set_at}
                            />
                            <DeletePlanButton
                              shareId={plan.share_id}
                              title={plan.title}
                            />
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {hiddenCount > 0 ? (
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-5">
              <p className="text-h3 text-ink">
                {hiddenCount} previous plan{hiddenCount === 1 ? "" : "s"} held until you upgrade
              </p>
              <p className="mt-1 text-body text-slate-700">
                Free shows only your most recent plan. Upgrade to Pro to keep every
                plan you import, with rename, archive, and delete.
              </p>
              <Link
                href="/products/plansight-ai/upgrade"
                className="mt-4 inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-4 text-body font-semibold text-white transition hover:bg-cyan-800"
              >
                Upgrade to Pro
              </Link>
            </div>
          ) : null}
        </div>
      </section>

      <PlanSightFooter />
    </main>
  );
}
