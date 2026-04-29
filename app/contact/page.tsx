import type { Metadata } from "next";
import { CheckCircle2, Clock, Mail, MessageSquare } from "lucide-react";
import { ContactForm } from "@/components/ContactForm";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contact AI Solution Maven to discuss AI app development, MVPs, internal tools, and practical product builds.",
  alternates: {
    canonical: "/contact",
  },
  openGraph: {
    title: "Contact | AI Solution Maven",
    description:
      "Contact AI Solution Maven to discuss AI app development, MVPs, internal tools, and practical product builds.",
    url: "/contact",
  },
};

const highlights = [
  "AI app and MVP builds",
  "Full-stack web and mobile products",
  "Internal tools and workflow automation",
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-light">
      <section className="bg-dark text-white">
        <Navbar />
        <div className="mx-auto grid max-w-[1200px] gap-10 px-6 py-16 lg:grid-cols-[0.85fr_1.15fr] lg:items-center lg:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
              Contact
            </p>
            <h1 className="mt-3 text-[40px] font-bold leading-[1.12] tracking-normal text-white md:text-[48px]">
              Tell me what you want to build
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Share the workflow, product idea, or business problem. I will use
              that context to suggest a practical next step.
            </p>

            <div className="mt-8 grid gap-4">
              {highlights.map((highlight) => (
                <div key={highlight} className="flex items-start gap-3">
                  <CheckCircle2
                    aria-hidden="true"
                    className="mt-0.5 h-5 w-5 shrink-0 text-success"
                  />
                  <span className="text-base text-slate-200">{highlight}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
            <div className="flex items-start gap-4 rounded-xl bg-white/[0.06] p-4">
              <Mail aria-hidden="true" className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-white">Email</p>
                <p className="mt-1 text-sm text-slate-300">
                  hello@aisolutionmaven.com
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-xl bg-white/[0.06] p-4">
              <Clock aria-hidden="true" className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-white">Typical response</p>
                <p className="mt-1 text-sm text-slate-300">
                  Within 1-2 business days
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-xl bg-white/[0.06] p-4">
              <MessageSquare
                aria-hidden="true"
                className="mt-1 h-5 w-5 text-primary"
              />
              <div>
                <p className="font-medium text-white">Best first message</p>
                <p className="mt-1 text-sm text-slate-300">
                  Include the problem, users, timeline, and what success looks
                  like.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-20">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-primary">
              Project enquiry
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-dark md:text-4xl">
              Keep it simple and specific
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              The form sends messages directly from the site. Once your sender
              and inbox settings are configured, enquiries will arrive in your
              business email without relying on the visitor’s mail app.
            </p>
          </div>

          <ContactForm />
        </div>
      </section>

      <Footer />
    </main>
  );
}
