import Link from "next/link";

const footerLinks = [
  { label: "Products", href: "/products" },
  { label: "Projects", href: "/projects" },
  { label: "Feedback", href: "/feedback" },
  { label: "Contact", href: "/contact" },
];

const legalLinks = [
  { label: "Terms", href: "/products/plansight-ai/legal/terms" },
  { label: "Privacy", href: "/products/plansight-ai/legal/privacy" },
  { label: "Refunds", href: "/products/plansight-ai/legal/refunds" },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <Link href="/" className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-sm font-bold text-white">
              AI
            </span>
            <span className="font-semibold text-dark">AI Solution Maven</span>
          </Link>
          <nav aria-label="Footer navigation" className="flex flex-wrap gap-5">
            {footerLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-slate-600 transition hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="mt-6 flex flex-col gap-3 border-t border-slate-200 pt-5 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between">
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
