import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { PremiumAnalysisTeaser } from "@/components/plansight-ai/PremiumAnalysisTeaser";
import { PlanSightFooter } from "@/components/plansight-ai/PlanSightFooter";
import { PlanSightNavbar } from "@/components/plansight-ai/PlanSightNavbar";
import { PlanSightProductShell } from "@/components/plansight-ai/PlanSightProductShell";
import { PlanSightFlowGraphic } from "@/components/plansight-ai/PlanSightFlowGraphic";
import { getProductActivation, PRODUCTS } from "@/lib/auth/activations";
import { getCurrentUser } from "@/lib/auth/session";
import { loadPlanForOwner } from "@/lib/plansight-ai/share-storage";

export const metadata: Metadata = {
  title: "PlanSight AI",
  description:
    "Your project plan, finally legible. Upload an .mpp file, review the critical path, share a stakeholder-ready view.",
  alternates: {
    canonical: "/products/plansight-ai",
  },
  // PlanSight pages override the AISM-wide icons set in app/layout.tsx so
  // browser tabs and the iOS home screen show the PlanSight mark instead.
  icons: {
    icon: [
      { url: "/products/plansight-ai/favicon.ico", sizes: "any" },
      { url: "/products/plansight-ai/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/products/plansight-ai/favicon-16.png", type: "image/png", sizes: "16x16" }
    ],
    apple: { url: "/products/plansight-ai/favicon-180.png", sizes: "180x180" }
  },
  manifest: "/products/plansight-ai/site.webmanifest",
  openGraph: {
    title: "PlanSight AI — your project plan, finally legible.",
    description:
      "Upload an .mpp file, review the critical path, share a stakeholder-ready view.",
    url: "/products/plansight-ai",
  },
};

type Props = {
  searchParams?: { shareId?: string };
};

export const dynamic = "force-dynamic";

export default async function PlanSightAIPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const activation = user ? await getProductActivation(user.id, PRODUCTS.PLANSIGHT) : null;

  // Deep-link from /my-plans: when ?shareId is present, server-side load the
  // plan for the signed-in owner and pre-populate the workspace. Stakeholders
  // who pasted the share URL can't reach this branch — loadPlanForOwner
  // requires owner_user_id to match. Mismatches redirect to /my-plans.
  let initialPlan = null;
  let initialShareId: string | null = null;
  const requestedShareId = searchParams?.shareId?.trim();
  if (requestedShareId) {
    if (!user) {
      redirect(
        `/signin?product=plansight-ai&redirectTo=${encodeURIComponent(
          `/products/plansight-ai?shareId=${requestedShareId}`
        )}`
      );
    }
    try {
      const owned = await loadPlanForOwner(requestedShareId, user.id);
      if (!owned) {
        redirect("/my-plans?error=not-found");
      }
      initialPlan = owned;
      initialShareId = requestedShareId;
    } catch (error) {
      // Don't crash the page on a transient load failure — fall through to
      // the empty-state workspace and let the user re-import.
      if (process.env.NODE_ENV !== "production") {
        console.error("[plansight-ai] failed to load owned plan", error);
      }
    }
  }

  return (
    <main className="min-h-screen bg-light">
      <PlanSightNavbar
        signedIn={!!user}
        activated={!!activation}
        tier={activation?.tier ?? null}
        signupRedirectTo="/products/plansight-ai"
      />

      <section className="bg-navy text-slate-100">
        <div className="mx-auto grid max-w-[1200px] gap-8 px-6 py-14 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
          <div>
            <Image
              src="/products/plansight-ai/brand/plansight-logo-primary-dark.svg"
              alt="PlanSight AI"
              width={280}
              height={56}
              priority
              className="h-12 w-auto md:h-14"
            />
            <p className="mt-6 text-micro text-cyan-400">AI project-plan analysis</p>
            <h1 className="mt-3 text-display text-slate-100">
              Your project plan, finally legible.
            </h1>
            <p className="mt-4 max-w-xl text-lead text-slate-300">
              Upload an .mpp file. Review the critical path, RAG status, and an
              AI-generated summary with risks and recommendations. Share a clear,
              read-only view with stakeholders. No login required for viewers.
            </p>
          </div>

          <PlanSightFlowGraphic />
        </div>
      </section>

      <PlanSightProductShell
        signedIn={!!user}
        plansightActivated={!!activation}
        plansightTier={activation?.tier ?? null}
        initialPlan={initialPlan}
        initialShareId={initialShareId}
      />

      <section className="px-6 py-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="mb-6 max-w-2xl">
            <p className="text-micro text-cyan-700">AI analysis</p>
            <h2 className="mt-3 text-h1 text-ink">
              Free for the first analysis. Pro for daily use.
            </h2>
            <p className="mt-4 text-body-lg text-slate-700">
              Every imported plan gets a Claude-generated summary, risks, and
              recommendations at no cost. Pro unlocks the multi-plan dashboard,
              regeneration on demand, the &ldquo;Explain this task&rdquo; inline
              AI, landscape PDF export, AI-narrated weekly status reports, and
              higher upload limits.
            </p>
          </div>

          <PremiumAnalysisTeaser />
        </div>
      </section>

      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-[1200px] gap-6 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-card">
            <h2 className="text-h2 text-ink">Why this product exists</h2>
            <p className="mt-3 text-body-lg text-slate-700">
              PlanSight AI is built for PMs who need to upload a schedule, review
              deterministic project insights, and share a clean story with
              stakeholders without turning the plan into a heavy project-management
              tool.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-card">
            <h2 className="text-h2 text-ink">What you get</h2>
            <p className="mt-3 text-body-lg text-slate-700">
              Upload an MPP plan, inspect the imported schedule and project health,
              read a Claude-generated analysis with risks and recommendations, then
              send stakeholders a read-only share view. Pro unlocks unlimited plan
              retention, inline AI per task, PDF exports, and weekly status reports.
            </p>
          </div>
        </div>
      </section>

      <PlanSightFooter />
    </main>
  );
}
