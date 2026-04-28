import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  GitCompareArrows,
  LineChart,
  ShieldCheck,
} from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";

export const metadata: Metadata = {
  title: "Products",
  description:
    "Explore AI Solution Maven products, including PlanSight AI for practical planning and decision support.",
  alternates: {
    canonical: "/products",
  },
  openGraph: {
    title: "Products | AI Solution Maven",
    description:
      "Explore AI Solution Maven products, including PlanSight AI for practical planning and decision support.",
    url: "/products",
  },
};

const features = [
  {
    icon: GitCompareArrows,
    title: "Compare scenarios",
    description:
      "Model different paths before committing people, budget, and delivery expectations.",
  },
  {
    icon: ShieldCheck,
    title: "Spot risk early",
    description:
      "Surface constraints and tradeoffs while the plan can still be adjusted.",
  },
  {
    icon: LineChart,
    title: "Track decisions",
    description:
      "Keep assumptions, actions, and outcomes visible across the planning workflow.",
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
            Practical AI products for clearer business decisions
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Product work starts with a real workflow and ends with software that
            helps teams act with less guesswork.
          </p>
        </div>
      </section>

      <section id="plansight-ai" className="px-6 py-20">
        <div className="mx-auto max-w-[1200px]">
          <ProductCard
            title="PlanSight AI"
            description="PlanSight AI helps teams turn uncertain plans into clearer decisions. It models scenarios, highlights risk, and gives leaders a practical view of what is likely to happen next."
            features={[
              "Compare delivery, budget, and resource scenarios before committing.",
              "Surface risks early so teams can adjust plans with less guesswork.",
              "Keep decisions, assumptions, and outcomes visible in one product workflow.",
            ]}
            demoHref="/contact"
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
              Built for planning conversations that need evidence
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
              Want to see how PlanSight AI could fit your workflow?
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Share the planning problem and I will suggest the most practical
              next step.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-secondary px-6 py-3 text-base font-medium text-white shadow-lg shadow-primary/20"
          >
            Start a Conversation
            <ArrowRight aria-hidden="true" className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
