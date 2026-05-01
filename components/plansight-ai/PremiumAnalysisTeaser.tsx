"use client";

import { BrainCircuit, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";

const premiumFeatures = [
  "Delay simulation",
  "Risk detection",
  "Prioritization",
  "Recommendations",
  "Natural language Q&A"
];

type Props = {
  className?: string;
};

export function PremiumAnalysisTeaser({ className = "" }: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`group w-full rounded-3xl border border-slate-200 bg-white p-6 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg ${className}`.trim()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-dark text-white">
            <BrainCircuit className="h-6 w-6" />
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-normal text-amber-800">
              Premium analysis
            </span>
            <span className="rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-normal text-sky-700">
              Coming soon
            </span>
          </div>
        </div>

        <div className="mt-5">
          <p className="text-sm font-semibold uppercase tracking-normal text-primary">
            AI Analysis
          </p>
          <h3 className="mt-2 text-2xl font-semibold text-dark md:text-[28px]">
            Click to see the deeper analysis layer
          </h3>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Deterministic insights are available now. A paid AI tier will add richer schedule
            commentary, what-if analysis, and stakeholder-ready recommendations. Coming soon.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {premiumFeatures.map((feature) => (
            <div
              key={feature}
              className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-dark"
            >
              <span>{feature}</span>
              <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5" />
            </div>
          ))}
        </div>
      </button>

      {open ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-3xl rounded-3xl border border-white/10 bg-dark p-6 text-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
                  Paid AI Analysis
                </p>
                <div className="mt-2 flex items-center gap-3">
                  <h3 className="text-2xl font-semibold">What deeper analysis can add</h3>
                  <span className="rounded-full border border-white/15 bg-white/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-normal text-amber-200">
                    Coming soon
                  </span>
                </div>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                  This premium layer will turn the deterministic project facts into narrative
                  guidance for PMs and stakeholders.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white transition hover:bg-white/10"
                aria-label="Close AI analysis preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              {premiumFeatures.map((feature) => (
                <div key={feature} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <p className="text-sm font-semibold text-white">{feature}</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    {feature === "Delay simulation"
                      ? "Explore how slipping one task changes downstream timing."
                      : feature === "Risk detection"
                        ? "Highlight patterns that are likely to affect delivery before they happen."
                        : feature === "Prioritization"
                          ? "Rank the tasks that deserve attention first."
                          : feature === "Recommendations"
                            ? "Turn schedule facts into practical next-step suggestions."
                            : "Ask questions about the plan in plain language and get a direct answer."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
