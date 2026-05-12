import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { PlanSightFooter } from "@/components/plansight-ai/PlanSightFooter";
import { PlanSightNavbar } from "@/components/plansight-ai/PlanSightNavbar";
import { PlanSightPricingSection } from "@/components/plansight-ai/PlanSightPricingSection";
import { PlanSightProductShell } from "@/components/plansight-ai/PlanSightProductShell";
import { PlanSightFlowGraphic } from "@/components/plansight-ai/PlanSightFlowGraphic";
import { getProductActivation, PRODUCTS } from "@/lib/auth/activations";
import { getUserPreferences } from "@/lib/auth/preferences";
import { getCurrentUser } from "@/lib/auth/session";
import { loadPlanForOwner } from "@/lib/plansight-ai/share-storage";

// PlanSight is searched as its own product (independent of the AISM portfolio
// brand), so we use an absolute title to bypass the "%s | AI Solution Maven"
// template defined in app/layout.tsx. The phrasing leads with the queries PMs
// actually type — "open .mpp file", "share Microsoft Project plan",
// "stakeholder view" — while keeping the brand name as the trailing anchor.
export const metadata: Metadata = {
  title: {
    absolute: "View and share Microsoft Project .mpp files — PlanSight AI"
  },
  description:
    "Upload a Microsoft Project .mpp file, see the critical path, late tasks, and AI-generated risks, then share a read-only stakeholder view. Free, no signup needed. Pro is $19/mo.",
  keywords: [
    "mpp viewer",
    "open mpp file online",
    "share Microsoft Project plan",
    "view mpp file without Microsoft Project",
    "project plan stakeholder share",
    "critical path analysis tool",
    "AI project plan analysis",
    "mpp file analysis"
  ],
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
    title: "View and share Microsoft Project .mpp files — PlanSight AI",
    description:
      "Upload a .mpp file, see critical path and AI-generated risks, share a read-only stakeholder view. Free, no signup.",
    url: "/products/plansight-ai",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "View and share Microsoft Project .mpp files — PlanSight AI",
    description:
      "Upload a .mpp file, see critical path and AI-generated risks, share a read-only stakeholder view. Free, no signup."
  }
};

type Props = {
  searchParams?: { shareId?: string };
};

export const dynamic = "force-dynamic";

export default async function PlanSightAIPage({ searchParams }: Props) {
  const user = await getCurrentUser();
  const activation = user ? await getProductActivation(user.id, PRODUCTS.PLANSIGHT) : null;
  const preferences = user ? await getUserPreferences(user.id) : { weekStartDay: "monday" as const };

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
        `/signin?redirectTo=${encodeURIComponent(
          `/products/plansight-ai?shareId=${requestedShareId}`
        )}`
      );
    }
    try {
      const owned = await loadPlanForOwner(requestedShareId, user.id);
      if (!owned) {
        redirect("/products/plansight-ai/my-plans?error=not-found");
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

  // SoftwareApplication JSON-LD — lets SERPs render the Free/$19 offers and
  // category inline. Numbers mirror the marketing pricing section so a future
  // pricing change requires a deliberate update here too.
  const softwareApplicationLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "PlanSight AI",
    description:
      "Upload a Microsoft Project .mpp file, see the critical path, late tasks, and AI-generated risks, then share a read-only stakeholder view.",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web Browser",
    url: "https://aisolutionmaven.com/products/plansight-ai",
    image:
      "https://aisolutionmaven.com/products/plansight-ai/brand/plansight-logo-primary.svg",
    offers: [
      {
        "@type": "Offer",
        name: "Free",
        price: "0",
        priceCurrency: "USD",
        description:
          "Upload .mpp files, view deterministic insights, run one AI analysis per plan, share stakeholder links."
      },
      {
        "@type": "Offer",
        name: "Pro (monthly)",
        price: "19",
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "19",
          priceCurrency: "USD",
          unitText: "MONTH"
        },
        description:
          "Regenerate AI any time, weekly status PDF, Explain-this-task AI, multi-plan dashboard, PDF export."
      },
      {
        "@type": "Offer",
        name: "Pro (annual)",
        price: "190",
        priceCurrency: "USD",
        priceSpecification: {
          "@type": "UnitPriceSpecification",
          price: "190",
          priceCurrency: "USD",
          unitText: "ANNUAL"
        },
        description: "Same as monthly Pro, billed annually — saves ~17%."
      }
    ],
    publisher: {
      "@type": "Organization",
      name: "AI Solution Maven",
      url: "https://aisolutionmaven.com"
    }
  };

  return (
    <main className="min-h-screen bg-light">
      <script
        type="application/ld+json"
        // SSR-only; React inserts the literal JSON without escaping.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationLd) }}
      />
      <PlanSightNavbar
        signedIn={!!user}
        activated={!!activation}
        tier={activation?.tier ?? null}
        signinRedirectTo="/products/plansight-ai"
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

      <div id="plansight-workspace" className="scroll-mt-16">
        <PlanSightProductShell
          signedIn={!!user}
          plansightActivated={!!activation}
          plansightTier={activation?.tier ?? null}
          initialPlan={initialPlan}
          initialShareId={initialShareId}
          weekStartDay={preferences.weekStartDay}
        />
      </div>

      <PlanSightPricingSection />

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
