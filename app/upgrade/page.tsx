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
  Users
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
            dashboard, regeneration on demand, version compare, stakeholder
            analytics, health alerts, and branded share pages.
          </p>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-[1200px]">
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-micro text-cyan-700">Self-serve checkout</p>
            <h2 className="mt-2 text-h2 text-ink">Want Pro early? Email us.</h2>
            <p className="mt-2 text-body-lg text-slate-700">
              Stripe checkout ships in the next phase. Until then, email and we&apos;ll
              flip your account to Pro manually — same features, no billing yet
              while we validate pricing.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="mailto:angelito.crisologo@aisolutionmaven.com?subject=PlanSight%20AI%20Pro%20access"
                className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-4 text-body font-semibold text-white transition hover:bg-cyan-800"
              >
                <Mail className="h-4 w-4" />
                Email for Pro access
              </Link>
              <Link
                href="/contact"
                className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-white px-4 text-body font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
              >
                Or use the contact form
              </Link>
            </div>
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
