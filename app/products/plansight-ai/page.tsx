import type { Metadata } from "next";
import { ArrowRight, CheckCircle2 } from "lucide-react";
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

const benefits = [
  "Import a plan and normalize it into one shared view.",
  "Review schedule risk, summary insights, and key dependencies.",
  "Share a read-only stakeholder link without exposing edit complexity."
];

export default function PlanSightAIPage() {
  return (
    <main className="min-h-screen bg-light">
      <section className="bg-dark text-white">
        <Navbar />
        <div className="mx-auto grid max-w-[1200px] gap-10 px-6 py-16 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
              Product
            </p>
            <h1 className="mt-3 text-[40px] font-bold leading-[1.12] tracking-normal md:text-[48px]">
              PlanSight AI
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
              A plan upload, analysis, and stakeholder sharing product for project managers.
            </p>
            <div className="mt-8 grid gap-4">
              {benefits.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3">
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-success"
                  />
                  <span className="text-base text-slate-200">{benefit}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-6 backdrop-blur">
            <p className="text-sm font-semibold uppercase tracking-normal text-slate-300">
              Product flow
            </p>
            <div className="mt-5 grid gap-4">
              <div className="rounded-2xl bg-white/[0.06] p-4">
                <p className="text-sm text-slate-400">1. Upload</p>
                <p className="mt-1 text-white">
                  Bring in MPP now, with XLSX and Smartsheet adapters next.
                </p>
              </div>
              <div className="rounded-2xl bg-white/[0.06] p-4">
                <p className="text-sm text-slate-400">2. Analyze</p>
                <p className="mt-1 text-white">
                  AI summaries, structure checks, and plan health signals.
                </p>
              </div>
              <div className="rounded-2xl bg-white/[0.06] p-4">
                <p className="text-sm text-slate-400">3. Share</p>
                <p className="mt-1 text-white">
                  Send stakeholders a read-only, explanation-first link.
                </p>
              </div>
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
