"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Sparkles,
  X
} from "lucide-react";

type Props = {
  /** True when a Supabase auth session exists. */
  signedIn: boolean;
  /** True when the current user has activated PlanSight specifically. */
  activated: boolean;
  /** "free" | "pro" when activated; null otherwise. */
  tier: "free" | "pro" | null;
  /** Callback URL to redirect to after sign-up. Used to round-trip back
   * to the originating product page after the magic link. */
  signupRedirectTo: string;
};

/**
 * Product-scoped header for PlanSight AI pages. Replaces the global
 * AISM Navbar so each product page can carry its own brand and
 * contextual auth CTAs. A small backlink keeps the AISM portfolio one
 * click away.
 */
export function PlanSightNavbar({ signedIn, activated, tier, signupRedirectTo }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const productNav = [
    { label: "Workspace", href: "/products/plansight-ai" },
    ...(activated ? [{ label: "My Plans", href: "/my-plans" }] : []),
    { label: "Pricing", href: "/upgrade" }
  ];

  return (
    <header className="border-b border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white">
      <nav
        aria-label="PlanSight AI navigation"
        className="relative mx-auto flex h-20 max-w-[1200px] items-center justify-between gap-4 px-6"
      >
        <div className="flex min-w-0 items-center gap-3">
          <Link
            href="/products/plansight-ai"
            className="flex items-center gap-3"
            aria-label="PlanSight AI home"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-emerald-300 to-primary text-sm font-bold text-slate-950 shadow-lg shadow-primary/30">
              <Sparkles className="h-5 w-5" />
            </span>
            <span className="text-base font-semibold tracking-normal text-white">
              PlanSight AI
            </span>
          </Link>
          <span className="hidden text-[11px] leading-tight text-slate-400 sm:inline-block">
            Powered by{" "}
            <Link
              href="/"
              className="font-medium text-slate-200 underline-offset-2 transition hover:text-white hover:underline"
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
              className="text-sm font-medium text-slate-300 transition hover:text-white"
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
            signupRedirectTo={signupRedirectTo}
          />
        </div>

        <button
          type="button"
          aria-label={isOpen ? "Close menu" : "Open menu"}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((current) => !current)}
          className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 text-white md:hidden"
        >
          {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        {isOpen ? (
          <div className="absolute left-6 right-6 top-[88px] z-20 rounded-2xl border border-white/10 bg-slate-950/95 p-4 shadow-soft backdrop-blur md:hidden">
            <div className="grid gap-1">
              {productNav.map((item) => (
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
              <PlanSightAuthCTA
                variant="mobile"
                signedIn={signedIn}
                activated={activated}
                tier={tier}
                signupRedirectTo={signupRedirectTo}
                onAfter={() => setIsOpen(false)}
              />
            </div>

            <p className="mt-4 border-t border-white/10 pt-4 text-center text-[11px] text-slate-400">
              Powered by{" "}
              <Link
                href="/"
                onClick={() => setIsOpen(false)}
                className="font-medium text-slate-200 underline-offset-2 transition hover:text-white hover:underline"
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
  signupRedirectTo,
  variant = "desktop",
  onAfter
}: Props & {
  variant?: "desktop" | "mobile";
  onAfter?: () => void;
}) {
  const baseDesktop =
    "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition";
  const baseMobile =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium";
  const base = variant === "desktop" ? baseDesktop : baseMobile;

  // Activated — show My Plans + Sign out
  if (signedIn && activated) {
    return (
      <>
        {tier !== "pro" ? (
          <Link
            href="/upgrade"
            onClick={onAfter}
            className={`${base} bg-gradient-to-br from-amber-300 to-secondary text-slate-950 shadow-lg shadow-secondary/20 hover:opacity-95`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Upgrade to Pro
          </Link>
        ) : null}
        <Link
          href="/my-plans"
          onClick={onAfter}
          className={`${base} border border-white/10 bg-white/5 text-white hover:border-white/25 hover:bg-white/10`}
        >
          <LayoutDashboard className="h-4 w-4" />
          My Plans
        </Link>
        <form action="/auth/signout" method="post" className="contents">
          <button
            type="submit"
            onClick={onAfter}
            title="Sign out of PlanSight AI"
            className={`${base} border border-white/10 bg-transparent text-slate-300 hover:border-white/25 hover:bg-white/5 hover:text-white`}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </>
    );
  }

  // Signed in but not activated — show one-click "Activate"
  if (signedIn && !activated) {
    return (
      <ActivatePlanSightButton variant={variant} onAfter={onAfter} />
    );
  }

  // Anonymous — show Sign up CTA
  const signupHref = `/signin?product=plansight-ai&redirectTo=${encodeURIComponent(signupRedirectTo)}`;
  return (
    <Link
      href={signupHref}
      onClick={onAfter}
      className={`${base} bg-white text-slate-900 shadow-lg shadow-slate-900/20 hover:bg-slate-100`}
    >
      Sign up for PlanSight
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}

function ActivatePlanSightButton({
  variant,
  onAfter
}: {
  variant: "desktop" | "mobile";
  onAfter?: () => void;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClick = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await fetch("/api/plansight/activate", { method: "POST" });
      if (!response.ok) {
        const payload = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(payload.error || "Failed to activate PlanSight.");
      }
      // Reload so the server re-renders with the activation state.
      window.location.reload();
      onAfter?.();
    } catch (err) {
      setBusy(false);
      setError(err instanceof Error ? err.message : "Failed to activate PlanSight.");
    }
  };

  const base =
    variant === "desktop"
      ? "inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition"
      : "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-medium";

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={busy}
        className={`${base} bg-emerald-300 text-slate-950 shadow-lg shadow-emerald-300/30 hover:bg-emerald-200 disabled:opacity-70`}
      >
        <Sparkles className="h-3.5 w-3.5" />
        {busy ? "Activating..." : "Activate PlanSight"}
      </button>
      {error ? <span className="text-xs text-red-300">{error}</span> : null}
    </div>
  );
}
