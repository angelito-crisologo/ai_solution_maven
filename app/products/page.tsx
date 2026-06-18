import type { Metadata } from "next";
import {
  ArrowRight,
  FileUp,
  Share2,
  Sparkles,
  BookOpen,
  Clock,
  BarChart2,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Explore AI Solution Maven products — PlanSight AI for project plan analysis and ScrumReady for Scrum certification exam prep.",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "Products | AI Solution Maven",
    description:
      "Explore AI Solution Maven products — PlanSight AI for project plan analysis and ScrumReady for Scrum certification exam prep.",
    url: "/products",
  },
};

const plansightPreview = (
  <>
    <div className="mb-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-400">PlanSight AI</p>
        <p className="font-medium">Imported plan workspace</p>
      </div>
      <span className="rounded-xl bg-emerald-400/15 px-3 py-2 text-sm font-medium text-emerald-300">
        AI analysis live
      </span>
    </div>
    <div className="rounded-xl border border-slate-800 bg-white/[0.04] p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
        Product flow
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { Icon: FileUp, label: "Upload", text: "Drop in an .mpp file. Parsed into a normalized workspace." },
          { Icon: Sparkles, label: "Analyze", text: "Critical path, RAG status, and a Claude-generated narrative." },
          { Icon: Share2, label: "Share", text: "Send stakeholders a read-only link. No login required." },
        ].map(({ Icon, label, text }) => (
          <div key={label} className="rounded-md border border-slate-800 bg-slate-950 p-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-800 text-cyan-400">
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-100">{label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
          </div>
        ))}
      </div>
    </div>
  </>
);

const scrumreadyPreview = (
  <>
    <div className="mb-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-400">ScrumReady</p>
        <p className="font-medium">Quiz Mode — QB 01</p>
      </div>
      <span className="rounded-xl bg-emerald-400/15 px-3 py-2 text-sm font-medium text-emerald-300">
        3 correct in a row
      </span>
    </div>
    <div className="rounded-xl border border-slate-800 bg-white/[0.04] p-4">
      <p className="mb-1 text-xs text-slate-500">Question 7 of 20 · Single select</p>
      <p className="text-sm font-medium text-slate-200">
        Who is responsible for managing the Product Backlog in Scrum?
      </p>
      <div className="mt-3 grid gap-2">
        {["The Scrum Master", "The Product Owner", "The Developers", "The Stakeholders"].map(
          (opt, i) => (
            <div
              key={opt}
              className={
                i === 1
                  ? "rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-2 text-xs text-emerald-300"
                  : "rounded-lg bg-white/[0.05] px-3 py-2 text-xs text-slate-400"
              }
            >
              {opt}
            </div>
          )
        )}
      </div>
      <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
        <p className="text-xs font-semibold text-emerald-400">Key Scrum idea</p>
        <p className="mt-1 text-xs leading-5 text-slate-300">
          The Product Owner owns and orders the Product Backlog to best achieve the product goal.
        </p>
      </div>
    </div>
  </>
);

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-light">
      <section className="bg-dark text-white">
        <Navbar />
        <div className="mx-auto max-w-[1200px] px-6 py-16 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
            Products
          </p>
          <h1 className="mt-3 max-w-3xl text-[40px] font-bold leading-[1.12] tracking-normal md:text-[48px]">
            Practical AI products you can use from day one
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Real working software with a focus on outcomes, not buzzwords.
          </p>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-[1200px] space-y-8">
          <div id="plansight-ai">
            <ProductCard
              title="PlanSight AI"
              description="Upload an MS Project plan, get an AI-generated analysis, and share a clean read-only view with stakeholders — all in the browser. Built for PMs who need their plans understood without forcing recipients to install MS Project."
              features={[
                "Import .mpp files or MS Project XML exports and view an interactive task table and Gantt chart with day, week, and month timeline views.",
                "Get deterministic PMP-aligned insights — critical path, late tasks, at-risk work — plus a Claude-generated AI analysis with risks and recommendations.",
                "Share a public read-only stakeholder link with no login required, and export to a clean Excel workbook when needed.",
              ]}
              demoHref="https://plansight.aisolutionmaven.com"
              caseStudyHref="/projects#plansight-ai"
              preview={plansightPreview}
            />
          </div>

          <div id="scrumready">
            <ProductCard
              title="ScrumReady"
              description="Scrum Master certification exam prep for CSM and PSM I candidates. Combines a guided quiz mode with instant rationale explanations and a realistic timed exam simulator — so you build genuine knowledge, not just pattern memory."
              features={[
                "Six thematic quiz banks aligned with the Scrum Guide 2020, with instant feedback and rationale cards on every answer.",
                "A full exam simulator that mirrors real conditions — countdown timer, free navigation between questions, mark for review — no feedback until you submit.",
                "Track your Readiness Score across sessions and review every past attempt with full answer explanations.",
              ]}
              demoHref="https://scrumready.aisolutionmaven.com"
              caseStudyHref="/projects#scrumready"
              primaryCtaLabel="Start for free"
              preview={scrumreadyPreview}
            />
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-6 py-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              How they help
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-dark md:text-4xl">
              Built around real workflows
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              {
                icon: BookOpen,
                title: "Learn by doing",
                description:
                  "ScrumReady teaches through instant rationale explanations, not just right/wrong feedback — so you understand the principle behind every answer.",
              },
              {
                icon: Clock,
                title: "Simulate under pressure",
                description:
                  "The exam simulator replicates real conditions: a countdown timer, free navigation, and no feedback until you submit — just like the actual CSM or PSM I exam.",
              },
              {
                icon: BarChart2,
                title: "Plan without installation",
                description:
                  "PlanSight AI lets anyone view a Microsoft Project schedule, understand the critical path, and share a clean stakeholder view — no MS Project needed.",
              },
            ].map((feature) => (
              <article
                key={feature.title}
                className="rounded-2xl border border-slate-200 bg-light p-6"
              >
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white">
                  <feature.icon aria-hidden="true" className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-xl font-semibold text-dark">
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {feature.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-soft md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-dark">
              Have a workflow problem that needs a practical AI solution?
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Send the problem and the outcome you want. I will help scope the
              most useful first build.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:shrink-0">
            <a
              href="https://plansight.aisolutionmaven.com"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-secondary px-6 py-3 text-base font-medium text-white shadow-lg shadow-primary/20"
            >
              Try PlanSight AI
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </a>
            <a
              href="https://scrumready.aisolutionmaven.com"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-6 py-3 text-base font-medium text-dark transition hover:border-slate-300 hover:bg-slate-50"
            >
              Try ScrumReady
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
