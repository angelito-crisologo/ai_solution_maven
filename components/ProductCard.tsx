import type { ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";

type ProductCardProps = {
  title: string;
  description: string;
  features: string[];
  demoHref: string;
  primaryCtaLabel?: string;
  caseStudyHref?: string;
  preview: ReactNode;
};

export function ProductCard({
  title,
  description,
  features,
  demoHref,
  primaryCtaLabel = "Try for free",
  caseStudyHref,
  preview,
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
            {primaryCtaLabel}
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
          {caseStudyHref && (
            <Link
              href={caseStudyHref}
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-5 py-3 text-sm font-medium text-dark transition hover:border-slate-300 hover:bg-slate-50"
            >
              View Case Study
            </Link>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-slate-950 p-4 text-white">
        {preview}
      </div>
    </article>
  );
}
