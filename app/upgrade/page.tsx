import type { Metadata } from "next";
import Link from "next/link";
import {
  BellRing,
  GitCompareArrows,
  History,
  LayoutDashboard,
  Mail,
  Palette,
  RefreshCcw,
  Sparkles,
  Users
} from "lucide-react";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";
import { PlanSightNavbar } from "@/components/plansight-ai/PlanSightNavbar";
import { getProductActivation, PRODUCTS } from "@/lib/auth/activations";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Upgrade to Pro",
  description: "Upgrade PlanSight AI to Pro for the multi-plan dashboard and daily-PM features."
};

export const dynamic = "force-dynamic";

const PRO_FEATURES = [
  {
    name: "Multi-plan dashboard",
    description: "Keep every plan you upload. Open any past plan with its insights and AI analysis.",
    icon: LayoutDashboard
  },
  {
    name: "Plan retention",
    description: "Free replaces your previous plan when you import. Pro keeps them all.",
    icon: History
  },
  {
    name: "Regenerate AI analysis",
    description: "Re-run Claude on demand after a plan update. Free caches the first generation only.",
    icon: RefreshCcw
  },
  {
    name: "Version compare",
    description: "Upload an updated plan and see what changed — moves, slips, critical-path shifts.",
    icon: GitCompareArrows
  },
  {
    name: "Stakeholder analytics",
    description: "Know when share links are opened, by whom, and which views they hit.",
    icon: Users
  },
  {
    name: "Health alerts",
    description: "Email notifications when a plan flips amber/red or a critical task slips.",
    icon: BellRing
  },
  {
    name: "Custom branding",
    description: "Your logo and colors on stakeholder share pages and exported reports.",
    icon: Palette
  }
];

export default async function UpgradePage() {
  const user = await getCurrentUser();
  const activation = user ? await getProductActivation(user.id, PRODUCTS.PLANSIGHT) : null;

  return (
    <main className="min-h-screen bg-light">
      <PlanSightNavbar
        signedIn={!!user}
        activated={!!activation}
        tier={activation?.tier ?? null}
        signupRedirectTo="/upgrade"
      />

      <section className="bg-dark text-white">
        <div className="mx-auto max-w-[1200px] px-6 py-14">
          <p className="text-sm font-semibold uppercase tracking-normal text-amber-300">
            PlanSight AI Pro
          </p>
          <h1 className="mt-2 text-[40px] font-bold leading-[1.12] tracking-normal md:text-[48px]">
            Use PlanSight AI as a daily PM tool
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
            Free is built for one-off plan reviews. Pro is built for the PMs who live in
            project plans every day — multi-plan dashboard, regeneration, version compare,
            analytics, alerts, and branded shares.
          </p>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-[1200px]">
          <div className="rounded-3xl border border-amber-200 bg-amber-50 p-6">
            <div className="flex items-start gap-4">
              <span className="inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-700">
                <Sparkles className="h-6 w-6" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold uppercase tracking-normal text-amber-800">
                  Self-serve checkout coming soon
                </p>
                <h2 className="mt-1 text-2xl font-semibold text-dark">
                  Want Pro early? Email me.
                </h2>
                <p className="mt-2 text-base leading-7 text-slate-700">
                  Stripe checkout ships in the next phase. In the meantime, email me and I&apos;ll
                  flip your account to Pro manually — same features, no billing yet while we
                  validate pricing.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Link
                    href="mailto:angelito.crisologo@aisolutionmaven.com?subject=PlanSight%20AI%20Pro%20access"
                    className="inline-flex items-center gap-2 rounded-xl bg-secondary px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-secondary/20"
                  >
                    <Mail className="h-4 w-4" />
                    Email for Pro access
                  </Link>
                  <Link
                    href="/contact"
                    className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                  >
                    Or use the contact form
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="mx-auto max-w-[1200px]">
          <h2 className="text-2xl font-semibold text-dark">What you get with Pro</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {PRO_FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <li
                  key={feature.name}
                  className="rounded-2xl border border-slate-200 bg-white p-5 shadow-soft"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-dark">{feature.name}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
                </li>
              );
            })}
          </ul>
        </div>
      </section>

      <CTA />
      <Footer />
    </main>
  );
}
