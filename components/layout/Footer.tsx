import Link from "next/link";
import { site } from "@/content/site";
import { Logo } from "./Logo";

/** Footer: lockup and line, link grid, contact, ABN and Privacy. */
export function Footer() {
  return (
    <footer className="bg-white px-gutter pb-7 pt-10 text-small">
      <div className="mx-auto flex max-w-content flex-col gap-7">
        <div className="flex flex-wrap justify-between gap-8">
          <div className="flex max-w-[380px] flex-[1_1_280px] flex-col gap-2.5">
            <Logo size={28} />
            <p className="m-0">{site.tagline}</p>
          </div>
          <nav
            aria-label={site.menu.footerLabel}
            className="grid grid-cols-[repeat(2,auto)] content-start gap-x-10 gap-y-1.5"
          >
            {site.footerNav.map((item) => (
              <Link key={item.href} href={item.href} className="py-1 text-navy-900">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex flex-col gap-1.5">
            <a href={`mailto:${site.email}`} className="text-teal-700 [overflow-wrap:anywhere]">
              {site.email}
            </a>
            <span>{site.location}</span>
            <span className="font-medium text-navy-900">{site.credentialsLine}</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-between gap-x-6 gap-y-2 border-t border-line pt-5 text-caption text-ink-500">
          <span>
            ABN {site.abn} ·{" "}
            <Link href="/privacy" className="text-ink-500 hover:text-navy-900">
              {site.privacyLabel}
            </Link>
          </span>
          <span>{site.copyright}</span>
        </div>
      </div>
    </footer>
  );
}
