import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";
import { listFeedbackForProduct } from "@/lib/feedback/queries";
import { FeedbackTable } from "@/components/admin/FeedbackTable";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "PlanSight feedback · Admin",
  description: "PlanSight AI feedback submissions.",
  robots: { index: false, follow: false }
};

const PLANSIGHT_PRODUCT_LABEL = "PlanSight AI";

export default async function PlansightFeedbackAdminPage() {
  const user = await getCurrentUser();
  const adminId = process.env.ADMIN_USER_ID;
  if (!user || !adminId || user.id !== adminId) {
    redirect("/");
  }

  const rows = await listFeedbackForProduct(PLANSIGHT_PRODUCT_LABEL, 100);
  const counts = countByType(rows);

  return (
    <main className="min-h-screen bg-light">
      <div className="mx-auto max-w-[1200px] px-6 py-10">
        <Link
          href="/products/plansight-ai/admin"
          className="inline-flex items-center gap-1 text-caption text-slate-500 transition hover:text-cyan-700"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to PlanSight admin
        </Link>

        <header className="mt-3">
          <p className="text-micro text-cyan-700">Admin</p>
          <h1 className="mt-1 text-h1 text-ink">PlanSight feedback</h1>
          <p className="mt-2 text-body text-slate-600">
            Latest 100 submissions tagged with product <span className="font-semibold">{PLANSIGHT_PRODUCT_LABEL}</span>,
            newest first. Reply directly via the contact mailto link — replies
            do not go back through this surface.
          </p>
          <div className="mt-4 flex flex-wrap gap-4 text-caption text-slate-600">
            <span><span className="font-semibold text-slate-700">{rows.length}</span> shown</span>
            <span><span className="font-semibold text-slate-700">{counts.bug_report}</span> bugs</span>
            <span><span className="font-semibold text-slate-700">{counts.feature_request}</span> feature requests</span>
            <span><span className="font-semibold text-slate-700">{counts.general_feedback}</span> general</span>
          </div>
        </header>

        <section className="mt-8">
          <FeedbackTable
            rows={rows}
            emptyMessage="No PlanSight feedback yet."
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
