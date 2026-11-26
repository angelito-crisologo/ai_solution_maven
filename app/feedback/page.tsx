import type { Metadata } from "next";
import { FeedbackForm } from "@/components/FeedbackForm";
import { h1Class, h2Class } from "@/lib/ui";

/**
 * Product feedback form, mainly opened from PlanSight AI with page context in
 * the query string. It writes to Supabase through /api/feedback. Kept
 * working, but not in the navigation or sitemap, and not indexed.
 */
export const metadata: Metadata = {
  title: { absolute: "Feedback | AI Solution Maven" },
  description:
    "Share feedback, feature requests, and bug reports for AI Solution Maven and PlanSight AI.",
  alternates: { canonical: "/feedback" },
  robots: { index: false, follow: true },
};

type SearchParams = Record<string, string | string[] | undefined>;

function firstValue(value: string | string[] | undefined) {
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }

  return value ?? "";
}

export default function FeedbackPage({
  searchParams,
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
    <>
      <section className="px-gutter pb-[clamp(40px,5vw,64px)] pt-[clamp(40px,6vw,80px)]">
        <div className="mx-auto flex max-w-content flex-col gap-5">
          <h1 className={h1Class}>Send a comment, bug report, or feature request</h1>
          <p className="m-0 max-w-[60ch] text-lead">
            Use this form to report an issue, suggest a feature, or leave product feedback.
            If you want a reply, add your email address.
          </p>
        </div>
      </section>

      <section className="bg-surface px-gutter py-section">
        <div className="mx-auto grid max-w-content grid-cols-1 gap-stack nav:grid-cols-[0.75fr_1.25fr]">
          <div className="flex flex-col gap-4">
            <h2 className={h2Class}>Tell me what needs to change</h2>
            <p className="m-0">
              Feedback and comments are welcome and will be reviewed. Issues will be reviewed
              and fixed as soon as possible. Feature requests will be reviewed, prioritised and
              scheduled for implementation.
            </p>
            <p className="m-0">
              If you opened this from a plan or stakeholder view, the page context is passed
              through automatically.
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
    </>
  );
}
