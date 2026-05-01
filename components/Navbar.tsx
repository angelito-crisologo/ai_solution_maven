"use client";

import Link from "next/link";
import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";

const navItems = [
  { label: "Work", href: "/#work" },
  { label: "Services", href: "/#services" },
  { label: "Products", href: "/#products" },
  { label: "Feedback", href: "/feedback" },
  { label: "Contact", href: "/contact" },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="border-b border-white/10">
      <nav
        aria-label="Main navigation"
        className="relative mx-auto flex h-20 max-w-[1200px] items-center justify-between px-6"
      >
        <Link href="/" className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-primary to-secondary text-sm font-bold shadow-lg shadow-primary/25">
            AI
          </span>
          <span className="text-base font-semibold tracking-normal">
            AI Solution Maven
          </span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-slate-300 transition hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            href="/#work"
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/5"
          >
            View Work
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-medium text-dark transition hover:bg-slate-100"
          >
            Hire Me
            <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Link>
        </div>

        <button
          type="button"
          aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-white md:hidden"
        >
          {isOpen ? (
            <X aria-hidden="true" className="h-5 w-5" />
          ) : (
            <Menu aria-hidden="true" className="h-5 w-5" />
          )}
        </button>

        {isOpen ? (
          <div className="absolute left-6 right-6 top-[88px] z-20 rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-soft backdrop-blur md:hidden">
            <div className="grid gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm font-medium text-slate-200 transition hover:bg-white/5 hover:text-white"
                >
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="mt-4 grid gap-3 border-t border-white/10 pt-4">
              <Link
                href="/#work"
                onClick={() => setIsOpen(false)}
                className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-medium text-white"
              >
                View Work
              </Link>
              <Link
                href="/contact"
                onClick={() => setIsOpen(false)}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-3 text-sm font-medium text-dark"
              >
                Hire Me
                <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : null}
      </nav>
    </header>
  );
}
