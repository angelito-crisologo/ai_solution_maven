import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, Clock, BarChart2 } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: {
    absolute: "Scrum Master certification exam prep — ScrumReady",
  },
  description:
    "Prepare for the CSM and PSM I exams with ScrumReady. Six quiz banks aligned with the Scrum Guide 2020, a realistic timed exam simulator, and instant rationale on every answer. Free to start.",
  keywords: [
    "CSM exam prep",
    "PSM I practice exam",
    "Scrum Master certification study",
    "Certified ScrumMaster practice questions",
    "Professional Scrum Master I quiz",
    "Scrum Guide 2020 questions",
    "Scrum exam simulator",
  ],
  alternates: {
    canonical: "/products/scrumready",
  },
  openGraph: {
    title: "Scrum Master certification exam prep — ScrumReady",
    description:
      "Prepare for the CSM and PSM I exams with guided quiz practice, instant rationale explanations, and a realistic timed exam simulator.",
    url: "/products/scrumready",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scrum Master certification exam prep — ScrumReady",
    description:
      "Prepare for the CSM and PSM I exams with guided quiz practice, instant rationale explanations, and a realistic timed exam simulator.",
  },
};

const features = [
  {
    icon: BookOpen,
    title: "Quiz Mode — Agile Launchpad",
    description:
      "Six thematic banks covering the Scrum Guide 2020 — Theory, Framework, Team, Events, Artifacts, and Advanced Scenarios. 20 random questions per session with instant feedback and a rationale card explaining the why behind every answer.",
  },
  {
    icon: Clock,
    title: "Exam Simulator — Quiet Sprint",
    description:
      "A full timed simulation that mirrors the real exam: countdown timer, free navigation between questions, mark for review, and no correctness feedback until you submit. Available for CSM (50 questions, 74% pass) and PSM I (80 questions, 85% pass).",
  },
  {
    icon: BarChart2,
    title: "Progress tracking",
    description:
      "Every session is saved to your account. Track your Readiness Score across attempts, review past simulations with full answer explanations, and use the Incorrect tab to work through exactly what you missed.",
  },
];

const certifications = [
  {
    name: "CSM — Certified ScrumMaster",
    body: "Scrum Alliance",
    questions: "50",
    time: "60 min",
    passing: "74%",
  },
  {
    name: "PSM I — Professional Scrum Master I",
    body: "Scrum.org",
    questions: "80",
    time: "60 min",
    passing: "85%",
  },
];

