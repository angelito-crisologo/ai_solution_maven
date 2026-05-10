"use client";

import { Loader2, Mail } from "lucide-react";
import { useState, type FormEvent } from "react";
import { createSupabaseBrowserClient } from "@/lib/auth/supabase-browser";

type Props = {
  redirectTo: string;
  /** Product slug to record an activation for after the magic link is
   * confirmed. Empty string means the user is signing in to the AISM
   * portfolio directly without a specific product context. */
  product?: string;
};

type Status =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; email: string }
  | { kind: "error"; message: string };

export function SignInForm({ redirectTo, product = "" }: Props) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

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
          emailRedirectTo: callbackUrl.toString()
        }
      });

      if (error) {
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
      <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-emerald-700" />
          <div>
            <p className="text-sm font-semibold text-emerald-900">Check your email</p>
            <p className="mt-1 text-sm leading-6 text-emerald-800">
              We sent a magic link to <span className="font-medium">{status.email}</span>.
              Click the link in the email to finish signing in.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4">
      <div>
        <label htmlFor="email" className="text-sm font-medium text-dark">
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
          className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-dark shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </div>

      <button
        type="submit"
        disabled={status.kind === "sending" || !email.trim()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-primary to-secondary px-5 py-3 text-sm font-medium text-white shadow-lg shadow-primary/20 disabled:opacity-60"
      >
        {status.kind === "sending" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Mail className="h-4 w-4" />
        )}
        Send magic link
      </button>

      {status.kind === "error" ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {status.message}
        </p>
      ) : null}
    </form>
  );
}
