import type { Metadata } from "next";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { PremiumAnalysisTeaser } from "@/components/plansight-ai/PremiumAnalysisTeaser";
import { PlanSightProductShell } from "@/components/plansight-ai/PlanSightProductShell";
import { PlanSightFlowGraphic } from "@/components/plansight-ai/PlanSightFlowGraphic";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "PlanSight AI",
  description:
    "Upload project plans, review deterministic insights, and share clear stakeholder views with PlanSight AI.",
  alternates: {
    canonical: "/products/plansight-ai",
  },
  openGraph: {
    title: "PlanSight AI | AI Solution Maven",
    description:
      "Upload project plans, review deterministic insights, and share clear stakeholder views with PlanSight AI.",
    url: "/products/plansight-ai",
  },
};

export default async function PlanSightAIPage() {
  const user = await getCurrentUser();

  return (
    <main className="min-h-screen bg-light">
      <section className="bg-dark text-white">
        <Navbar />
        <div className="mx-auto grid max-w-[1200px] gap-8 px-6 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-14">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
              Product
            </p>
            <h1 className="mt-3 text-[40px] font-bold leading-[1.12] tracking-normal md:text-[48px]">
              PlanSight AI
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-300 md:text-lg">
              Upload a plan, understand it fast, and share a clear stakeholder view.
            </p>
          </div>

          <PlanSightFlowGraphic />
        </div>
      </section>

      <PlanSightProductShell
        signedIn={!!user}
        userTier={user?.tier ?? null}
      />

      <section className="px-6 py-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-6 max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              AI Analysis
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-dark md:text-4xl">
              Free for the first analysis. Pro for daily use.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Every imported plan gets a Claude-generated AI summary, risks, and recommendations
              at no cost. Pro unlocks the multi-plan dashboard, regeneration on demand,
              version compare, stakeholder view analytics, plan health alerts, and custom
              branding for share pages.
            </p>
          </div>

          <PremiumAnalysisTeaser />
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-[1200px] gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft">
            <h2 className="text-2xl font-semibold text-dark">Why this product exists</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              PlanSight AI is built for PMs who need to upload a schedule, review deterministic
              project insights, and share a clean story with stakeholders without turning the
              plan into a heavy project-management tool.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft">
            <h2 className="text-2xl font-semibold text-dark">What you get</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Upload an MPP plan, inspect the imported schedule and project health, read a
              Claude-generated AI analysis with risks and recommendations, then send
              stakeholders a read-only share view. The Pro tier unlocks regeneration, advanced
              what-if analysis, and natural-language Q&amp;A.
            </p>
          </div>
        </div>
      </section>

      <CTA />
      <Footer />
    </main>
  );
}
