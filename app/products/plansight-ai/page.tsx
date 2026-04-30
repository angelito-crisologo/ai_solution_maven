import type { Metadata } from "next";
import { ArrowRight, FileUp, Share2, Sparkles } from "lucide-react";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { PlanSightProductShell } from "@/components/plansight-ai/PlanSightProductShell";

export const metadata: Metadata = {
  title: "PlanSight AI",
  description:
    "Upload project plans, analyze them with AI, and share clear stakeholder views with PlanSight AI.",
  alternates: {
    canonical: "/products/plansight-ai",
  },
  openGraph: {
    title: "PlanSight AI | AI Solution Maven",
    description:
      "Upload project plans, analyze them with AI, and share clear stakeholder views with PlanSight AI.",
    url: "/products/plansight-ai",
  },
};

const flowSteps = [
  {
    icon: FileUp,
    title: "Upload",
    text: "Import an MPP plan into a normalized workspace."
  },
  {
    icon: Sparkles,
    title: "Analyze",
    text: "Review schedule health, dependencies, and AI-ready insight."
  },
  {
    icon: Share2,
    title: "Share",
    text: "Open a read-only stakeholder link from the same plan."
  }
];

export default function PlanSightAIPage() {
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

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-normal text-slate-300">
              Product flow
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              {flowSteps.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div key={step.title} className="rounded-2xl border border-white/10 bg-white/[0.05] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-xs font-semibold uppercase tracking-normal text-slate-400">
                        0{index + 1}
                      </span>
                    </div>
                    <p className="mt-4 text-sm font-semibold text-white">{step.title}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{step.text}</p>
                    {index < flowSteps.length - 1 ? (
                      <ArrowRight className="mt-4 h-4 w-4 text-slate-500 sm:hidden" />
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <PlanSightProductShell />

      <section className="px-6 pb-20">
        <div className="mx-auto grid max-w-[1200px] gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft">
            <h2 className="text-2xl font-semibold text-dark">Why this product exists</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              PlanSight AI is built for PMs who need to upload a schedule, understand what is
              inside it, and share a clean story with stakeholders without turning the plan into
              a heavy project-management tool.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-soft">
            <h2 className="text-2xl font-semibold text-dark">What comes next</h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              The next implementation layer is the real import service: parse MPP, normalize it
              into the PlanSight schema, and feed that same pipeline into the stakeholder view.
            </p>
          </div>
        </div>
      </section>

      <CTA />
      <Footer />
    </main>
  );
}
