"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { site } from "@/content/site";
import { btnPrimary, cx } from "@/lib/ui";
import { BookingLink } from "../BookingLink";
import { Logo } from "./Logo";

function isCurrent(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Site header. Full link row from 1024 px; below that the links move into a
 * menu and the "Book a call" button stays visible. The menu closes on
 * Escape (focus returns to the toggle) and on navigation. It traps nothing.
 */
export function Header() {
  const pathname = usePathname() ?? "/";
  const [open, setOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);

  const close = useCallback((returnFocus: boolean) => {
    setOpen(false);
    if (returnFocus) toggleRef.current?.focus();
  }, []);

  // Close when the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close(true);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, close]);

  return (
    <header className="border-b border-line bg-white">
      <nav aria-label={site.menu.mainLabel}>
        {/* Desktop row, 1024 px and up */}
        <div className="mx-auto hidden max-w-[1200px] items-center justify-between gap-6 px-10 py-4 nav:flex">
          <Link href="/" className="rounded-tag no-underline">
            <Logo size={32} />
          </Link>
          <div className="flex items-center gap-7 text-[16px] font-medium">
            {site.nav.map((item) => {
              const current = isCurrent(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  className={cx(
                    "border-b-2 py-2 no-underline",
                    current
                      ? "border-teal-500 text-navy-900"
                      : "border-transparent text-ink-700 hover:border-line hover:text-navy-900",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <BookingLink
              location="header"
              className={cx(btnPrimary, "min-h-[44px] px-[18px] py-2.5 text-[16px]")}
            >
              {site.navButton}
            </BookingLink>
          </div>
        </div>

        {/* Phone and tablet, below 1024 px */}
        <div className="nav:hidden">
          <div className="flex items-center justify-between gap-2 px-4 py-2.5">
            <Link href="/" className="min-w-0 rounded-tag no-underline">
              <Logo size={28} />
            </Link>
            <div className="flex flex-none items-center gap-1.5">
              <BookingLink
                location="header"
                className={cx(btnPrimary, "min-h-[44px] whitespace-nowrap px-3 py-2 text-[15px]")}
              >
                {site.navButton}
              </BookingLink>
              <button
                ref={toggleRef}
                type="button"
                aria-expanded={open}
                aria-controls="mobile-menu"
                aria-label={open ? site.menu.close : site.menu.open}
                onClick={() => setOpen((value) => !value)}
                className="flex h-11 w-11 cursor-pointer flex-col items-center justify-center gap-[5px] rounded-control border-[1.5px] border-navy-900 bg-white p-0"
              >
                {open ? (
                  <svg
                    viewBox="0 0 24 24"
                    width="22"
                    height="22"
                    aria-hidden="true"
                    focusable="false"
                    fill="none"
                    stroke="#132440"
                    strokeWidth="2"
                    strokeLinecap="round"
                  >
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                ) : (
                  <>
                    <span className="h-0.5 w-[18px] bg-navy-900" />
                    <span className="h-0.5 w-[18px] bg-navy-900" />
                    <span className="h-0.5 w-[18px] bg-navy-900" />
                  </>
                )}
              </button>
            </div>
          </div>
          <div
            id="mobile-menu"
            hidden={!open}
            className="flex-col border-t border-line px-4 pb-4 text-[19px] font-medium [&:not([hidden])]:flex"
          >
            {site.nav.map((item, i) => {
              const current = isCurrent(pathname, item.href);
              const last = i === site.nav.length - 1;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={current ? "page" : undefined}
                  onClick={() => setOpen(false)}
                  className={cx(
                    "py-[13px] text-navy-900 no-underline hover:text-navy-900",
                    !last && "border-b border-line",
                    current ? "border-l-[3px] border-l-teal-500 pl-3 font-semibold" : "pl-[15px]",
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </div>
      </nav>
    </header>
  );
}
