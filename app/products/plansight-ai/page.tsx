import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BookOpen } from "lucide-react";
import { PlanSightFooter } from "@/components/plansight-ai/PlanSightFooter";
import { PlanSightNavbar } from "@/components/plansight-ai/PlanSightNavbar";
import { PlanSightPricingSection } from "@/components/plansight-ai/PlanSightPricingSection";
import { PlanSightProductShell } from "@/components/plansight-ai/PlanSightProductShell";
import { PlanSightHeroCta } from "@/components/plansight-ai/PlanSightHeroCta";
import { getProductActivation, PRODUCTS } from "@/lib/auth/activations";
import { getUserPreferences } from "@/lib/auth/preferences";
import { getCurrentUser } from "@/lib/auth/session";
import { listGuides } from "@/lib/guides";
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
  // Latest published guides to surface in the discovery section near the
  // page footer. Limit to three so the section stays tight; the full list
  // lives at /products/plansight-ai/guides.
  const recentGuides = (await listGuides()).slice(0, 3);

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
        // Google's parser rejects nested UnitPriceSpecification under
        // Offer.priceSpecification ("Invalid object type"), so the recurring
        // signal lives in the Offer name and description instead. price +
        // priceCurrency are still the canonical fields rich results read.
        name: "Pro (monthly)",
        price: "19",
        priceCurrency: "USD",
        description:
          "$19 per month. Regenerate AI any time, weekly status PDF, Explain-this-task AI, multi-plan dashboard, PDF export."
      },
      {
        "@type": "Offer",
        name: "Pro (annual)",
        price: "190",
        priceCurrency: "USD",
        description:
          "$190 per year. Same as monthly Pro, billed annually — saves ~17%."
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
            <PlanSightHeroCta />
            <p className="mt-8 text-[11px] leading-[18px] font-normal text-[#94A3B8]">
              Analysis runs on Anthropic&apos;s Claude Haiku 4.5.
            </p>
          </div>

          <Image
            src="/products/plansight-ai/hero/workspace.webp"
            alt="PlanSight workspace showing the critical path, RAG status, and AI summary for a sample software development project plan."
            width={2560}
            height={1600}
            priority
            sizes="(min-width: 1024px) 600px, 100vw"
            className="w-full rounded-xl border border-slate-800 shadow-modal"
          />
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

      {activation?.tier === "pro" ? null : (
        <div id="pricing" className="scroll-mt-16">
          <PlanSightPricingSection />
        </div>
      )}

      {recentGuides.length > 0 ? (
        <section className="bg-slate-50 px-6 py-20">
          <div className="mx-auto max-w-[1200px]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div className="max-w-2xl">
                <p className="text-micro uppercase tracking-wider text-cyan-700">
                  Guides
                </p>
                <h2 className="mt-3 text-h1 text-ink">
                  Working PM reading
                </h2>
                <p className="mt-3 text-body-lg text-slate-700">
                  Practical posts on opening .mpp files, sharing project plans,
                  and the analysis concepts that show up every week.
                </p>
              </div>
              <Link
                href="/products/plansight-ai/guides"
                className="inline-flex h-10 items-center gap-1 self-start text-caption font-semibold text-cyan-700 hover:text-cyan-800 sm:self-end"
              >
                All guides
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <ul className="mt-8 grid gap-4 md:grid-cols-3">
              {recentGuides.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={`/products/plansight-ai/guides/${guide.slug}`}
                    className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-card"
                  >
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-cyan-50 text-cyan-700">
                      <BookOpen className="h-4 w-4" />
                    </span>
                    <h3 className="mt-4 text-h3 text-ink group-hover:text-cyan-700">
                      {guide.title}
                    </h3>
                    <p className="mt-2 flex-1 text-body text-slate-700">
                      {guide.description}
                    </p>
                    <span className="mt-4 inline-flex items-center gap-1 text-caption font-semibold text-cyan-700">
                      Read guide
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

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
