import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ProjectCard } from "@/components/ProjectCard";

export const metadata: Metadata = {
  title: "Projects",
  description:
    "Explore AI Solution Maven project work across AI products, booking workflows, and mobile app concepts.",
  alternates: {
    canonical: "/projects",
  },
  openGraph: {
    title: "Projects | AI Solution Maven",
    description:
      "Explore AI Solution Maven project work across AI products, booking workflows, and mobile app concepts.",
    url: "/projects",
  },
};

const projects = [
  {
    id: "plansight-ai",
    title: "PlanSight AI",
    description:
      "An AI planning product that helps teams compare scenarios, surface risk, and choose a clearer path forward.",
    href: "/contact",
    tags: ["AI planning", "SaaS", "Decision support"],
    bars: [44, 72, 58, 86, 68],
    problem: "Teams often commit to plans without a clear view of risk, capacity, or downstream tradeoffs.",
    solution:
      "PlanSight AI creates a practical decision layer where scenarios, assumptions, and next actions can be compared before the team commits.",
    outcome:
      "A clearer planning workflow that helps leaders act earlier and communicate decisions with more confidence.",
  },
  {
    id: "appointment-system",
    title: "Appointment System",
    description:
      "A booking workflow designed to reduce scheduling friction and give teams a cleaner operational view.",
    href: "/contact",
    tags: ["Scheduling", "Workflow", "Operations"],
    bars: [62, 48, 74, 56, 88],
    problem: "Manual booking creates avoidable admin work and makes it harder to understand availability.",
    solution:
      "A focused appointment flow gives customers a simpler booking path and gives operators a cleaner schedule view.",
    outcome:
      "Less manual coordination, fewer missed details, and a workflow that is easier to manage day to day.",
  },
  {
    id: "my-vet-buddy",
    title: "My Vet Buddy",
    description:
      "A pet-care product concept focused on helping owners track care, prepare visits, and manage follow-ups.",
    href: "/contact",
    tags: ["Mobile app", "Health records", "Care flow"],
    bars: [52, 66, 45, 78, 70],
    problem: "Pet owners often manage care details across memory, messages, paper notes, and vet follow-ups.",
    solution:
      "A mobile-first care record brings visit prep, reminders, and care history into one practical experience.",
    outcome:
      "A clearer care journey for owners and better prepared conversations with veterinary teams.",
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
        <div className="mx-auto grid max-w-[1200px] gap-6 lg:grid-cols-3">
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
