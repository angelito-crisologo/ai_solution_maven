"use client";

import Link from "next/link";
import { Loader2, LogIn } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/auth/supabase-browser";

type Props = {
  redirectTo: string;
};

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "unconfirmed"; email: string }
  | { kind: "resending" }
  | { kind: "resent"; email: string };

function describeSignInError(message: string): { kind: "unconfirmed" | "error"; text: string } {
  const lower = message.toLowerCase();
  if (lower.includes("email not confirmed") || lower.includes("not confirmed")) {
    return { kind: "unconfirmed", text: "Confirm your email before signing in." };
  }
  if (lower.includes("invalid login credentials") || lower.includes("invalid_credentials")) {
    return { kind: "error", text: "Email or password is incorrect." };
  }
  return { kind: "error", text: message || "Sign in failed. Please try again." };
}

export function SignInForm({ redirectTo }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const forgotHref = `/forgot-password?redirectTo=${encodeURIComponent(redirectTo)}`;
  const signupHref = `/signup?product=plansight-ai&redirectTo=${encodeURIComponent(redirectTo)}`;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) return;

    setStatus({ kind: "submitting" });

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password
      });

      if (error) {
        const described = describeSignInError(error.message);
        if (described.kind === "unconfirmed") {
          setStatus({ kind: "unconfirmed", email: trimmedEmail });
        } else {
          setStatus({ kind: "error", message: described.text });
        }
        return;
      }

      router.replace(redirectTo);
      router.refresh();
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Sign in failed. Please try again."
      });
    }
  };

  const handleResend = async () => {
    if (status.kind !== "unconfirmed") return;
    const targetEmail = status.email;
    setStatus({ kind: "resending" });

    try {
      const supabase = createSupabaseBrowserClient();
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: targetEmail
      });
      if (error) {
        setStatus({ kind: "error", message: error.message });
        return;
      }
      setStatus({ kind: "resent", email: targetEmail });
    } catch (error) {
      setStatus({
        kind: "error",
        message:
          error instanceof Error ? error.message : "Couldn't resend the confirmation email."
      });
    }
  };

  if (status.kind === "resent") {
    return (
      <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-5">
        <p className="text-h3 text-emerald-900">Confirmation sent</p>
        <p className="mt-1 text-body text-emerald-800">
          We sent a new confirmation link to{" "}
          <span className="font-semibold">{status.email}</span>. Click it, then come
          back here to sign in.
        </p>
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

      <div>
        <div className="flex items-baseline justify-between">
          <label htmlFor="password" className="text-body font-semibold text-ink">
            Password
          </label>
          <Link
            href={forgotHref}
            className="text-caption text-cyan-700 underline-offset-2 transition hover:text-cyan-800 hover:underline"
          >
            Forgot password?
          </Link>
        </div>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-body text-ink focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
        />
      </div>

      <button
        type="submit"
        disabled={
          status.kind === "submitting" || !email.trim() || !password
        }
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 text-body font-semibold text-white transition hover:bg-cyan-800 disabled:opacity-60"
      >
        {status.kind === "submitting" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <LogIn className="h-4 w-4" />
        )}
        Sign in
      </button>

      {status.kind === "error" ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-body text-red-800">
          {status.message}
        </p>
      ) : null}

      {status.kind === "unconfirmed" || status.kind === "resending" ? (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-body text-amber-900">
          <p>
            Your email <span className="font-semibold">{status.kind === "unconfirmed" ? status.email : ""}</span>{" "}
            isn&apos;t confirmed yet. Check your inbox for the confirmation link.
          </p>
          <button
            type="button"
            onClick={handleResend}
            disabled={status.kind === "resending"}
            className="mt-2 inline-flex h-9 items-center gap-2 rounded-md border border-amber-300 bg-white px-3 text-caption font-semibold text-amber-900 transition hover:border-amber-400 hover:bg-amber-50 disabled:opacity-60"
          >
            {status.kind === "resending" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : null}
            Resend confirmation email
          </button>
        </div>
      ) : null}

      <p className="border-t border-slate-200 pt-4 text-caption text-slate-500">
        New to PlanSight?{" "}
        <Link
          href={signupHref}
          className="font-semibold text-cyan-700 underline-offset-2 transition hover:text-cyan-800 hover:underline"
        >
          Create an account
        </Link>
        .
      </p>
    </form>
  );
}
