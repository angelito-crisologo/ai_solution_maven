import {
  BrainCircuit,
  CheckCircle2,
  Layers,
  Rocket,
  ServerCog,
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
      "An AI planning product that helps teams compare scenarios, surface risk, and choose a clearer path forward.",
    href: "/projects#plansight-ai",
    tags: ["AI planning", "SaaS", "Decision support"],
    bars: [44, 72, 58, 86, 68],
  },
  {
    title: "Appointment System",
    description:
      "A booking workflow designed to reduce scheduling friction and give teams a cleaner operational view.",
    href: "/projects#appointment-system",
    tags: ["Scheduling", "Workflow", "Operations"],
    bars: [62, 48, 74, 56, 88],
  },
  {
    title: "My Vet Buddy",
    description:
      "A pet-care product concept focused on helping owners track care, prepare visits, and manage follow-ups.",
    href: "/projects#my-vet-buddy",
    tags: ["Mobile app", "Health records", "Care flow"],
    bars: [52, 66, 45, 78, 70],
  },
];

const reasons = [
  "Builds real products, not only prototypes",
  "Combines AI, full-stack development, and product judgment",
  "Designs for maintainable architecture from the start",
  "Moves fast while keeping the scope practical",
];

export default function Home() {
  return (
    <main className="min-h-screen bg-light">
      <section className="bg-dark text-white">
        <Navbar />
        <Hero />
      </section>

      <section id="products" className="px-6 py-20">
        <div className="mx-auto max-w-[1200px]">
          <ProductCard
            title="PlanSight AI"
            description="PlanSight AI helps teams turn uncertain plans into clearer decisions. It models scenarios, highlights risk, and gives leaders a practical view of what is likely to happen next."
            features={[
              "Compare delivery, budget, and resource scenarios before committing.",
              "Surface risks early so teams can adjust plans with less guesswork.",
              "Keep decisions, assumptions, and outcomes visible in one product workflow.",
            ]}
            demoHref="/products#plansight-ai"
            caseStudyHref="/projects#plansight-ai"
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

          <div className="mt-10 grid gap-6 lg:grid-cols-3">
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
