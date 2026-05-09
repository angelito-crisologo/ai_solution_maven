import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Brain,
  FileSpreadsheet,
  Share2,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Explore AI Solution Maven products, including PlanSight AI for project plan analysis and stakeholder sharing.",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "Products | AI Solution Maven",
    description:
      "Explore AI Solution Maven products, including PlanSight AI for project plan analysis and stakeholder sharing.",
    url: "/products",
  },
};

const features = [
  {
    icon: FileSpreadsheet,
    title: "Import the plans you already have",
    description:
      "Upload .mpp files and render them in the browser as an interactive task table and synchronized Gantt chart. No MS Project install needed for viewers.",
  },
  {
    icon: Brain,
    title: "AI analysis on every plan",
    description:
      "Claude Haiku 4.5 generates a narrative summary, identifies risks tied to specific tasks, and prescribes next-step actions. Cached so repeat views are free.",
  },
  {
    icon: Share2,
    title: "Share without friction",
    description:
      "Send a read-only stakeholder link. Recipients open it in a browser and see the full plan, insights, and AI analysis with no login required.",
  },
];

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
            Starting with PlanSight AI — for project managers who need to
            understand plans fast and share them clearly.
          </p>
        </div>
      </section>

      <section id="plansight-ai" className="px-6 py-20">
        <div className="mx-auto max-w-[1200px]">
          <ProductCard
            title="PlanSight AI"
            description="Upload an MS Project plan, get an AI-generated analysis, and share a clean read-only view with stakeholders — all in the browser. Built for PMs who need their plans understood without forcing recipients to install MS Project."
            features={[
              "Import .mpp files and render them as an interactive task table + Gantt chart with day, week, and month timeline views.",
              "Get deterministic PMP-aligned insights — critical path, late tasks, at-risk work — plus a Claude-generated AI analysis with risks and recommendations.",
              "Share a public read-only stakeholder link with no login required, and export to a clean Excel workbook when needed.",
            ]}
            demoHref="/products/plansight-ai"
            caseStudyHref="/projects#plansight-ai"
          />
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-6 py-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              How it helps
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-dark md:text-4xl">
              From import to stakeholder-ready in minutes
            </h2>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
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
              Want to see how PlanSight AI fits your workflow?
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Try it now with one of your own .mpp files, or message me
              directly if you have a planning problem you&apos;d like a
              practical take on.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:shrink-0">
            <Link
              href="/products/plansight-ai"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-secondary px-6 py-3 text-base font-medium text-white shadow-lg shadow-primary/20"
            >
              Try PlanSight AI
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-6 py-3 text-base font-medium text-dark transition hover:border-slate-300 hover:bg-slate-50"
            >
              Start a Conversation
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
