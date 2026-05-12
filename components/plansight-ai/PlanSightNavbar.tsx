"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  LayoutDashboard,
  LogOut,
  Menu,
  X
} from "lucide-react";

type Props = {
  /** True when a Supabase auth session exists. */
  signedIn: boolean;
  /** True when the current user has activated PlanSight specifically. */
  activated: boolean;
  /** "free" | "pro" when activated; null otherwise. */
  tier: "free" | "pro" | null;
  /**
   * Where to send the user after a successful sign-in started from this
   * page. Sign-up always lands on /my-plans (the universal new-account
   * dashboard) regardless of this prop.
   */
  signinRedirectTo: string;
};

/**
 * Product-scoped header for PlanSight AI pages. Per the brand pack
 * (`/branding/plansight-ai/docs/`), this header carries the PlanSight
 * brand fully — monogram + two-tone wordmark on deep navy, single cyan
 * accent, restrained type. AISM is acknowledged via the small "Powered
 * by" attribution.
 */
export function PlanSightNavbar({ signedIn, activated, tier, signinRedirectTo }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  // Account-scoped destinations (My plans, Sign out) live in the right-side
  // cluster. The center nav is product-feature navigation only.
  const productNav = [
    { label: "Workspace", href: "/products/plansight-ai" },
    { label: "Pricing", href: "/products/plansight-ai/upgrade" }
  ];

  return (
    <header className="border-b border-slate-800 bg-navy text-slate-100">
      <nav
        aria-label="PlanSight AI"
        className="relative mx-auto flex h-20 max-w-[1200px] items-center justify-between gap-4 px-6"
      >
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/products/plansight-ai"
            className="flex items-center gap-3"
            aria-label="PlanSight AI home"
          >
            <Image
              src="/products/plansight-ai/brand/plansight-monogram-dark.svg"
              alt=""
              width={36}
              height={36}
              priority
            />
            <span className="text-lg font-semibold tracking-tight leading-none">
              <span className="text-slate-300">Plan</span>
              <span className="text-cyan-400">Sight</span>
              <span className="ml-1.5 text-caption text-slate-500 tracking-wider uppercase">
                AI
              </span>
            </span>
          </Link>
          <span className="hidden text-caption text-slate-500 sm:inline-flex">
            Powered by{" "}
            <Link
              href="/"
              className="ml-1 font-semibold text-slate-300 underline-offset-2 transition hover:text-slate-100 hover:underline"
            >
              AI Solution Maven
            </Link>
          </span>
        </div>

        <div className="hidden items-center gap-7 md:flex">
          {productNav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-body text-slate-300 transition hover:text-slate-100"
            >
              {item.label}
            </Link>
          ))}
        </div>

        <div className="hidden items-center gap-3 md:flex">
          <PlanSightAuthCTA
            signedIn={signedIn}
            activated={activated}
            tier={tier}
            signinRedirectTo={signinRedirectTo}
          />
        </div>

        <button
          type="button"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          className="grid h-9 w-9 place-items-center rounded-md border border-slate-800 text-slate-200 md:hidden"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {isOpen ? (
          <div className="absolute left-6 right-6 top-[88px] z-20 rounded-xl border border-slate-800 bg-navy-800 p-4 shadow-modal md:hidden">
            <div className="grid gap-1">
              {productNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className="rounded-md px-3 py-3 text-body text-slate-200 transition hover:bg-slate-800 hover:text-slate-100"
                >
                  {item.label}
                </Link>
              ))}
            </div>

            <div className="mt-4 grid gap-3 border-t border-slate-800 pt-4">
              <PlanSightAuthCTA
                variant="mobile"
                signedIn={signedIn}
                activated={activated}
                tier={tier}
                signinRedirectTo={signinRedirectTo}
                onAfter={() => setIsOpen(false)}
              />
            </div>

            <p className="mt-4 border-t border-slate-800 pt-4 text-center text-caption text-slate-500">
              Powered by{" "}
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="font-semibold text-slate-300 underline-offset-2 transition hover:text-slate-100 hover:underline"
              >
                AI Solution Maven
              </Link>
            </p>
          </div>
        ) : null}
      </nav>
    </header>
  );
}

function PlanSightAuthCTA({
  signedIn,
  activated,
  tier,
  signinRedirectTo,
  variant = "desktop",
  onAfter
}: Props & {
  variant?: "desktop" | "mobile";
  onAfter?: () => void;
}) {
  const baseDesktop = "inline-flex items-center gap-2 rounded-md px-3.5 py-2 text-body";
  const baseMobile = "inline-flex items-center justify-center gap-2 rounded-md px-3.5 py-2.5 text-body";
  const base = variant === "desktop" ? baseDesktop : baseMobile;

  // Activated — show My plans + Sign out (and Upgrade for free tier)
  if (signedIn && activated) {
    return (
      <>
        {tier !== "pro" ? (
          <Link
            href="/products/plansight-ai/upgrade"
            onClick={onAfter}
            className={`${base} bg-cyan-400 font-semibold text-ink transition hover:bg-cyan-300`}
          >
            Upgrade to Pro
          </Link>
        ) : null}
        <Link
          href="/products/plansight-ai/my-plans"
          onClick={onAfter}
          className={`${base} border border-slate-800 bg-navy-800 text-slate-100 transition hover:border-slate-700 hover:bg-slate-800`}
        >
          <LayoutDashboard className="h-4 w-4" />
          My plans
        </Link>
        <form action="/auth/signout" method="post" className="contents">
          <button
            type="submit"
            onClick={onAfter}
            title="Sign out of PlanSight AI"
            className={`${base} text-slate-400 transition hover:text-slate-200`}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </>
    );
  }

  // Sign-up CTA is shown to both anonymous users and signed-in users who
  // haven't yet activated PlanSight. The /signup page detects the session
  // and either renders the form (anonymous) or auto-activates the product
  // using the existing credentials (signed-in).
  //
  // Sign-up always redirects to /my-plans after confirmation. New
  // accounts land on their dashboard regardless of entry point — they
  // can navigate elsewhere from there. Sign-in keeps "where I was".
  const signupHref = "/signup?product=plansight-ai&redirectTo=%2Fmy-plans";
  const signinHref = `/signin?redirectTo=${encodeURIComponent(signinRedirectTo)}`;

  if (signedIn && !activated) {
    return (
      <Link
        href={signupHref}
        onClick={onAfter}
        className={`${base} bg-cyan-400 font-semibold text-ink transition hover:bg-cyan-300`}
      >
        Sign up for PlanSight
        <ArrowRight className="h-4 w-4" />
      </Link>
    );
  }

  // Anonymous — Sign in (existing users) + Sign up (new PlanSight users)
  return (
    <>
      <Link
        href={signinHref}
        onClick={onAfter}
        className={`${base} text-slate-300 transition hover:text-slate-100`}
      >
        Sign in
      </Link>
      <Link
        href={signupHref}
        onClick={onAfter}
        className={`${base} bg-cyan-400 font-semibold text-ink transition hover:bg-cyan-300`}
      >
        Sign up for PlanSight
        <ArrowRight className="h-4 w-4" />
      </Link>
    </>
  );
}
