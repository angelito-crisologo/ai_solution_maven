import {
  ArrowRight,
  BrainCircuit,
  CheckCircle2,
  FileUp,
  Layers,
  Rocket,
  ServerCog,
  Share2,
  Sparkles,
} from "lucide-react";
import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { ServiceCard } from "@/components/ServiceCard";
import { ProjectCard } from "@/components/ProjectCard";
import { CTA } from "@/components/CTA";
import { Footer } from "@/components/Footer";

const services = [
  {
    icon: BrainCircuit,
    title: "AI App Development",
    description:
      "Custom AI workflows, assistants, and decision tools built around the way your business actually operates.",
  },
  {
    icon: Layers,
    title: "Web & Mobile Apps",
    description:
      "Clean full-stack products with practical interfaces, reliable data flow, and room to scale.",
  },
  {
    icon: Rocket,
    title: "MVP Development",
    description:
      "Focused product builds that help you validate demand, demo to users, and move faster without excess scope.",
  },
  {
    icon: ServerCog,
    title: "Product Systems",
    description:
      "Internal tools and automation that reduce manual work, clarify decisions, and improve team execution.",
  },
];

const projects = [
  {
    title: "PlanSight AI",
    description:
      "An AI-powered project plan viewer that helps PMs understand schedules, surface risks, and share clear stakeholder views.",
    href: "/projects#plansight-ai",
    tags: ["AI planning", "SaaS", "Project management"],
    bars: [44, 72, 58, 86, 68],
  },
  {
    title: "ScrumReady",
    description:
      "A Scrum Master certification exam prep platform with guided quiz practice and a realistic timed exam simulator.",
    href: "/projects#scrumready",
    tags: ["EdTech", "SaaS", "Exam prep"],
    bars: [68, 82, 55, 90, 74],
  },
];

const reasons = [
  "Builds real products, not only prototypes",
  "Combines AI, full-stack development, and product judgment",
  "Designs for maintainable architecture from the start",
  "Moves fast while keeping the scope practical",
];

const plansightPreview = (
  <>
    <div className="mb-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-400">PlanSight AI</p>
        <p className="font-medium">Imported plan workspace</p>
      </div>
      <span className="rounded-xl bg-emerald-400/15 px-3 py-2 text-sm font-medium text-emerald-300">
        AI analysis live
      </span>
    </div>
    <div className="rounded-xl border border-slate-800 bg-white/[0.04] p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
        Product flow
      </p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {[
          { Icon: FileUp, label: "Upload", text: "Drop in an .mpp file. Parsed into a normalized workspace." },
          { Icon: Sparkles, label: "Analyze", text: "Critical path, RAG status, and a Claude-generated narrative." },
          { Icon: Share2, label: "Share", text: "Send stakeholders a read-only link. No login required." },
        ].map(({ Icon, label, text }) => (
          <div key={label} className="rounded-md border border-slate-800 bg-slate-950 p-4">
            <div className="inline-flex h-10 w-10 items-center justify-center rounded-md bg-slate-800 text-cyan-400">
              <Icon className="h-5 w-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-100">{label}</p>
            <p className="mt-1 text-xs leading-5 text-slate-400">{text}</p>
          </div>
        ))}
      </div>
    </div>
  </>
);

const scrumreadyPreview = (
  <>
    <div className="mb-4 flex items-center justify-between">
      <div>
        <p className="text-sm text-slate-400">ScrumReady</p>
        <p className="font-medium">Quiz Mode — QB 01</p>
      </div>
      <span className="rounded-xl bg-emerald-400/15 px-3 py-2 text-sm font-medium text-emerald-300">
        3 correct in a row
      </span>
    </div>
    <div className="rounded-xl border border-slate-800 bg-white/[0.04] p-4">
      <p className="mb-1 text-xs text-slate-500">Question 7 of 20 · Single select</p>
      <p className="text-sm font-medium text-slate-200">
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
  </>
);

