import Link from "next/link";
import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  Layers,
  Rocket,
  Sparkles,
} from "lucide-react";

const capabilities = [
  {
    icon: BrainCircuit,
    title: "AI app development",
    outcome:
      "Claude-powered features, decision tools, and assistants — wired to a real workflow, not a demo.",
  },
  {
    icon: Layers,
    title: "Full-stack builds",
    outcome:
      "Next.js / TypeScript / Postgres products with clean data flow and room to grow into something paid.",
  },
  {
    icon: Rocket,
    title: "MVP & validation",
    outcome:
      "Focused builds that ship in weeks so you can put real software in front of real users fast.",
  },
];

export function Hero() {
  return (
    <div className="relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_78%_18%,rgba(124,58,237,0.28),transparent_34%),radial-gradient(circle_at_20%_12%,rgba(37,99,235,0.22),transparent_30%)]" />
      <div className="relative mx-auto grid min-h-[calc(100vh-80px)] max-w-[1200px] items-center gap-12 px-6 py-16 lg:grid-cols-[1fr_0.92fr] lg:py-20">
        <div className="max-w-2xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200">
            <Sparkles aria-hidden="true" className="h-4 w-4 text-success" />
            Building AI-powered solutions that solve real problems
          </div>

          <h1 className="text-[40px] font-bold leading-[1.12] tracking-normal text-white sm:text-5xl lg:text-[48px]">
            I Build AI-Powered Apps That Solve Real Business Problems
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
            I design and build practical AI products for teams that need better
            decisions, cleaner workflows, and software they can use from day one.
          </p>

          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Link
              href="#work"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-secondary px-6 py-3 text-base font-medium text-white shadow-lg shadow-primary/25 transition hover:scale-[1.01]"
            >
              View My Work
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl border border-white/10 px-6 py-3 text-base font-medium text-white transition hover:border-white/25 hover:bg-white/5"
            >
              Hire Me
            </Link>
          </div>

          <div className="mt-10 grid gap-4 text-sm text-slate-300 sm:grid-cols-3">
            {["AI apps", "Full-stack builds", "MVP delivery"].map((item) => (
              <div key={item} className="flex items-center gap-2">
                <CheckCircle2
                  aria-hidden="true"
                  className="h-4 w-4 shrink-0 text-success"
                />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-[28px] bg-gradient-to-br from-primary/35 to-secondary/35 blur-2xl" />
          <div className="relative rounded-2xl border border-white/10 bg-white/[0.08] p-4 shadow-soft backdrop-blur">
            <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-5">
              <div className="mb-6 flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">What I build</p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">
                    AI products that ship and stay shipped
                  </h2>
                </div>
                <span className="inline-flex items-center gap-2 rounded-xl bg-emerald-400/10 px-3 py-2 text-sm font-medium text-emerald-300">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                  </span>
                  Available
                </span>
              </div>

              <div className="space-y-3">
                {capabilities.map((capability) => (
                  <div
                    key={capability.title}
                    className="rounded-2xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-white">
                        <capability.icon
                          aria-hidden="true"
                          className="h-5 w-5"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-white">{capability.title}</p>
                        <p className="mt-1 text-sm leading-6 text-slate-300">
                          {capability.outcome}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex flex-col gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-400">Currently shipping</p>
                  <p className="mt-1 font-medium text-white">PlanSight AI</p>
                </div>
                <Link
                  href="/products/plansight-ai"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm font-medium text-white transition hover:bg-white/[0.1]"
                >
                  See it live
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
