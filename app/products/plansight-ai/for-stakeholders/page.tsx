import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Check } from "lucide-react";
import { PlanSightFooter } from "@/components/plansight-ai/PlanSightFooter";
import { PlanSightNavbar } from "@/components/plansight-ai/PlanSightNavbar";
import { StakeholderMailtoCta } from "@/components/plansight-ai/StakeholderMailtoCta";
import { getProductActivation, PRODUCTS } from "@/lib/auth/activations";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Received a project plan? · PlanSight AI",
  description:
    "Quick orientation for stakeholders who received a PlanSight share link — what it is, what you can do with it, and how to tell your PM about it.",
  alternates: { canonical: "/products/plansight-ai/for-stakeholders" },
  openGraph: {
    title: "Your PM sent you a project plan you can actually read",
    description:
      "PlanSight turns a Microsoft Project .mpp file or XML export into a clean, read-only view your stakeholders can open in a browser.",
    url: "/products/plansight-ai/for-stakeholders"
  }
};

const bullets = [
  "Read the plan in your browser. Nothing to install.",
  "See the critical path, late tasks, and overall project health.",
  "Ask your PM to share other plans the same way."
];

export default async function ForStakeholdersPage() {
  const user = await getCurrentUser();
  const activation = user
    ? await getProductActivation(user.id, PRODUCTS.PLANSIGHT)
    : null;

  return (
    <main className="min-h-screen bg-slate-50">
      <PlanSightNavbar
        signedIn={!!user}
        activated={!!activation}
        tier={activation?.tier ?? null}
      />

      <section className="bg-navy text-slate-100">
        <div className="mx-auto max-w-3xl px-6 py-16">
          <p className="text-micro text-cyan-400">For stakeholders</p>
          <h1 className="mt-3 text-display text-slate-100">
            Your PM sent you a project plan you can actually read.
          </h1>
          <p className="mt-6 text-lead text-slate-300">
            This is a read-only view of a Microsoft Project plan. Your PM
            owns the underlying file. You didn&apos;t need to install
            anything — the plan opens in your browser.
          </p>
        </div>
      </section>

      <section className="px-6 py-12">
        <div className="mx-auto max-w-3xl">
          <ul className="space-y-3">
            {bullets.map((line) => (
              <li
                key={line}
                className="flex items-start gap-3 rounded-md border border-slate-200 bg-white p-4 text-body text-slate-800"
              >
                <span
                  aria-hidden
                  className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-700"
                >
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10">
            <StakeholderMailtoCta />
          </div>
        </div>
      </section>

      <section className="bg-white px-6 py-12">
        <div className="mx-auto flex max-w-3xl items-start gap-4 rounded-md border border-slate-200 bg-slate-50 p-5">
          <Image
            src="/products/plansight-ai/brand/plansight-monogram-light.svg"
            alt=""
            width={36}
            height={36}
            className="shrink-0"
          />
          <p className="text-caption text-slate-600">
            PlanSight is built by{" "}
            <Link
              href="/"
              className="font-semibold text-slate-700 underline-offset-2 hover:underline"
            >
              AI Solution Maven
            </Link>
            . The PM who shared this link with you keeps full control of
            the underlying plan; you can&apos;t edit or download the
            source file.
          </p>
        </div>
      </section>

      <PlanSightFooter />
    </main>
  );
}
