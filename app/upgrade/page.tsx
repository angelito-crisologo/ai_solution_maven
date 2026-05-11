import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CreditCard,
  FileBarChart,
  FileText,
  History,
  LayoutDashboard,
  RefreshCcw,
  Sparkles,
  Upload
} from "lucide-react";
import { PlanSightFooter } from "@/components/plansight-ai/PlanSightFooter";
import { PlanSightNavbar } from "@/components/plansight-ai/PlanSightNavbar";
import { getProductActivation, PRODUCTS } from "@/lib/auth/activations";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Upgrade to Pro",
  description: "PlanSight Pro for PMs who live in project plans every day.",
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

const PRO_FEATURES = [
  {
    name: "Multi-plan dashboard",
    description:
      "Keep every plan you upload. Open any past plan with its insights and AI analysis. Free is one plan slot only.",
    icon: LayoutDashboard
  },
  {
    name: "Unlimited plan retention",
    description:
      "Free replaces your previous plan when you import a new one and breaks its share link. Pro retains them all with stable share URLs.",
    icon: History
  },
  {
    name: "Regenerate AI analysis",
    description:
      "Re-run Claude on demand after a plan update. Free caches the first generation only — Pro keeps the analysis in sync with the plan.",
    icon: RefreshCcw
  },
  {
    name: "Explain this task — inline AI",
    description:
      "Click the spark on any task in the workspace and Claude explains it in plain language using its dependency neighbourhood.",
    icon: Sparkles
  },
  {
    name: "Export PDF",
    description:
      "Landscape A4 with ID, task name, dates, % complete, resource, and notes — outline-indented like MS Project. For stakeholder email and audits.",
    icon: FileText
  },
  {
    name: "Weekly Status Report",
    description:
      "One-page PDF covering the last completed week: RAG, slips, at-risk tasks, milestone hit/miss, and an AI-written Status Summary you can forward.",
    icon: FileBarChart
  },
  {
    name: "Higher upload limits",
    description:
      "25 MB files and up to 25,000 tasks per plan, vs. 5 MB and 5,000 on Free. Built for enterprise programs and consolidated portfolios.",
    icon: Upload
  }
];

type CheckoutSearchParams = {
  checkout?: string;
};

export default async function UpgradePage({
  searchParams
}: {
  searchParams?: CheckoutSearchParams;
}) {
  const user = await getCurrentUser();
  const activation = user ? await getProductActivation(user.id, PRODUCTS.PLANSIGHT) : null;
  const isPro = activation?.tier === "pro";
  const cancelled = searchParams?.checkout === "cancelled";

  return (
    <main className="min-h-screen bg-slate-50">
      <PlanSightNavbar
        signedIn={!!user}
        activated={!!activation}
        tier={activation?.tier ?? null}
        signupRedirectTo="/upgrade"
      />

      <section className="bg-navy text-slate-100">
        <div className="mx-auto max-w-[1200px] px-6 py-14">
          <p className="text-micro text-cyan-400">PlanSight Pro</p>
          <h1 className="mt-3 text-display text-slate-100">
            For PMs who live in project plans every day.
          </h1>
          <p className="mt-4 max-w-2xl text-lead text-slate-300">
            Free is built for one-off plan reviews. Pro adds the multi-plan
            dashboard, regeneration on demand, inline AI explanations,
            landscape PDF export, and AI-narrated weekly status reports.
          </p>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-[1200px]">
          {cancelled ? (
            <div className="mb-5 rounded-md border border-amber-300 bg-amber-50 p-4 text-body text-amber-900">
              Checkout was cancelled. Nothing was charged. You can try again any time.
            </div>
          ) : null}

          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-micro text-cyan-700">PlanSight Pro</p>
            <div className="mt-2 flex flex-wrap items-baseline gap-2">
              <span className="text-display text-ink">$19</span>
              <span className="text-body text-slate-600">USD / month</span>
            </div>
            <p className="mt-3 text-body-lg text-slate-700">
              Cancel any time from the billing portal. All Pro features unlock
              immediately after checkout.
            </p>

            {isPro ? (
              <div className="mt-5">
                <p className="mb-3 rounded-md border border-cyan-200 bg-cyan-50 p-3 text-body text-cyan-900">
                  You&apos;re already on Pro. Manage or cancel your subscription
                  from the billing portal.
                </p>
                <form action="/api/billing/portal" method="post">
                  <button
                    type="submit"
                    className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-4 text-body font-semibold text-white transition hover:bg-cyan-800"
                  >
                    <CreditCard className="h-4 w-4" />
                    Manage billing
                  </button>
                </form>
              </div>
            ) : !user ? (
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/signin?product=plansight-ai&redirectTo=/upgrade"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-4 text-body font-semibold text-white transition hover:bg-cyan-800"
                >
                  Sign up to upgrade
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/signin?redirectTo=/upgrade"
                  className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-body font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                >
                  I already have an account
                </Link>
              </div>
            ) : (
              <form action="/api/billing/checkout" method="post" className="mt-5">
                <button
                  type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-4 text-body font-semibold text-white transition hover:bg-cyan-800"
                >
                  <CreditCard className="h-4 w-4" />
                  Upgrade to Pro
                </button>
                <p className="mt-3 text-caption text-slate-500">
                  Secure checkout via Stripe. We never see your card details.
                </p>
              </form>
            )}
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-h1 text-ink">What you get with Pro</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PRO_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li
                  key={feature.name}
                  className="rounded-xl border border-slate-200 bg-white p-5"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-h3 text-ink">{feature.name}</h3>
                  <p className="mt-2 text-body text-slate-700">{feature.description}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <PlanSightFooter />
    </main>
  );
}
