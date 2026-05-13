import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { MessageSquareText } from "lucide-react";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "AISM admin",
  description: "AI Solution Maven operational surfaces (non-product).",
  robots: { index: false, follow: false }
};

export default async function AisolutionAdminPage() {
  const user = await getCurrentUser();
  const adminId = process.env.ADMIN_USER_ID;
  if (!user || !adminId || user.id !== adminId) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-light">
      <div className="mx-auto max-w-[1200px] px-6 py-10">
        <p className="text-micro text-emerald-700">Admin</p>
        <h1 className="mt-1 text-h1 text-ink">AI Solution Maven</h1>
        <p className="mt-2 max-w-2xl text-body text-slate-600">
          Operational surfaces for AISM-level signals (anything not tagged to a
          specific product). Product-specific admin pages live under each
          product&apos;s namespace — e.g. <span className="font-mono text-caption">/products/plansight-ai/admin</span>.
        </p>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <Link
            href="/aisolution/admin/feedback"
            className="group flex items-start gap-3 rounded-md border border-slate-200 bg-white p-5 shadow-sm transition hover:border-emerald-300 hover:shadow-md"
          >
            <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-emerald-100 text-emerald-700">
              <MessageSquareText className="h-5 w-5" />
            </span>
            <div>
              <p className="text-body font-semibold text-ink">Feedback</p>
              <p className="mt-1 text-caption text-slate-600">
                General feedback submitted from the marketing site (no product tag).
              </p>
            </div>
          </Link>
        </section>
      </div>
    </main>
  );
}
