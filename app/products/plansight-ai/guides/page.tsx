import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, BookOpen } from "lucide-react";
import { PlanSightFooter } from "@/components/plansight-ai/PlanSightFooter";
import { PlanSightNavbar } from "@/components/plansight-ai/PlanSightNavbar";
import { getProductActivation, PRODUCTS } from "@/lib/auth/activations";
import { getCurrentUser } from "@/lib/auth/session";
import { listGuides } from "@/lib/guides";

export const metadata: Metadata = {
  title: {
    absolute: "PlanSight AI guides — project plans, .mpp files, and PM workflow"
  },
  description:
    "Practical guides for project managers: opening .mpp files without Microsoft Project, sharing plans with stakeholders, critical path basics, and weekly status reporting.",
  alternates: {
    canonical: "/products/plansight-ai/guides"
  },
  icons: {
    icon: [
      { url: "/products/plansight-ai/favicon.ico", sizes: "any" },
      { url: "/products/plansight-ai/favicon-32.png", type: "image/png", sizes: "32x32" },
      { url: "/products/plansight-ai/favicon-16.png", type: "image/png", sizes: "16x16" }
    ],
    apple: { url: "/products/plansight-ai/favicon-180.png", sizes: "180x180" }
  },
  manifest: "/products/plansight-ai/site.webmanifest",
  openGraph: {
    title: "PlanSight AI guides",
    description:
      "Practical guides for project managers: .mpp files, stakeholder sharing, critical path, weekly status.",
    url: "/products/plansight-ai/guides",
    type: "website"
  }
};

export const dynamic = "force-static";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

export default async function GuidesIndexPage() {
  const [user, guides] = await Promise.all([getCurrentUser(), listGuides()]);
  const activation = user ? await getProductActivation(user.id, PRODUCTS.PLANSIGHT) : null;

  return (
    <main className="min-h-screen bg-light">
      <PlanSightNavbar
        signedIn={!!user}
        activated={!!activation}
        tier={activation?.tier ?? null}
      />

      <section className="bg-navy text-slate-100">
        <div className="mx-auto max-w-[1200px] px-6 py-14">
          <p className="text-micro uppercase tracking-wider text-cyan-400">PlanSight guides</p>
          <h1 className="mt-3 text-display text-slate-100">
            Practical reading for project managers.
          </h1>
          <p className="mt-4 max-w-2xl text-lead text-slate-300">
            How to open and share Microsoft Project .mpp files, work with critical path, and
            produce weekly status reports stakeholders actually read.
          </p>
        </div>
      </section>

      <section className="px-6 py-16">
        <div className="mx-auto max-w-[1200px]">
          {guides.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-10 text-center">
              <BookOpen className="mx-auto h-8 w-8 text-slate-400" />
              <p className="mt-4 text-body text-slate-700">
                Guides are on the way. In the meantime, head to{" "}
                <Link
                  href="/products/plansight-ai"
                  className="font-semibold text-cyan-700 hover:text-cyan-800"
                >
                  PlanSight AI
                </Link>{" "}
                and upload your first .mpp file.
              </p>
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2">
              {guides.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={`/products/plansight-ai/guides/${guide.slug}`}
                    className="group block rounded-xl border border-slate-200 bg-white p-6 transition hover:border-slate-300 hover:shadow-card"
                  >
                    <p className="text-micro uppercase tracking-wider text-cyan-700">
                      {formatDate(guide.publishedAt)}
                    </p>
                    <h2 className="mt-2 text-h2 text-ink group-hover:text-cyan-700">
                      {guide.title}
                    </h2>
                    <p className="mt-2 text-body text-slate-700">{guide.description}</p>
                    <span className="mt-4 inline-flex items-center gap-1 text-caption font-semibold text-cyan-700">
                      Read guide
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <PlanSightFooter />
    </main>
  );
}