export default function Home() {
  return (
    <main className="min-h-screen bg-light">
      <section className="bg-dark text-white">
        <Navbar />
        <Hero />
      </section>

      <section id="products" className="px-6 py-20">
        <div className="mx-auto max-w-[1200px] space-y-8">
          <ProductCard
            title="PlanSight AI"
            description="Upload an MS Project plan, get an AI-generated analysis, and share a clean read-only view with stakeholders — all in the browser. Built for PMs who need their plans understood without forcing recipients to install MS Project."
            features={[
              "Import .mpp files or MS Project XML exports and view an interactive task table and Gantt chart.",
              "Get deterministic PMP-aligned insights — critical path, late tasks, at-risk work — plus a Claude-generated AI analysis.",
              "Share a public read-only stakeholder link with no login required.",
            ]}
            demoHref="https://plansight.aisolutionmaven.com"
            caseStudyHref="/projects#plansight-ai"
            preview={plansightPreview}
          />
          <ProductCard
            title="ScrumReady"
            description="Scrum Master certification exam prep for CSM and PSM I candidates. Combines a guided quiz mode with instant rationale explanations and a realistic timed exam simulator — so you build genuine knowledge, not just pattern memory."
            features={[
              "Six thematic quiz banks aligned with the Scrum Guide 2020, with instant feedback and rationale on every answer.",
              "A full exam simulator that mirrors real conditions — countdown timer, free navigation, mark for review — no feedback until you submit.",
              "Track your Readiness Score across sessions and review every past attempt with full answer explanations.",
            ]}
            demoHref="https://scrumready.aisolutionmaven.com"
            caseStudyHref="/projects#scrumready"
            primaryCtaLabel="Start for free"
            preview={scrumreadyPreview}
          />
        </div>
      </section>

      <section id="services" className="border-y border-slate-200 bg-white px-6 py-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              Services
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-dark md:text-4xl">
              Practical builds for teams that need working software
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              I focus on products that create clear business value: better
              decisions, less manual work, and smoother customer experiences.
            </p>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {services.map((service) => (
              <ServiceCard key={service.title} {...service} />
            ))}
          </div>
        </div>
      </section>

      <section id="work" className="px-6 py-20">
        <div className="mx-auto max-w-[1200px]">
          <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold uppercase tracking-normal text-primary">
                Projects
              </p>
              <h2 className="mt-3 text-3xl font-semibold leading-tight text-dark md:text-4xl">
                Product work with real business context
              </h2>
            </div>
            <p className="max-w-md text-base leading-7 text-slate-600">
              Each project is shaped around the problem, the user workflow, and
              the outcome the software needs to support.
            </p>
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {projects.map((project) => (
              <ProjectCard key={project.title} {...project} />
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-20">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              Why choose me
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-dark md:text-4xl">
              I build with the product goal in view
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The work is not just about adding AI. It is about building useful
              software that fits the decision, workflow, and customer experience
              around it.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {reasons.map((reason) => (
              <div
                key={reason}
                className="flex min-h-28 items-start gap-4 rounded-2xl border border-slate-200 bg-light p-5"
              >
                <CheckCircle2
                  aria-hidden="true"
                  className="mt-0.5 h-5 w-5 shrink-0 text-success"
                />
                <p className="text-base font-medium leading-7 text-dark">
                  {reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-slate-200 px-6 py-20">
        <div className="mx-auto grid max-w-[1200px] gap-6 md:grid-cols-3">
          {[
            ["01", "Clarify the workflow"],
            ["02", "Build the smallest useful product"],
            ["03", "Improve from real user feedback"],
          ].map(([step, label]) => (
            <div key={step} className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-5 grid h-12 w-12 place-items-center rounded-xl bg-slate-100 text-sm font-semibold text-primary">
                {step}
              </div>
              <h3 className="text-xl font-semibold text-dark">{label}</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                A focused process keeps the build moving and prevents unnecessary
                complexity from taking over the product.
              </p>
            </div>
          ))}
        </div>
      </section>

      <CTA />
      <Footer />
    </main>
  );
}
