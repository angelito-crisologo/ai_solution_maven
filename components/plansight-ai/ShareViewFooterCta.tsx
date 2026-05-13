"use client";

import { ArrowRight, ShieldCheck } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { track } from "@/lib/analytics/gtag";

type Props = {
  shareId: string;
};

/**
 * Footer block on the stakeholder share view. This is the highest-leverage
 * free acquisition surface PlanSight has — every share link puts the product
 * in front of a new viewer, who is often themselves a PM or buyer. The block
 * sits at the bottom (no hijacking the stakeholder's view of the plan) but
 * leads with a clear hook and a primary CTA.
 *
 * Click events flow to GA4 as `cta_clicked` with source `share_view_footer`
 * so attribution survives the redirect.
 */
export function ShareViewFooterCta({ shareId }: Props) {
  const handlePrimaryClick = () => {
    track("cta_clicked", { source: "share_view_footer", target: "product" });
  };

  return (
    <footer className="mt-14 border-t border-slate-200 bg-slate-50">
      <div className="mx-auto max-w-[1200px] px-6 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-4">
            <span
              aria-hidden
              className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-cyan-700"
            >
              <Image
                src="/products/plansight-ai/brand/plansight-monogram-dark.svg"
                alt=""
                width={22}
                height={22}
              />
            </span>
            <div className="min-w-0">
              <p className="text-micro uppercase tracking-wider text-cyan-700">
                Need to share your own project plan?
              </p>
              <h2 className="mt-1 text-h3 text-ink">
                Upload an .mpp file and PlanSight does the rest.
              </h2>
              <p className="mt-1 max-w-xl text-body text-slate-700">
                Critical path, risks, AI-generated summary, and a clean
                stakeholder view — in under a minute. Free, no signup needed.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2 sm:items-end">
            <Link
              href="/products/plansight-ai"
              onClick={handlePrimaryClick}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-cyan-700 px-5 text-body font-semibold text-white transition-colors hover:bg-cyan-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400 focus-visible:ring-offset-2"
            >
              Make your own — free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <span className="inline-flex items-center gap-1.5 text-caption text-slate-500">
              <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
              Your data isn&apos;t training data.
            </span>
          </div>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-5 text-caption text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>
            Built on{" "}
            <Link
              href="/products/plansight-ai"
              onClick={handlePrimaryClick}
              className="font-semibold text-cyan-700 transition hover:text-cyan-800"
            >
              PlanSight AI
            </Link>
            {" "}— an AI-analysed view of any Microsoft Project .mpp file.
          </span>
          <span className="flex flex-wrap items-center gap-3">
            <Link
              href="/products/plansight-ai/legal/privacy"
              className="transition hover:text-slate-700"
            >
              Privacy
            </Link>
            <span className="font-mono text-slate-400">/share/{shareId}</span>
          </span>
        </div>
      </div>
    </footer>
  );
}
