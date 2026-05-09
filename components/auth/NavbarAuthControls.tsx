"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LayoutDashboard, LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@/lib/auth/supabase-browser";

type AuthState =
  | { status: "loading" }
  | { status: "anonymous" }
  | { status: "signed-in"; email: string };

type Props = {
  variant: "desktop" | "mobile";
  onAfter?: () => void;
};

/**
 * Auth controls shown in the Navbar. Signed-out users see "Sign in".
 * Signed-in users see a "My Plans" link and a sign-out button.
 *
 * Auth state is checked client-side after mount to avoid threading a
 * server-side session prop through every page that renders the Navbar.
 * A brief skeleton renders during the initial check.
 */
export function NavbarAuthControls({ variant, onAfter }: Props) {
  const [state, setState] = useState<AuthState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    let supabase;
    try {
      supabase = createSupabaseBrowserClient();
    } catch {
      if (!cancelled) setState({ status: "anonymous" });
      return;
    }

    supabase.auth.getUser().then(({ data, error }) => {
      if (cancelled) return;
      if (error || !data.user) {
        setState({ status: "anonymous" });
      } else {
        setState({ status: "signed-in", email: data.user.email ?? "" });
      }
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (cancelled) return;
      if (session?.user) {
        setState({ status: "signed-in", email: session.user.email ?? "" });
      } else {
        setState({ status: "anonymous" });
      }
    });

    return () => {
      cancelled = true;
      subscription.subscription.unsubscribe();
    };
  }, []);

  if (state.status === "loading") {
    return variant === "desktop" ? (
      <div className="h-9 w-24 animate-pulse rounded-xl bg-white/5" />
    ) : (
      <div className="h-10 w-full animate-pulse rounded-xl bg-white/5" />
    );
  }

  if (state.status === "anonymous") {
    if (variant === "desktop") {
      return (
        <Link
          href="/signin"
          onClick={onAfter}
          className="rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/5"
        >
          Sign in
        </Link>
      );
    }
    return (
      <Link
        href="/signin"
        onClick={onAfter}
        className="rounded-xl border border-white/10 px-4 py-3 text-center text-sm font-medium text-white"
      >
        Sign in
      </Link>
    );
  }

  // signed-in
  if (variant === "desktop") {
    return (
      <>
        <Link
          href="/my-plans"
          onClick={onAfter}
          className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-4 py-2 text-sm font-medium text-white transition hover:border-white/25 hover:bg-white/5"
        >
          <LayoutDashboard className="h-4 w-4" />
          My Plans
        </Link>
        <form action="/auth/signout" method="post" className="contents">
          <button
            type="submit"
            onClick={onAfter}
            title={`Signed in as ${state.email}`}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-sm font-medium text-slate-300 transition hover:border-white/25 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </form>
      </>
    );
  }

  return (
    <>
      <Link
        href="/my-plans"
        onClick={onAfter}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-white"
      >
        <LayoutDashboard className="h-4 w-4" />
        My Plans
      </Link>
      <form action="/auth/signout" method="post" className="contents">
        <button
          type="submit"
          onClick={onAfter}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 px-4 py-3 text-sm font-medium text-slate-300"
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </button>
      </form>
    </>
  );
}
