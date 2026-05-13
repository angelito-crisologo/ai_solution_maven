"use client";

import Link from "next/link";
import { Loader2, Mail, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/auth/supabase-browser";

type Props = {
  redirectTo: string;
  /** Product slug to activate after the user confirms their email. */
  product?: string;
};

type Status =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "error"; message: string }
  | { kind: "sent"; email: string };

const MIN_PASSWORD_LENGTH = 8;

function describeSignUpError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("already registered") || lower.includes("already exists")) {
    return "An account with this email already exists. Try signing in instead.";
  }
  if (lower.includes("password") && lower.includes("short")) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`;
  }
  if (lower.includes("weak password") || lower.includes("weak_password")) {
    return `Password is too weak. Use at least ${MIN_PASSWORD_LENGTH} characters with a mix of letters and numbers.`;
  }
  return message || "Sign up failed. Please try again.";
}

export function SignUpForm({ redirectTo, product = "" }: Props) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  const signinHref = `/signin?redirectTo=${encodeURIComponent(redirectTo)}`;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) return;

    if (password.length < MIN_PASSWORD_LENGTH) {
      setStatus({
        kind: "error",
        message: `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`
      });
      return;
    }
    if (password !== confirmPassword) {
      setStatus({ kind: "error", message: "Passwords don't match." });
      return;
    }

    setStatus({ kind: "submitting" });

    try {
      const supabase = createSupabaseBrowserClient();
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("redirectTo", redirectTo);
      if (product) {
        callbackUrl.searchParams.set("product", product);
      }

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
        options: {
          emailRedirectTo: callbackUrl.toString()
        }
      });

      if (error) {
        setStatus({ kind: "error", message: describeSignUpError(error.message) });
        return;
      }

      // If email confirmation is disabled in Supabase, signUp returns a
      // session immediately and the user is signed in. Otherwise data.session
      // is null and we need to show the "check your email" state.
      if (data.session) {
        router.replace(redirectTo);
        router.refresh();
        return;
      }

      setStatus({ kind: "sent", email: trimmedEmail });
    } catch (error) {
      setStatus({
        kind: "error",
        message: error instanceof Error ? error.message : "Sign up failed. Please try again."
      });
    }
  };

  if (status.kind === "sent") {
    return (
      <div className="mt-6 rounded-md border border-emerald-200 bg-emerald-50 p-5">
        <div className="flex items-start gap-3">
          <Mail className="mt-0.5 h-5 w-5 shrink-0 text-emerald-800" />
          <div>
            <p className="text-h3 text-emerald-900">Confirm your email</p>
            <p className="mt-1 text-body text-emerald-800">
              We sent a confirmation link to{" "}
              <span className="font-semibold">{status.email}</span>. Click it to
              finish creating your account.
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

      <div>
        <label htmlFor="password" className="text-body font-semibold text-ink">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-body text-ink focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
        />
        <p className="mt-1 text-caption text-slate-500">
          At least {MIN_PASSWORD_LENGTH} characters.
        </p>
      </div>

      <div>
        <label htmlFor="confirmPassword" className="text-body font-semibold text-ink">
          Confirm password
        </label>
        <input
          id="confirmPassword"
          type="password"
          required
          minLength={MIN_PASSWORD_LENGTH}
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          className="mt-2 w-full rounded-md border border-slate-200 bg-white px-4 py-2.5 text-body text-ink focus:border-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-400/30"
        />
      </div>

      <button
        type="submit"
        disabled={
          status.kind === "submitting" || !email.trim() || !password || !confirmPassword
        }
        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-cyan-700 px-4 text-body font-semibold text-white transition hover:bg-cyan-800 disabled:opacity-60"
      >
        {status.kind === "submitting" ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <UserPlus className="h-4 w-4" />
        )}
        Create account
      </button>

      <p className="text-caption text-slate-500">
        By creating an account you agree to our{" "}
        <Link
          href="/products/plansight-ai/legal/terms"
          className="font-semibold text-slate-700 underline-offset-2 transition hover:text-cyan-700 hover:underline"
        >
          Terms of Service
        </Link>{" "}
        and{" "}
        <Link
          href="/products/plansight-ai/legal/privacy"
          className="font-semibold text-slate-700 underline-offset-2 transition hover:text-cyan-700 hover:underline"
        >
          Privacy Policy
        </Link>
        .
      </p>

      {status.kind === "error" ? (
        <p className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-body text-red-800">
          {status.message}
        </p>
      ) : null}

      <p className="border-t border-slate-200 pt-4 text-caption text-slate-500">
        Already have an account?{" "}
        <Link
          href={signinHref}
          className="font-semibold text-cyan-700 underline-offset-2 transition hover:text-cyan-800 hover:underline"
        >
          Sign in
        </Link>
        .
      </p>
    </form>
  );
}