export default function ScrumReadyPage() {
  return (
    <main className="min-h-screen bg-light">
      <section className="bg-dark text-white">
        <Navbar />
        <div className="mx-auto grid max-w-[1200px] gap-10 px-6 py-14 lg:grid-cols-2 lg:items-center lg:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
              ScrumReady
            </p>
            <h1 className="mt-3 text-[40px] font-bold leading-[1.12] tracking-normal md:text-[48px]">
              Sprint toward certification.
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Exam prep for the CSM and PSM I — built around short, focused
              practice sessions with clear feedback and a concrete definition
              of done: passing your exam.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href="https://scrumready.aisolutionmaven.com"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-secondary px-6 py-3 text-base font-medium text-white shadow-lg shadow-primary/20"
              >
                Start for free
                <ArrowRight aria-hidden="true" className="h-5 w-5" />
              </a>
              <Link
                href="/projects#scrumready"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 px-6 py-3 text-base font-medium text-white transition hover:border-white/25 hover:bg-white/5"
              >
                View case study
              </Link>
            </div>
            <p className="mt-6 text-xs text-slate-400">
              Free — no credit card required. QB 00, QB 01, QB 02, and SIM 01 are free forever.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-700 bg-slate-950 p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">Quiz Mode — QB 01</p>
                <p className="text-sm font-medium text-slate-100">Scrum Theory &amp; Framework</p>
              </div>
              <span className="rounded-lg bg-emerald-400/15 px-2.5 py-1.5 text-xs font-medium text-emerald-300">
                3 correct in a row
              </span>
            </div>
            <div className="rounded-xl border border-slate-800 bg-white/[0.04] p-4">
              <p className="mb-1 text-xs text-slate-500">Question 7 of 20 · Single select</p>
              <p className="text-sm font-medium leading-6 text-slate-200">
                Who is responsible for managing the Product Backlog in Scrum?
              </p>
              <div className="mt-3 grid gap-2">
                {["The Scrum Master", "The Product Owner", "The Developers", "The Stakeholders"].map(
                  (opt, i) => (
                    <div
                      key={opt}
                      className={
                        i === 1
                          ? "rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-2 text-xs text-emerald-300"
                          : "rounded-lg bg-white/[0.05] px-3 py-2 text-xs text-slate-400"
                      }
                    >
                      {opt}
                    </div>
                  )
                )}
              </div>
              <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-3">
                <p className="text-xs font-semibold text-emerald-400">Key Scrum idea</p>
                <p className="mt-1 text-xs leading-5 text-slate-300">
                  The Product Owner owns and orders the Product Backlog to best achieve the product goal.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              Certifications covered
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-dark md:text-4xl">
              One platform, two certifications
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              ScrumReady prepares you for both major Scrum Master credentials. The
              question content overlaps significantly — preparing for one puts you
              ahead on the other.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            {certifications.map((cert) => (
              <div
                key={cert.name}
                className="rounded-2xl border border-slate-200 bg-white p-6"
              >
                <p className="text-sm font-semibold text-primary">{cert.body}</p>
                <h3 className="mt-2 text-xl font-semibold text-dark">{cert.name}</h3>
                <div className="mt-4 grid grid-cols-3 gap-4 border-t border-slate-100 pt-4">
                  {[
                    ["Questions", cert.questions],
                    ["Time limit", cert.time],
                    ["Passing score", cert.passing],
                  ].map(([label, value]) => (
                    <div key={label}>
                      <p className="text-xs text-slate-500">{label}</p>
                      <p className="mt-1 text-lg font-semibold text-dark">{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-6 py-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              How it works
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-dark md:text-4xl">
              Quiz mode teaches. Simulator mode tests.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Build understanding in quiz mode, validate it under pressure in the
              simulator. A Readiness Score of 85% or higher signals you are ready
              to run a full simulation.
            </p>
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
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              Free content included
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-dark md:text-4xl">
              Start without a credit card
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The free tier includes enough content to begin a meaningful study
              plan — three quiz banks and the baseline exam simulation.
            </p>
          </div>
          <div className="mt-10 grid gap-3 md:grid-cols-2">
            {[
              { label: "QB 00 — Scrum &amp; Agile (Agile Manifesto)", free: true },
              { label: "QB 01 — Scrum Theory &amp; Framework", free: true },
              { label: "QB 02 — The Scrum Team", free: true },
              { label: "QB 03 — Scrum Events", free: false },
              { label: "QB 04 — Artifacts &amp; Commitments", free: false },
              { label: "QB 05 — Advanced Scenarios", free: false },
              { label: "SIM 01 — Baseline simulation", free: true },
              { label: "SIM 02 — Refinement simulation", free: false },
              { label: "SIM 03 — Advanced Scrum Mastery", free: false },
            ].map(({ label, free }) => (
              <div
                key={label}
                className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3"
              >
                <CheckCircle2
                  aria-hidden="true"
                  className={`h-5 w-5 shrink-0 ${free ? "text-success" : "text-slate-300"}`}
                />
                <span
                  className="text-sm text-slate-700"
                  dangerouslySetInnerHTML={{ __html: label }}
                />
                {!free && (
                  <span className="ml-auto rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-500">
                    Premium
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 rounded-2xl border border-slate-200 bg-white p-8 shadow-soft md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-dark">
              Ready to start your certification prep?
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-600">
              Create a free account and start with QB 01. No credit card required.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row md:shrink-0">
            <a
              href="https://scrumready.aisolutionmaven.com"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-secondary px-6 py-3 text-base font-medium text-white shadow-lg shadow-primary/20"
            >
              Start for free
              <ArrowRight aria-hidden="true" className="h-5 w-5" />
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl border border-slate-200 px-6 py-3 text-base font-medium text-dark transition hover:border-slate-300 hover:bg-slate-50"
            >
              Get in touch
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
