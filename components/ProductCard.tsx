import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

type ProductCardProps = {
  title: string;
  description: string;
  features: string[];
  demoHref: string;
  caseStudyHref: string;
};

export function ProductCard({
  title,
  description,
  features,
  demoHref,
  caseStudyHref,
}: ProductCardProps) {
  return (
    <article className="grid gap-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-soft lg:grid-cols-[0.9fr_1.1fr] lg:p-8">
      <div>
        <p className="text-sm font-semibold uppercase tracking-normal text-primary">
          Featured product
        </p>
        <h2 className="mt-3 text-3xl font-semibold leading-tight text-dark md:text-4xl">
          {title}
        </h2>
        <p className="mt-4 text-base leading-7 text-slate-600">
          {description}
        </p>

        <div className="mt-6 grid gap-3">
          {features.map((feature) => (
            <div key={feature} className="flex items-start gap-3">
              <CheckCircle2
                aria-hidden="true"
                className="mt-0.5 h-5 w-5 shrink-0 text-success"
              />
              <span className="text-sm leading-6 text-slate-700">
                {feature}
              </span>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href={demoHref}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-secondary px-5 py-3 text-sm font-medium text-white shadow-lg shadow-primary/20"
          >
            Try Demo
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          <Link
            href={caseStudyHref}
            className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-dark transition hover:border-slate-300 hover:bg-slate-50"
          >
            View Case Study
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-400">PlanSight AI</p>
            <p className="font-medium">Portfolio forecast</p>
          </div>
          <span className="rounded-xl bg-emerald-400/15 px-3 py-2 text-sm font-medium text-emerald-300">
            On track
          </span>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          {[
            ["Runway", "14 mo"],
            ["Open risks", "6"],
            ["Saved time", "18h"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-white/[0.06] p-4">
              <p className="text-sm text-slate-400">{label}</p>
              <p className="mt-2 text-2xl font-semibold">{value}</p>
            </div>
          ))}
        </div>

        <div className="mt-4 rounded-2xl bg-white/[0.06] p-4">
          <div className="mb-4 flex items-center justify-between text-sm">
            <span className="text-slate-300">Scenario comparison</span>
            <span className="text-emerald-300">Best fit selected</span>
          </div>
          <div className="space-y-4">
            {[
              ["Conservative", 54],
              ["Balanced", 82],
              ["Aggressive", 67],
            ].map(([label, width]) => (
              <div key={label}>
                <div className="mb-2 flex justify-between text-sm text-slate-400">
                  <span>{label}</span>
                  <span>{width}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-secondary"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </article>
  );
}
