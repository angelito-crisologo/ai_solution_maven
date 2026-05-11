"use client";

import Link from "next/link";
import { Loader2, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/auth/supabase-browser";

type Props = {
  /** Where to send the user after they reset their password. */
  redirectTo: string;
};

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

export function ForgotPasswordForm({ redirectTo }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const signinHref = `/signin?redirectTo=${encodeURIComponent(redirectTo)}`;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setStatus({ kind: "submitting" });

    try {
      const supabase = createSupabaseBrowserClient();
      // After the user clicks the reset link, Supabase redirects to our
      // /auth/callback route with a code. The callback exchanges the code
      // for a session, then sends the user to /reset-password (carried via
      // redirectTo) where they choose a new password.
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      const finalRedirect = `/reset-password?next=${encodeURIComponent(redirectTo)}`;
      callbackUrl.searchParams.set("redirectTo", finalRedirect);

      const { error } = await supabase.auth.resetPasswordForEmail(trimmed, {
        redirectTo: callbackUrl.toString()
      });

      if (error) {
        setStatus({ kind: "error", message: error.message });
        return;
      }

      setStatus({ kind: "sent", email: trimmed });
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Couldn't send the reset email."
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
              If an account exists for{" "}
              <span className="font-semibold">{status.email}</span>, we sent a link
              to reset your password.
            </p>
          </div>
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
        disabled={status.kind === "submitting" || !email.trim()}
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 text-body font-semibold text-white transition hover:bg-cyan-800 disabled:opacity-60"
      >
        {status.kind === "submitting" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        Send reset link
      </button>

      {status.kind === "error" ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-body text-red-800">
          {status.message}
        </p>
      ) : null}

      <p className="border-t border-slate-200 pt-4 text-caption text-slate-500">
        Remembered it?{" "}
        <Link
          href={signinHref}
          className="font-semibold text-cyan-700 underline-offset-2 transition hover:text-cyan-800 hover:underline"
        >
          Back to sign in
        </Link>
        .
      </p>
    </form>
  );
}
