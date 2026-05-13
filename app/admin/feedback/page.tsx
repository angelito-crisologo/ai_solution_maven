import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import {
  listFeedbackForProduct,
  parseFeedbackFilter
} from "@/lib/feedback/queries";
import { FeedbackTable } from "@/components/admin/FeedbackTable";
import { FeedbackFilters } from "@/components/admin/FeedbackFilters";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AISM feedback · Admin",
  description: "General AI Solution Maven feedback (non-product).",
  robots: { index: false, follow: false }
};

// "AI Solution Maven" is the schema default — every submission that
// doesn't explicitly carry a product tag lands here. Per-product
// feedback (currently just PlanSight) is filtered into its own admin
// page so this surface stays general-only.
const AISM_PRODUCT_LABEL = "AI Solution Maven";
const PAGE_PATH = "/admin/feedback";

type SearchParams = Record<string, string | string[] | undefined>;

export default async function FeedbackAdminPage({
  searchParams
}: {
  searchParams?: SearchParams;
}) {
  const user = await getCurrentUser();
  const adminId = process.env.ADMIN_USER_ID;
  if (!user || !adminId || user.id !== adminId) {
    redirect("/");
  }

  const filter = parseFeedbackFilter(searchParams ?? {});
  const rows = await listFeedbackForProduct(
    AISM_PRODUCT_LABEL,
    filter,
    100
  );
  const counts = countByType(rows);

  return (
    <main className="min-h-screen bg-light">
      <div className="mx-auto max-w-[1200px] px-6 py-10">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-caption text-slate-500 transition hover:text-emerald-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to AISM admin
        </Link>

        <header className="mt-3">
          <p className="text-micro text-emerald-700">Admin</p>
          <h1 className="mt-1 text-h1 text-ink">AISM feedback</h1>
          <p className="mt-2 text-body text-slate-600">
            Latest 100 submissions tagged with product <span className="font-semibold">{AISM_PRODUCT_LABEL}</span>{" "}
            (the schema default — anything not tagged with a specific product).
            Newest first.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-caption text-slate-600">
            <span><span className="font-semibold text-slate-700">{rows.length}</span> shown</span>
            <span><span className="font-semibold text-slate-700">{counts.bug_report}</span> bugs</span>
            <span><span className="font-semibold text-slate-700">{counts.feature_request}</span> feature requests</span>
            <span><span className="font-semibold text-slate-700">{counts.general_feedback}</span> general</span>
          </div>
        </header>

        <section className="mt-6">
          <FeedbackFilters
            basePath={PAGE_PATH}
            product={AISM_PRODUCT_LABEL}
            current={filter}
            accent="emerald"
          />
        </section>

        <section className="mt-6">
          <FeedbackTable
            rows={rows}
            emptyMessage={
              Object.keys(filter).length > 0
                ? "No AISM feedback matches the current filter."
                : "No general AISM feedback yet."
            }
          />
        </section>
      </div>
    </main>
  );
}

function countByType(rows: { feedback_type: string }[]) {
  const counts = { bug_report: 0, feature_request: 0, general_feedback: 0 };
  for (const row of rows) {
    if (row.feedback_type in counts) {
      counts[row.feedback_type as keyof typeof counts] += 1;
    }
  }
  return counts;
}
