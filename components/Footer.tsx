import Link from "next/link";

const footerLinks = [
  { label: "Products", href: "/products" },
  { label: "Projects", href: "/projects" },
  { label: "Feedback", href: "/feedback" },
  { label: "Contact", href: "/contact" },
];

export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-8">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
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
    </footer>
  );
}
