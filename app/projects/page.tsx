import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ProjectCard } from "@/components/ProjectCard";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Explore AI Solution Maven product work — PlanSight AI for project plan analysis and ScrumReady for Scrum certification exam prep.",
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    title: "Projects | AI Solution Maven",
    description:
      "Explore AI Solution Maven product work — PlanSight AI for project plan analysis and ScrumReady for Scrum certification exam prep.",
    url: "/projects",
  },
};

const projects = [
  {
    id: "plansight-ai",
    title: "PlanSight AI",
    description:
      "An AI-powered project plan viewer that helps PMs understand schedules, surface risks, and share clear stakeholder views — all in the browser.",
    href: "https://plansight.aisolutionmaven.com",
    tags: ["AI planning", "SaaS", "Project management"],
    bars: [44, 72, 58, 86, 68],
    problem:
      "Project managers need to communicate complex schedules to stakeholders who don't have MS Project installed and can't interpret raw .mpp files.",
    solution:
      "PlanSight AI parses .mpp files and XML exports in the browser, surfaces the critical path and at-risk tasks, generates a Claude-powered AI analysis, and produces a shareable read-only stakeholder view.",
    outcome:
      "PMs can go from import to stakeholder-ready in minutes, with a clean share link that requires no login or software installation to open.",
  },
  {
    id: "scrumready",
    title: "ScrumReady",
    description:
      "A Scrum Master certification exam prep platform with guided quiz practice and a realistic timed exam simulator for CSM and PSM I candidates.",
    href: "https://scrumready.aisolutionmaven.com",
    tags: ["EdTech", "SaaS", "Exam prep"],
    bars: [68, 82, 55, 90, 74],
    problem:
      "CSM and PSM I candidates struggle to find focused, realistic exam prep that explains the why behind each answer rather than just drilling pattern recall.",
    solution:
      "ScrumReady combines a thematic quiz mode with instant rationale explanations and a full exam simulator that mirrors real conditions — timed, free navigation, no feedback until submission.",
    outcome:
      "Candidates build genuine Scrum knowledge through deliberate practice, track their Readiness Score across sessions, and enter their exam with confidence.",
  },
];

export default function ProjectsPage() {
  return (
    <main className="min-h-screen bg-light">
      <section className="bg-dark text-white">
        <Navbar />
        <div className="mx-auto max-w-[1200px] px-6 py-16 lg:py-20">
          <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
            Projects
          </p>
          <h1 className="mt-3 max-w-3xl text-[40px] font-bold leading-[1.12] tracking-normal md:text-[48px]">
            Product work shaped around real workflows
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
            Each project starts with the problem, then narrows toward software
            that is useful, maintainable, and ready for actual users.
          </p>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-[1200px] gap-6 lg:grid-cols-2">
          {projects.map((project) => (
            <ProjectCard key={project.title} {...project} />
          ))}
        </div>
      </section>

      <section className="border-y border-slate-200 bg-white px-6 py-20">
        <div className="mx-auto grid max-w-[1200px] gap-8">
          {projects.map((project) => (
            <article
              key={project.id}
              id={project.id}
              className="grid gap-6 rounded-2xl border border-slate-200 bg-light p-6 md:grid-cols-[0.7fr_1.3fr] md:p-8"
            >
              <div>
                <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                  Case study
                </p>
                <h2 className="mt-3 text-2xl font-semibold text-dark">
                  {project.title}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  {project.description}
                </p>
                <a
                  href={project.href}
                  className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
                >
                  Open product
                  <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </a>
              </div>
              <div className="grid gap-4">
                {[
                  ["Problem", project.problem],
                  ["Solution", project.solution],
                  ["Outcome", project.outcome],
                ].map(([label, text]) => (
                  <div key={label} className="flex items-start gap-3">
                    <CheckCircle2
                      aria-hidden="true"
                      className="mt-0.5 h-5 w-5 shrink-0 text-success"
                    />
                    <div>
                      <h3 className="font-semibold text-dark">{label}</h3>
                      <p className="mt-1 text-sm leading-6 text-slate-600">
                        {text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-6 rounded-2xl border border-slate-200 bg-dark p-8 text-white shadow-soft md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-2xl font-semibold">
              Have a product workflow that needs this level of clarity?
            </h2>
            <p className="mt-3 text-base leading-7 text-slate-300">
              Send the problem and the outcome you want. I will help scope the
              most useful first build.
            </p>
          </div>
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-medium text-dark transition hover:bg-slate-100"
          >
            Contact
            <ArrowRight aria-hidden="true" className="h-5 w-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </main>
  );
}
