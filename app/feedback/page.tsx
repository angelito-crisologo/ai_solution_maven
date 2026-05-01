import type { Metadata } from "next";
import { CheckCircle2, Mail, MessageSquare, TriangleAlert } from "lucide-react";
import { FeedbackForm } from "@/components/FeedbackForm";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";

export const metadata: Metadata = {
  title: "Feedback",
  description:
    "Share feedback, feature requests, and bug reports for AI Solution Maven and PlanSight AI.",
  alternates: {
    canonical: "/feedback"
  },
  openGraph: {
    title: "Feedback | AI Solution Maven",
    description:
      "Share feedback, feature requests, and bug reports for AI Solution Maven and PlanSight AI.",
    url: "/feedback"
  }
};

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default function FeedbackPage({
  searchParams
}: {
  searchParams?: SearchParams;
}) {
  const product = firstValue(searchParams?.product) || "AI Solution Maven";
  const pagePath = firstValue(searchParams?.pagePath) || "/feedback";
  const pageUrl = firstValue(searchParams?.pageUrl);
  const shareId = firstValue(searchParams?.shareId);
  const planTitle = firstValue(searchParams?.planTitle);
  const sourceContext = firstValue(searchParams?.source) || "feedback page";
  const defaultType = firstValue(searchParams?.type) as
    | "general_feedback"
    | "feature_request"
    | "bug_report"
    | "";

  return (
    <main className="min-h-screen bg-light">
      <section className="bg-dark text-white">
        <Navbar />
        <div className="mx-auto grid max-w-[1200px] gap-10 px-6 py-16 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-20">
          <div>
            <p className="text-sm font-semibold uppercase tracking-normal text-emerald-300">
              Feedback
            </p>
            <h1 className="mt-3 text-[40px] font-bold leading-[1.12] tracking-normal text-white md:text-[48px]">
              Send a comment, bug report, or feature request
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-slate-300">
              Use this form to report an issue, suggest a feature, or leave product feedback.
              If you want a reply, add your email address.
            </p>

            <div className="mt-8 grid gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-success" />
                <span className="text-base text-slate-200">General feedback and comments</span>
              </div>
              <div className="flex items-start gap-3">
                <TriangleAlert aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
                <span className="text-base text-slate-200">Bug reports with context and severity</span>
              </div>
              <div className="flex items-start gap-3">
                <MessageSquare aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                <span className="text-base text-slate-200">Feature requests and product ideas</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4 rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur">
            <div className="flex items-start gap-4 rounded-xl bg-white/[0.06] p-4">
              <Mail aria-hidden="true" className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-white">What gets captured</p>
                <p className="mt-1 text-sm text-slate-300">
                  The form saves the type, subject, details, page context, and optional contact
                  details directly to Supabase.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-xl bg-white/[0.06] p-4">
              <MessageSquare aria-hidden="true" className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-white">Best details to include</p>
                <p className="mt-1 text-sm text-slate-300">
                  What happened, what you expected, and where it happened are the most useful.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-xl bg-white/[0.06] p-4">
              <CheckCircle2 aria-hidden="true" className="mt-1 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium text-white">Context from PlanSight</p>
                <p className="mt-1 text-sm text-slate-300">
                  If you opened this from a plan or stakeholder view, the page context is passed
                  through automatically.
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
              Public feedback form
            </p>
            <h2 className="mt-3 text-3xl font-semibold leading-tight text-dark md:text-4xl">
              Tell me what needs to change
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Feedback and comments are welcome and will be reviewed. Issues will be reviewed
              and fixed as soon as possible. Feature requests will be reviewed, prioritized, and
              scheduled for implementation.
            </p>
          </div>

          <FeedbackForm
            defaultType={
              defaultType === "feature_request" || defaultType === "bug_report"
                ? defaultType
                : "general_feedback"
            }
            product={product}
            pagePath={pagePath}
            pageUrl={pageUrl}
            shareId={shareId}
            planTitle={planTitle}
            sourceContext={sourceContext}
          />
        </div>
      </section>

      <Footer />
    </main>
  );
}
