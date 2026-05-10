"use client";

import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/auth/supabase-browser";

type Props = {
  redirectTo: string;
  /** Product slug to record an activation for after the magic link is
   * confirmed. When empty, this is a Sign-in path: existing accounts only.
   * When set (e.g. "plansight-ai"), this is a Sign-up path: new accounts
   * are allowed and the activation is recorded after magic-link click. */
  product?: string;
};

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string }
  | { kind: "no-account"; email: string };

/**
 * Inspect a Supabase OTP error and decide whether it means "no account
 * exists for this email." Supabase doesn't expose a dedicated error code
 * for this case — when shouldCreateUser is false and the user isn't found,
 * the message tends to mention "signups not allowed" or contain "user not
 * found." Keep the matcher loose so message wording changes don't silently
 * route everything to a generic error.
 */
function isNoSuchUserError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes("signups not allowed") ||
    lower.includes("user not found") ||
    lower.includes("not found") ||
    lower.includes("does not exist")
  );
}

export function SignInForm({ redirectTo, product = "" }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const isSignUpFlow = product !== "";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setStatus({ kind: "sending" });

    try {
      const supabase = createSupabaseBrowserClient();
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("redirectTo", redirectTo);
      if (product) {
        callbackUrl.searchParams.set("product", product);
      }

      const { error } = await supabase.auth.signInWithOtp({
        email: trimmed,
        options: {
          emailRedirectTo: callbackUrl.toString(),
          // Sign-in path: only existing accounts. Sign-up path: create on first use.
          shouldCreateUser: isSignUpFlow
        }
      });

      if (error) {
        if (!isSignUpFlow && isNoSuchUserError(error.message)) {
          setStatus({ kind: "no-account", email: trimmed });
          return;
        }
        setStatus({ kind: "error", message: error.message });
        return;
      }

      setStatus({ kind: "sent", email: trimmed });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Failed to send magic link."
      });
    }
  };

  if (status.kind === "sent") {
    return (
      <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-emerald-800" />
          <div>
            <p className="text-h3 text-emerald-900">Check your email</p>
            <p className="mt-1 text-body text-emerald-800">
              We sent a magic link to{" "}
              <span className="font-semibold">{status.email}</span>. Click the link
              to finish signing in.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (status.kind === "no-account") {
    const signupHref = `/signin?product=plansight-ai&redirectTo=${encodeURIComponent(redirectTo)}`;
    return (
      <div className="mt-6 rounded-md border border-amber-200 bg-amber-50 p-5">
        <p className="text-h3 text-amber-900">No account for that email</p>
        <p className="mt-1 text-body text-amber-800">
          We couldn&apos;t find a PlanSight account for{" "}
          <span className="font-semibold">{status.email}</span>. If you&apos;re
          new, sign up here — it&apos;s the same magic-link flow.
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link
            href={signupHref}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-cyan-700 px-4 text-body font-semibold text-white transition hover:bg-cyan-800"
          >
            Sign up for PlanSight
          </Link>
          <button
            type="button"
            onClick={() => setStatus({ kind: "idle" })}
            className="inline-flex h-10 items-center rounded-md border border-slate-200 bg-white px-4 text-body font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Try a different email
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="text-body font-semibold text-ink">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          autoFocus
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="you@example.com"
          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-body text-ink focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
        />
      </div>

      <button
        type="submit"
        disabled={status.kind === "sending" || !email.trim()}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 text-body font-semibold text-white transition hover:bg-cyan-800 disabled:opacity-60"
      >
        {status.kind === "sending" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        {isSignUpFlow ? "Send magic link" : "Send sign-in link"}
      </button>

      {status.kind === "error" ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-body text-red-800">
          {status.message}
        </p>
      ) : null}
    </form>
  );
}
