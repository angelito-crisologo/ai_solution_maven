import Image from "next/image";
import Link from "next/link";

const productLinks = [
  { label: "Workspace", href: "/products/plansight-ai" },
  { label: "Guides", href: "/products/plansight-ai/guides" },
  { label: "Pricing", href: "/products/plansight-ai/upgrade" },
  { label: "Feedback", href: "/feedback?product=PlanSight%20AI" }
];

const legalLinks = [
  { label: "Terms", href: "/products/plansight-ai/legal/terms" },
  { label: "Privacy", href: "/products/plansight-ai/legal/privacy" },
  { label: "Refunds", href: "/products/plansight-ai/legal/refunds" }
];

/**
 * Product-scoped footer for PlanSight pages. Per the brand pack, the
 * footer carries the PlanSight wordmark plain (no decorative elements)
 * and a quiet "Built by AI Solution Maven" attribution.
 */
export function PlanSightFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-10">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-3">
            <Link href="/products/plansight-ai" aria-label="PlanSight AI home">
              <Image
                src="/products/plansight-ai/brand/plansight-logo-primary.svg"
                alt="PlanSight AI"
                width={140}
                height={28}
              />
            </Link>
            <p className="text-caption text-slate-500">
              Built by{" "}
              <Link
                href="/"
                className="font-semibold text-slate-700 underline-offset-2 transition hover:text-ink hover:underline"
              >
                AI Solution Maven
              </Link>
            </p>
          </div>

          <nav aria-label="PlanSight footer navigation" className="flex flex-wrap gap-5">
            {productLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-body text-slate-600 transition hover:text-ink"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-5 text-caption text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} AI Solution Maven</span>
          <nav aria-label="Legal" className="flex flex-wrap gap-4">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="transition hover:text-slate-700"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </div>
    </footer>
  );
}
