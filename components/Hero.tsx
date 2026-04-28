import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Gauge,
  LineChart,
  Sparkles,
} from "lucide-react";

const metrics = [
  { label: "Forecast confidence", value: "92%" },
  { label: "Plan risk", value: "Low" },
  { label: "Decisions tracked", value: "128" },
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
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-slate-400">
                    Featured product
                  </p>
                  <h2 className="mt-1 text-2xl font-semibold text-white">
                    PlanSight AI
                  </h2>
                </div>
                <div className="rounded-xl bg-success/15 px-3 py-2 text-sm font-medium text-emerald-300">
                  Live preview
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                {metrics.map((metric) => (
                  <div
                    key={metric.label}
                    className="rounded-xl border border-white/10 bg-white/[0.04] p-4"
                  >
                    <p className="text-sm text-slate-400">{metric.label}</p>
                    <p className="mt-2 text-2xl font-semibold text-white">
                      {metric.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-400">Scenario model</p>
                    <p className="font-medium text-white">Q3 delivery plan</p>
                  </div>
                  <Gauge aria-hidden="true" className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-3">
                  {[76, 58, 89].map((width, index) => (
                    <div key={width}>
                      <div className="mb-2 flex justify-between text-sm text-slate-400">
                        <span>
                          {["Resource fit", "Schedule risk", "Outcome score"][index]}
                        </span>
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

              <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto]">
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-4 flex items-center gap-2 text-sm font-medium text-slate-300">
                    <LineChart aria-hidden="true" className="h-4 w-4" />
                    Decision timeline
                  </div>
                  <div className="flex h-24 items-end gap-2">
                    {[42, 62, 48, 72, 55, 86, 74].map((height) => (
                      <div
                        key={height}
                        className="flex-1 rounded-t-lg bg-gradient-to-t from-primary to-secondary"
                        style={{ height: `${height}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex min-w-32 flex-col justify-between rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-sm text-slate-400">Next action</p>
                  <p className="mt-3 text-lg font-semibold text-white">
                    Approve revised plan
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
